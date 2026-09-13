import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/app/Cabecalho";
import { ListaResultados } from "@/components/app/ListaResultados";
import { formatarDataHora } from "@/lib/format";
import type { EmpresaRadar } from "@/lib/types";

export const metadata: Metadata = { title: "Resultados da varredura" };

export default async function PaginaResultados({
  params,
}: {
  params: Promise<{ buscaId: string }>;
}) {
  const { buscaId } = await params;
  const supabase = await criarClienteServidor();

  const { data: busca } = await supabase
    .from("buscas")
    .select("*, projetos ( id, nome, cor )")
    .eq("id", buscaId)
    .maybeSingle();

  if (!busca) notFound();

  const { data: empresas } = await supabase
    .from("empresas_radar")
    .select("*")
    .eq("busca_id", buscaId)
    .order("score_radar", { ascending: false });

  const lista = (empresas ?? []) as EmpresaRadar[];
  const semSite = lista.filter((e) => !e.website).length;
  const semInstagram = lista.filter((e) => !e.instagram).length;
  const quentes = lista.filter(
    (e) => !e.lead_id && (e.prioridade === "alta" || e.prioridade === "media_alta"),
  ).length;

  const projeto = Array.isArray(busca.projetos) ? busca.projetos[0] : busca.projetos;

  return (
    <>
      <CabecalhoPagina
        titulo={`${busca.nicho} em ${busca.cidade}`}
        descricao={`Varredura de ${formatarDataHora(busca.criado_em)}${
          projeto ? ` · projeto ${(projeto as { nome: string }).nome}` : ""
        }`}
        acao={
          <Link href="/app/buscar" className="botao-secundario !px-3.5 !py-2 !text-sm">
            Nova varredura
          </Link>
        }
      />

      {busca.status === "erro" && (
        <div className="cartao mb-5 border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <strong className="font-semibold">A varredura falhou.</strong>{" "}
          {busca.erro ?? "Tente novamente em instantes."}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { valor: lista.length, rotulo: "empresas encontradas" },
          { valor: semSite, rotulo: "sem site" },
          { valor: semInstagram, rotulo: "sem Instagram" },
          { valor: quentes, rotulo: "no Radar" },
        ].map((kpi) => (
          <div key={kpi.rotulo} className="cartao p-4">
            <p className="text-2xl font-bold leading-none text-slate-900">{kpi.valor}</p>
            <p className="mt-1.5 text-xs text-slate-500">{kpi.rotulo}</p>
          </div>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="cartao px-6 py-14 text-center">
          <h2 className="text-base font-bold text-slate-900">Nenhuma empresa retornada</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
            A base do Google não trouxe resultados para esse termo. Tente um nicho mais comum ou uma
            grafia diferente da cidade.
          </p>
          <Link href="/app/buscar" className="botao-primario mt-6">
            Tentar outra varredura
          </Link>
        </div>
      ) : (
        <ListaResultados empresas={lista} />
      )}
    </>
  );
}
