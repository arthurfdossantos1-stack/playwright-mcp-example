import Link from "next/link";
import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina, EstadoVazio } from "@/components/app/Cabecalho";
import { CopiarPrompt } from "@/components/app/CopiarPrompt";
import { formatarDataHora } from "@/lib/format";
import { inicioDoDiaBrasil } from "@/lib/fuso-brasil";
import { limitePadraoPrevias } from "@/lib/gemini";

export const metadata: Metadata = { title: "Prévias de site" };

type LinhaPrevia = {
  id: string;
  prompt_gerado: string;
  criado_em: string;
  empresas: { id: string; nome: string; website: string | null } | { id: string; nome: string; website: string | null }[] | null;
};

export default async function PaginaPrevias() {
  const supabase = await criarClienteServidor();

  const [{ data: previas }, { count: usadasHoje }] = await Promise.all([
    supabase
      .from("previas_site")
      .select("id, prompt_gerado, criado_em, empresas ( id, nome, website )")
      .order("criado_em", { ascending: false })
      .limit(50),
    supabase
      .from("previas_site")
      .select("id", { count: "exact", head: true })
      .gte("criado_em", inicioDoDiaBrasil().toISOString()),
  ]);

  const limite = limitePadraoPrevias();
  const lista = (previas ?? []) as unknown as LinhaPrevia[];

  return (
    <>
      <CabecalhoPagina
        titulo="Prévias de site"
        descricao="Histórico dos prompts gerados por IA para leads sem site — consulte de novo sem gastar sua cota diária."
        acao={
          <span className="rounded-full bg-marca-50 px-3 py-1.5 text-xs font-semibold text-marca-700">
            {Math.max(0, limite - (usadasHoje ?? 0))} de {limite} hoje
          </span>
        }
      />

      {lista.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma prévia gerada ainda"
          descricao="Abra uma empresa sem site nos Resultados ou no Radar e clique em “Gerar prévia” para criar o primeiro prompt."
          acao={
            <Link href="/app/radar" className="botao-primario">
              Ir para o Radar
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {lista.map((previa) => {
            const empresa = Array.isArray(previa.empresas) ? previa.empresas[0] : previa.empresas;
            return (
              <li key={previa.id} className="cartao p-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    {empresa?.nome ?? "Empresa removida"}
                  </h2>
                  <span className="text-xs text-slate-400">{formatarDataHora(previa.criado_em)}</span>
                </div>
                <CopiarPrompt texto={previa.prompt_gerado} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
