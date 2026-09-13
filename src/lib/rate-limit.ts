/**
 * Rate limit TECNICO.
 *
 * Isto NAO e um plano e nunca aparece na interface como limitacao de produto:
 * serve apenas para proteger a infraestrutura e a cota da Google Places API
 * contra rajadas e abuso. Todo usuario autenticado continua com acesso
 * ilimitado a buscas, templates, cadencias e projetos.
 *
 * Estrategia: janela deslizante em memoria (por instancia) com fallback
 * opcional no Postgres via a funcao `checar_rate_limit`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

type Janela = { inicio: number; contagem: number };

const memoria = new Map<string, Janela>();

export function limitePadrao(): number {
  const bruto = Number(process.env.RATE_LIMIT_BUSCAS_POR_MINUTO);
  return Number.isFinite(bruto) && bruto > 0 ? bruto : 10;
}

export function janelaPadraoSegundos(): number {
  const bruto = Number(process.env.RATE_LIMIT_JANELA_SEGUNDOS);
  return Number.isFinite(bruto) && bruto > 0 ? bruto : 60;
}

export type ResultadoRateLimit = {
  permitido: boolean;
  restante: number;
  reiniciaEm: number;
};

/** Janela deslizante em memoria (funciona bem em um unico processo). */
export function checarEmMemoria(
  chave: string,
  limite = limitePadrao(),
  janelaSegundos = janelaPadraoSegundos(),
): ResultadoRateLimit {
  const agora = Date.now();
  const janelaMs = janelaSegundos * 1000;
  const atual = memoria.get(chave);

  if (!atual || agora - atual.inicio > janelaMs) {
    memoria.set(chave, { inicio: agora, contagem: 1 });
    return { permitido: true, restante: limite - 1, reiniciaEm: agora + janelaMs };
  }

  atual.contagem += 1;
  const reiniciaEm = atual.inicio + janelaMs;

  if (atual.contagem > limite) {
    return { permitido: false, restante: 0, reiniciaEm };
  }

  return { permitido: true, restante: limite - atual.contagem, reiniciaEm };
}

/**
 * Versao distribuida: usa a funcao `checar_rate_limit` no Postgres.
 * Se a funcao nao existir (schema ainda nao aplicado), cai para a memoria.
 */
export async function checarNoBanco(
  supabase: SupabaseClient,
  chave: string,
  limite = limitePadrao(),
  janelaSegundos = janelaPadraoSegundos(),
): Promise<ResultadoRateLimit> {
  try {
    const { data, error } = await supabase.rpc("checar_rate_limit", {
      p_chave: chave,
      p_limite: limite,
      p_janela_segundos: janelaSegundos,
    });

    if (error) return checarEmMemoria(chave, limite, janelaSegundos);

    return {
      permitido: data === true,
      restante: data === true ? limite - 1 : 0,
      reiniciaEm: Date.now() + janelaSegundos * 1000,
    };
  } catch {
    return checarEmMemoria(chave, limite, janelaSegundos);
  }
}

/** Extrai o IP do request para compor a chave do rate limit. */
export function ipDoRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "desconhecido";
}

export function chaveRateLimit(escopo: string, userId: string | null, ip: string): string {
  return `${escopo}:${userId ?? "anon"}:${ip}`;
}
