"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Rotulos legiveis por segmento da URL. Segmentos fora daqui (ex.: um uuid) somem da trilha. */
const ROTULOS: Record<string, string> = {
  buscar: "Nova varredura",
  resultados: "Resultados",
  radar: "Radar",
  leads: "Leads",
  "enviar-mensagem": "Enviar mensagem",
  previas: "Prévias",
  templates: "Templates",
  cadencias: "Cadências",
  projetos: "Projetos",
  configuracoes: "Configurações",
};

/**
 * Trilha "Você está em" no topo de cada pagina interna do app.
 * Deriva da URL automaticamente - nao precisa passar props em cada pagina.
 */
export function Migalhas() {
  const caminho = usePathname();
  const segmentos = caminho.split("/").filter(Boolean).slice(1); // remove "app"

  if (segmentos.length === 0) return null; // esta em /app (a propria visao geral)

  const trilha = segmentos
    .map((segmento, indice) => ({
      rotulo: ROTULOS[segmento],
      href: `/app/${segmentos.slice(0, indice + 1).join("/")}`,
    }))
    .filter((item) => item.rotulo);

  if (trilha.length === 0) return null;

  return (
    <nav aria-label="Você está em" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
      <Link href="/app" className="transition hover:text-slate-800">
        Visão geral
      </Link>
      {trilha.map((item, indice) => {
        const ultimo = indice === trilha.length - 1;
        return (
          <span key={item.href} className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {ultimo ? (
              <span className="font-semibold text-slate-700" aria-current="page">
                {item.rotulo}
              </span>
            ) : (
              <Link href={item.href} className="transition hover:text-slate-800">
                {item.rotulo}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
