import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/app/Cabecalho";
import { FilaWhatsapp, type ItemFila } from "@/components/app/FilaWhatsapp";
import type { LeadStatus, Template } from "@/lib/types";

export const metadata: Metadata = { title: "Enviar mensagem" };

type EmpresaDaFila = {
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
  contatado_fila_em: string | null;
  buscas: { nicho: string; cidade: string } | { nicho: string; cidade: string }[] | null;
};

type LinhaLead = {
  id: string;
  status: LeadStatus;
  empresas: EmpresaDaFila | EmpresaDaFila[] | null;
};

/**
 * A fila E o funil.
 *
 * Quem manda lead para ca e o botao "Enviar para o funil" das telas de
 * resultado e do radar: so aparecem aqui os leads que voce escolheu, que
 * ainda nao receberam mensagem e que tem celular valido no pais da busca.
 */
export default async function PaginaEnviarMensagem() {
  const supabase = await criarClienteServidor();

  const [{ data: leads }, { data: templates }, { data: perfil }] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, status, empresas!inner ( id, nome, endereco, telefone, whatsapp_e164, nota, total_avaliacoes, instagram, website, prioridade, score_radar, contatado_fila_em, buscas ( nicho, cidade ) )",
      )
      .in("status", ["novo", "contatado"])
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
  for (const linha of (leads ?? []) as unknown as LinhaLead[]) {
    const empresa = Array.isArray(linha.empresas) ? linha.empresas[0] : linha.empresas;
    if (!empresa) continue;
    // Sem celular válido não dá para abrir o wa.me; já contatado saiu da fila.
    if (!empresa.whatsapp_e164 || empresa.contatado_fila_em) continue;

    const busca = Array.isArray(empresa.buscas) ? empresa.buscas[0] : empresa.buscas;
    itens.push({
      id: empresa.id,
      leadId: linha.id,
      leadStatus: linha.status,
      nome: empresa.nome,
      endereco: empresa.endereco,
      telefone: empresa.telefone,
      whatsapp_e164: empresa.whatsapp_e164,
      nota: empresa.nota,
      total_avaliacoes: empresa.total_avaliacoes,
      instagram: empresa.instagram,
      website: empresa.website,
      prioridade: empresa.prioridade,
      scoreRadar: empresa.score_radar,
      nicho: busca?.nicho ?? null,
      cidade: busca?.cidade ?? null,
    });
  }
  itens.sort((a, b) => b.scoreRadar - a.scoreRadar);

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
