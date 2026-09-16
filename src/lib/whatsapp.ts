/**
 * Fila de WhatsApp (envio manual via wa.me).
 *
 * "Verificado" aqui significa apenas: o telefone retornado pelo Google Places
 * tem FORMATO de celular válido no país da varredura. Não existe chamada a
 * nenhuma API paga de verificação - o objetivo é só filtrar números com cara
 * de celular, nunca confirmar que a conta tem WhatsApp ativo. A confirmação
 * real acontece quando o usuário abre o wa.me manualmente.
 */

import { acharPais, PAIS_PADRAO } from "@/lib/paises";

export type ResultadoWhatsapp = {
  e164: string | null;
  verificado: boolean;
};

/**
 * Normaliza um telefone para E.164 e diz se o formato bate com celular
 * no país informado.
 *
 * Aceita o número com ou sem DDI, com ou sem formatação
 * (ex.: "(11) 98765-4321", "+55 11 98765-4321", "+1 305-555-0142").
 */
export function validarWhatsapp(
  telefone: string | null | undefined,
  codigoPais: string = PAIS_PADRAO,
): ResultadoWhatsapp {
  if (!telefone) return { e164: null, verificado: false };

  const pais = acharPais(codigoPais);
  let digitos = telefone.replace(/\D/g, "");

  // Já veio com o DDI na frente: separa para validar só a parte nacional.
  if (digitos.startsWith(pais.ddi)) {
    const semDdi = digitos.slice(pais.ddi.length);
    if (pais.digitosNacionais.includes(semDdi.length)) {
      digitos = semDdi;
    }
  }

  // Zero de operadora/tronco na frente (comum em BR e AR).
  if (digitos.startsWith("0") && !pais.digitosNacionais.includes(digitos.length)) {
    digitos = digitos.slice(1);
  }

  if (!pais.digitosNacionais.includes(digitos.length)) {
    return { e164: null, verificado: false };
  }

  if (!pais.celular(digitos)) {
    return { e164: null, verificado: false };
  }

  return { e164: `${pais.ddi}${digitos}`, verificado: true };
}

/** Monta o link wa.me com a mensagem já preenchida. */
export function linkWaMe(e164: string, mensagem = ""): string {
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${e164}${texto}`;
}

/**
 * Link de WhatsApp de uma empresa já gravada.
 *
 * Usa o E.164 normalizado na varredura (que já considerou o país da busca).
 * Como fallback aceita só telefone que veio em formato internacional do
 * Google ("+34 ..."), porque um número nacional sem DDI não dá para montar
 * link confiável fora do Brasil — melhor não oferecer o botão do que mandar
 * a pessoa para um número errado.
 */
export function linkWhatsappEmpresa(
  empresa: { whatsapp_e164: string | null; telefone: string | null },
  mensagem = "",
): string | null {
  if (empresa.whatsapp_e164) return linkWaMe(empresa.whatsapp_e164, mensagem);

  const telefone = empresa.telefone?.trim() ?? "";
  if (!telefone.startsWith("+")) return null;

  const digitos = telefone.replace(/\D/g, "");
  return digitos.length >= 8 ? linkWaMe(digitos, mensagem) : null;
}
