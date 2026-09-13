/**
 * Radar de Oportunidades.
 *
 * Prioriza automaticamente os resultados de uma varredura:
 *   - sem website              -> prioridade alta
 *   - poucas avaliacoes        -> prioridade media-alta
 *   - sem Instagram encontrado -> prioridade media
 *   - ainda fora do funil      -> marcado como "intocado"
 *
 * A heuristica e a mesma para todo mundo: nao existe prioridade "premium".
 */

import type { PrioridadeRadar } from "@/lib/types";

export const LIMITE_POUCAS_AVALIACOES = 10;
export const LIMITE_AVALIACOES_MODERADAS = 30;

export type EntradaRadar = {
  website?: string | null;
  instagram?: string | null;
  totalAvaliacoes?: number | null;
  nota?: number | null;
  telefone?: string | null;
};

export type ResultadoRadar = {
  prioridade: PrioridadeRadar;
  score: number;
  motivos: string[];
};

export function avaliarRadar(entrada: EntradaRadar): ResultadoRadar {
  const motivos: string[] = [];
  let score = 0;

  const semSite = !entrada.website;
  const avaliacoes = entrada.totalAvaliacoes ?? 0;
  const semInstagram = !entrada.instagram;

  if (semSite) {
    score += 50;
    motivos.push("Não tem site — oportunidade clara de presença digital");
  }

  if (avaliacoes < LIMITE_POUCAS_AVALIACOES) {
    score += 30;
    motivos.push(
      avaliacoes === 0
        ? "Nenhuma avaliação no Google — perfil pouco trabalhado"
        : `Apenas ${avaliacoes} avaliação${avaliacoes === 1 ? "" : "ões"} no Google`,
    );
  } else if (avaliacoes < LIMITE_AVALIACOES_MODERADAS) {
    score += 15;
    motivos.push(`Poucas avaliações no Google (${avaliacoes})`);
  }

  if (semInstagram) {
    score += 20;
    motivos.push("Nenhum Instagram encontrado no site");
  }

  if (!entrada.telefone) {
    score += 5;
    motivos.push("Sem telefone público no Google");
  }

  if (typeof entrada.nota === "number" && entrada.nota > 0 && entrada.nota < 4) {
    score += 10;
    motivos.push(`Nota baixa no Google (${entrada.nota.toFixed(1)})`);
  }

  return { prioridade: prioridadePorScore(score), score, motivos };
}

export function prioridadePorScore(score: number): PrioridadeRadar {
  if (score >= 50) return "alta";
  if (score >= 30) return "media_alta";
  if (score >= 15) return "media";
  return "baixa";
}

/** Empresas que o Radar destaca na tela /app/radar. */
export function ehOportunidadeQuente(
  prioridade: PrioridadeRadar,
  intocado: boolean,
): boolean {
  return intocado && (prioridade === "alta" || prioridade === "media_alta");
}

export const CLASSES_PRIORIDADE: Record<PrioridadeRadar, string> = {
  alta: "bg-rose-50 text-rose-700 ring-rose-200",
  media_alta: "bg-amber-50 text-amber-700 ring-amber-200",
  media: "bg-sky-50 text-sky-700 ring-sky-200",
  baixa: "bg-slate-100 text-slate-600 ring-slate-200",
};
