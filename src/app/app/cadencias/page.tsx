import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/app/Cabecalho";
import { GerenciadorCadencias } from "@/components/app/GerenciadorCadencias";
import type { CadenciaComEtapas, Template } from "@/lib/types";

export const metadata: Metadata = { title: "Cadências de follow-up" };

export default async function PaginaCadencias() {
  const supabase = await criarClienteServidor();

  const [{ data: cadencias }, { data: templates }] = await Promise.all([
    supabase
      .from("cadencias")
      .select("*, cadencia_etapas ( * )")
      .order("criado_em", { ascending: false }),
    supabase.from("templates").select("*").order("nome"),
  ]);

  return (
    <>
      <CabecalhoPagina
        titulo="Cadências de follow-up"
        descricao="Monte a sequência antes de começar: dia 0 a primeira mensagem, dia 3 o lembrete, dia 7 o último contato. Ao matricular um lead, o RastroLead agenda tudo e o worker dispara os vencidos."
      />

      <GerenciadorCadencias
        cadencias={(cadencias ?? []) as CadenciaComEtapas[]}
        templates={(templates ?? []) as Template[]}
      />
    </>
  );
}
