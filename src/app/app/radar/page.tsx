import Link from "next/link";
import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina, EstadoVazio } from "@/components/app/Cabecalho";
import { ListaResultados } from "@/components/app/ListaResultados";
import type { EmpresaRadar } from "@/lib/types";

export const metadata: Metadata = { title: "Radar de Oportunidades" };

/**
 * Radar: apenas os leads de alta prioridade ainda intocados.
 * Mesma heuristica para todas as contas — nao existe "radar premium".
 */
export default async function PaginaRadar() {
  const supabase = await criarClienteServidor();

  const { data } = await supabase
    .from("empresas_radar")
    .select("*")
    .in("prioridade", ["alta", "media_alta"])
    .is("lead_id", null)
    .order("score_radar", { ascending: false })
    .limit(300);

  const empresas = (data ?? []) as EmpresaRadar[];

  const semSite = empresas.filter((e) => !e.website).length;
  const poucasAvaliacoes = empresas.filter((e) => e.total_avaliacoes < 10).length;
  const semInstagram = empresas.filter((e) => !e.instagram).length;

  return (
    <>
      <CabecalhoPagina
        titulo="Radar de Oportunidades"
        descricao="Só o topo da fila: empresas de prioridade alta ou média-alta que você ainda não moveu para o funil."
        acao={
          <Link href="/app/buscar" className="botao-secundario !px-3.5 !py-2 !text-sm">
            Nova varredura
          </Link>
        }
      />

      {empresas.length === 0 ? (
        <EstadoVazio
          titulo="O Radar está vazio"
          descricao="Rode uma varredura por nicho e cidade. As empresas sem site, com poucas avaliações ou sem Instagram aparecem aqui automaticamente."
          acao={
            <Link href="/app/buscar" className="botao-primario">
              Fazer uma varredura
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { valor: empresas.length, rotulo: "oportunidades no radar" },
              { valor: semSite, rotulo: "sem site" },
              { valor: poucasAvaliacoes, rotulo: "com poucas avaliações" },
              { valor: semInstagram, rotulo: "sem Instagram" },
            ].map((kpi) => (
              <div key={kpi.rotulo} className="tile-num">
                <strong className="text-slate-900">{kpi.valor}</strong>
                <span>{kpi.rotulo}</span>
              </div>
            ))}
          </div>

          {/* Nota de método: filete tracejado, o bloco mais leve da tela. */}
          <div className="mb-5 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm leading-relaxed text-slate-600">
            <strong className="font-semibold text-slate-900">Como o Radar ordena:</strong> sem site
            pesa mais, poucas avaliações vêm em seguida, ausência de Instagram soma. Quem já está no
            funil sai da fila.
          </div>

          <ListaResultados empresas={empresas} />
        </>
      )}
    </>
  );
}
