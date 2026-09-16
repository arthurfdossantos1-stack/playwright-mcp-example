/**
 * Consentimento de cookies.
 *
 * O RastroLead so grava cookies estritamente necessarios (a sessao do
 * Supabase). A categoria "medicao" existe para que qualquer script futuro
 * tenha de perguntar antes: por padrao ela e NAO, e nada deve ser carregado
 * sem `medicaoPermitida()` retornar true.
 */

export const CHAVE_COOKIES = "rastrolead:cookies";

export type PreferenciaCookies = {
  /** Sessao e seguranca. Sempre ligados: sem eles nao da para entrar. */
  essenciais: true;
  /** Medicao de uso. Padrao: desligado. */
  medicao: boolean;
  /** ISO da data em que a pessoa decidiu. */
  decididoEm: string;
};

export function lerPreferencia(): PreferenciaCookies | null {
  try {
    const bruto = localStorage.getItem(CHAVE_COOKIES);
    if (!bruto) return null;
    const dados = JSON.parse(bruto) as Partial<PreferenciaCookies>;
    if (typeof dados.medicao !== "boolean" || !dados.decididoEm) return null;
    return { essenciais: true, medicao: dados.medicao, decididoEm: dados.decididoEm };
  } catch {
    return null;
  }
}

export function gravarPreferencia(medicao: boolean): PreferenciaCookies {
  const preferencia: PreferenciaCookies = {
    essenciais: true,
    medicao,
    decididoEm: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CHAVE_COOKIES, JSON.stringify(preferencia));
    // Espelhado em cookie para o servidor poder respeitar a escolha tambem.
    document.cookie = `rastrolead_cookies=${medicao ? "medicao" : "essenciais"}; path=/; max-age=${
      60 * 60 * 24 * 365
    }; SameSite=Lax`;
  } catch {
    /* sem storage a escolha vale so para esta navegacao */
  }
  window.dispatchEvent(new CustomEvent("rastrolead:cookies", { detail: preferencia }));
  return preferencia;
}

/** Use antes de carregar qualquer script de medicao. */
export function medicaoPermitida(): boolean {
  return lerPreferencia()?.medicao === true;
}

/** Reabre o aviso para a pessoa mudar de ideia (link na politica de cookies). */
export function reabrirAviso() {
  try {
    localStorage.removeItem(CHAVE_COOKIES);
  } catch {
    /* ignorado */
  }
  window.dispatchEvent(new CustomEvent("rastrolead:cookies-reabrir"));
}
