/**
 * Fila de WhatsApp (envio manual via wa.me).
 *
 * "Verificado" aqui significa apenas: o telefone retornado pelo Google Places
 * tem FORMATO de celular brasileiro valido (DDI + DDD + 9 + 8 digitos).
 * Nao existe chamada a nenhuma API paga de verificacao de WhatsApp - o
 * objetivo e so filtrar numeros com cara de celular, nunca confirmar que a
 * conta tem WhatsApp ativo. A confirmacao real acontece quando o usuario
 * abre o wa.me manualmente.
 */

export type ResultadoWhatsapp = {
  e164: string | null;
  verificado: boolean;
};

/**
 * Normaliza um telefone brasileiro pra E.164 (556199998888) e diz se o
 * formato bate com celular (DDD + 9 + 8 digitos).
 *
 * Aceita o numero com ou sem DDI, com ou sem formatacao
 * (ex.: "(11) 98765-4321", "+55 11 98765-4321", "5511987654321").
 */
export function validarWhatsapp(telefone: string | null | undefined): ResultadoWhatsapp {
  if (!telefone) return { e164: null, verificado: false };

  const digitos = telefone.replace(/\D/g, "");

  // DDD (2) + 9 (celular) + 8 digitos = 11, sem DDI.
  if (digitos.length === 11 && digitos[2] === "9") {
    return { e164: `55${digitos}`, verificado: true };
  }

  // Mesma coisa, ja com o 55 na frente.
  if (digitos.length === 13 && digitos.startsWith("55") && digitos[4] === "9") {
    return { e164: digitos, verificado: true };
  }

  // Alguns numeros vem com o 0 de operadora tipo "0xx 11 98765-4321".
  if (digitos.length === 12 && digitos.startsWith("0") && digitos[3] === "9") {
    const semZero = digitos.slice(1);
    return { e164: `55${semZero}`, verificado: true };
  }

  return { e164: null, verificado: false };
}

/** Monta o link wa.me com a mensagem ja preenchida. */
export function linkWaMe(e164: string, mensagem: string): string {
  return `https://wa.me/${e164}?text=${encodeURIComponent(mensagem)}`;
}
