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
              <div key={kpi.rotulo} className="cartao p-4">
                <p className="text-2xl font-bold leading-none text-slate-900">{kpi.valor}</p>
                <p className="mt-1.5 text-xs text-slate-500">{kpi.rotulo}</p>
              </div>
            ))}
          </div>

          <div className="cartao mb-5 p-4 text-sm text-slate-600">
            <strong className="font-semibold text-slate-900">Como o Radar decide:</strong> empresa
            sem site vira prioridade alta; poucas avaliações no Google levam à média-alta; ausência
            de Instagram soma como média. Quem ainda não entrou no funil fica marcado como intocado.
          </div>

          <ListaResultados empresas={empresas} />
        </>
      )}
    </>
  );
}
