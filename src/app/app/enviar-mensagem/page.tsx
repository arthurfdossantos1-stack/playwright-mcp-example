import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/app/Cabecalho";
import { FilaWhatsapp, type ItemFila } from "@/components/app/FilaWhatsapp";
import type { LeadStatus, Template } from "@/lib/types";

export const metadata: Metadata = { title: "Enviar mensagem" };

type LinhaEmpresa = {
  id: string;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  whatsapp_e164: string | null;
  nota: number | null;
  total_avaliacoes: number;
  instagram: string | null;
  website: string | null;
  prioridade: ItemFila["prioridade"];
  score_radar: number;
  buscas: { nicho: string; cidade: string } | { nicho: string; cidade: string }[] | null;
  leads: { id: string; status: LeadStatus } | { id: string; status: LeadStatus }[] | null;
};

/**
 * A fila E o funil.
 *
 * Quem manda lead para ca e o botao "Enviar para o funil" das telas de
 * resultado e do radar: so aparecem aqui os leads que voce escolheu, que
 * ainda nao receberam mensagem e que tem celular valido no pais da busca.
 *
 * A consulta parte de EMPRESAS, nao de leads, de proposito. Partindo de leads,
 * os filtros de "tem celular" e "ainda nao contatado" caiam sobre a tabela
 * embutida e so davam para aplicar em JavaScript — ou seja, DEPOIS do
 * `limit`. Com 510 leads e so 85 elegiveis, o corte comia 47 deles antes do
 * filtro rodar e a fila aparecia quase vazia. Aqui os filtros pesados ficam
 * na tabela principal, entao o limite se aplica ao que ja passou por eles.
 */
export default async function PaginaEnviarMensagem() {
  const supabase = await criarClienteServidor();

  const [{ data: empresas }, { data: templates }, { data: perfil }] = await Promise.all([
    supabase
      .from("empresas")
      .select(
        "id, nome, endereco, telefone, whatsapp_e164, nota, total_avaliacoes, instagram, website, prioridade, score_radar, buscas ( nicho, cidade ), leads!inner ( id, status )",
      )
      .not("whatsapp_e164", "is", null)
      .is("contatado_fila_em", null)
      // Numero que o WhatsApp ja disse nao existir so faria perder tempo aqui.
      .is("whatsapp_invalido_em", null)
      // Quem pediu para nao receber fica fora de toda fila, sempre.
      .is("bloqueado_em", null)
      .in("leads.status", ["novo", "contatado"])
      .order("score_radar", { ascending: false })
      .limit(300),
    supabase.from("templates").select("*").order("criado_em", { ascending: false }),
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { data: null };
      return supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle();
    })(),
  ]);

  const itens: ItemFila[] = [];
  for (const linha of (empresas ?? []) as unknown as LinhaEmpresa[]) {
    const lead = Array.isArray(linha.leads) ? linha.leads[0] : linha.leads;
    // Rede de segurança: se o filtro da tabela embutida não pegar, o status
    // ainda é conferido aqui antes de o lead entrar na fila.
    if (!lead || (lead.status !== "novo" && lead.status !== "contatado")) continue;
    if (!linha.whatsapp_e164) continue;

    const busca = Array.isArray(linha.buscas) ? linha.buscas[0] : linha.buscas;
    itens.push({
      id: linha.id,
      leadId: lead.id,
      leadStatus: lead.status,
      nome: linha.nome,
      endereco: linha.endereco,
      telefone: linha.telefone,
      whatsapp_e164: linha.whatsapp_e164,
      nota: linha.nota,
      total_avaliacoes: linha.total_avaliacoes,
      instagram: linha.instagram,
      website: linha.website,
      prioridade: linha.prioridade,
      scoreRadar: linha.score_radar,
      nicho: busca?.nicho ?? null,
      cidade: busca?.cidade ?? null,
    });
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Enviar mensagem"
        descricao="Seu funil, um lead por vez. Cada clique abre a conversa já escrita e a fila anda na hora — o envio continua manual, sem risco de bloqueio de número."
      />
      <FilaWhatsapp
        filaInicial={itens}
        templates={(templates ?? []) as Template[]}
        meuNome={perfil?.nome ?? ""}
      />
    </>
  );
}
