import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/app/Cabecalho";
import { GerenciadorProjetos, type ProjetoComContagem } from "@/components/app/GerenciadorProjetos";
import type { Projeto } from "@/lib/types";

export const metadata: Metadata = { title: "Projetos" };

export default async function PaginaProjetos() {
  const supabase = await criarClienteServidor();

  const [{ data: projetos }, { data: buscas }, { data: leads }] = await Promise.all([
    supabase.from("projetos").select("*").order("criado_em", { ascending: false }),
    supabase.from("buscas").select("projeto_id"),
    supabase.from("leads").select("projeto_id"),
  ]);

  const contarPor = (linhas: { projeto_id: string | null }[] | null) => {
    const mapa = new Map<string, number>();
    for (const linha of linhas ?? []) {
      if (!linha.projeto_id) continue;
      mapa.set(linha.projeto_id, (mapa.get(linha.projeto_id) ?? 0) + 1);
    }
    return mapa;
  };

  const porBusca = contarPor(buscas);
  const porLead = contarPor(leads);

  const lista: ProjetoComContagem[] = ((projetos ?? []) as Projeto[]).map((projeto) => ({
    ...projeto,
    totalBuscas: porBusca.get(projeto.id) ?? 0,
    totalLeads: porLead.get(projeto.id) ?? 0,
  }));

  return (
    <>
      <CabecalhoPagina
        titulo="Projetos"
        descricao="Organize varreduras e leads por cliente ou campanha. Crie quantos projetos quiser — o recurso está liberado para todas as contas."
      />
      <GerenciadorProjetos projetos={lista} />
    </>
  );
}
