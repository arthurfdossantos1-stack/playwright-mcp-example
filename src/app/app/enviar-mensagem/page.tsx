import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/app/Cabecalho";
import { FilaWhatsapp, type ItemFila } from "@/components/app/FilaWhatsapp";
import type { Template } from "@/lib/types";

export const metadata: Metadata = { title: "Enviar mensagem" };

type LinhaFila = {
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
  buscas: { nicho: string; cidade: string } | { nicho: string; cidade: string }[] | null;
};

export default async function PaginaEnviarMensagem() {
  const supabase = await criarClienteServidor();

  const [{ data: fila }, { data: templates }, { data: perfil }] = await Promise.all([
    supabase
      .from("empresas")
      .select(
        "id, nome, endereco, telefone, whatsapp_e164, nota, total_avaliacoes, instagram, website, prioridade, buscas ( nicho, cidade )",
      )
      .eq("whatsapp_verificado", true)
      .is("contatado_fila_em", null)
      .order("score_radar", { ascending: false })
      .limit(200),
    supabase.from("templates").select("*").order("criado_em", { ascending: false }),
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { data: null };
      return supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle();
    })(),
  ]);

  const itens: ItemFila[] = ((fila ?? []) as unknown as LinhaFila[]).map((linha) => {
    const busca = Array.isArray(linha.buscas) ? linha.buscas[0] : linha.buscas;
    return {
      id: linha.id,
      nome: linha.nome,
      endereco: linha.endereco,
      telefone: linha.telefone,
      whatsapp_e164: linha.whatsapp_e164,
      nota: linha.nota,
      total_avaliacoes: linha.total_avaliacoes,
      instagram: linha.instagram,
      website: linha.website,
      prioridade: linha.prioridade,
      nicho: busca?.nicho ?? null,
      cidade: busca?.cidade ?? null,
    };
  });

  return (
    <>
      <CabecalhoPagina
        titulo="Enviar mensagem"
        descricao="Percorra, um a um, os leads com WhatsApp em formato válido. Cada clique abre a conversa pronta — o envio continua manual, sem risco de bloqueio de número."
      />
      <FilaWhatsapp filaInicial={itens} templates={(templates ?? []) as Template[]} meuNome={perfil?.nome ?? ""} />
    </>
  );
}
