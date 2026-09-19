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

/**
 * Radar de um lead vindo do INSTAGRAM.
 *
 * Os sinais sao outros. No Google, "nao tem site" ja e quase tudo. Aqui o que
 * vale e a combinacao: perfil ATIVO e SEM site e o cliente ideal de quem vende
 * site — o negocio existe, posta, tem publico, e a presenca digital para
 * quando acaba o feed. Conta parada sem site nao e oportunidade, e abandono.
 */
export type EntradaRadarInstagram = {
  siteNaBio?: boolean;
  seguidores?: number | null;
  publicacoes?: number | null;
  telefone?: string | null;
  ehNegocio?: boolean;
};

/** Faixa de um negocio local de verdade: nem conta morta, nem influenciador. */
export const SEGUIDORES_MIN_NEGOCIO = 300;
export const SEGUIDORES_MAX_NEGOCIO = 20000;

export function avaliarRadarInstagram(entrada: EntradaRadarInstagram): ResultadoRadar {
  const motivos: string[] = [];
  let score = 0;

  const seguidores = entrada.seguidores ?? 0;
  const publicacoes = entrada.publicacoes ?? 0;

  if (!entrada.siteNaBio) {
    score += 50;
    motivos.push("Nenhum site na bio — oportunidade clara de presença digital");
  }

  // Atividade e a diferenca entre "negocio que precisa de site" e "conta
  // abandonada". Perfil parado PERDE ponto: sem site + sem uso nao e
  // oportunidade, e um negocio que provavelmente nem existe mais.
  if (publicacoes >= 30) {
    score += 15;
    motivos.push(`Perfil ativo (${publicacoes} publicações)`);
  } else if (publicacoes >= 10) {
    score += 5;
    motivos.push(`Perfil pouco usado (${publicacoes} publicações)`);
  } else {
    score -= 25;
    motivos.push(`Perfil parado (${publicacoes} publicações)`);
  }

  // Fora da faixa de negocio local o lead vale menos: conta minuscula ainda
  // nao tem o que vender, e influenciador/marca grande nao e quem contrata
  // site de quem prospecta aqui.
  if (seguidores >= SEGUIDORES_MIN_NEGOCIO && seguidores <= SEGUIDORES_MAX_NEGOCIO) {
    score += 15;
    motivos.push(`Público de negócio local (${seguidores.toLocaleString("pt-BR")} seguidores)`);
  } else if (seguidores > SEGUIDORES_MAX_NEGOCIO) {
    score -= 30;
    motivos.push(`Público grande demais para o perfil de cliente (${seguidores.toLocaleString("pt-BR")} seguidores)`);
  } else {
    score -= 10;
    motivos.push(`Público ainda pequeno (${seguidores.toLocaleString("pt-BR")} seguidores)`);
  }

  if (!entrada.telefone) {
    score += 5;
    motivos.push("Sem telefone público no perfil");
  }

  if (!entrada.ehNegocio) {
    score += 8;
    motivos.push("Perfil pessoal, não conta comercial");
  }

  const final = Math.max(0, score);
  return { prioridade: prioridadePorScore(final), score: final, motivos };
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
