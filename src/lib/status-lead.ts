/**
 * Status de trabalho de um lead — o que aparece na coluna "Status" da lista.
 *
 * Nao e um campo do banco: e derivado de tres sinais que ja existem
 * (`leads.status`, `leads.id` e `empresas.contatado_fila_em`), para a lista
 * mostrar em uma palavra em que pe esta a abordagem daquela empresa.
 *
 * A ordem tambem e a do funil, entao serve para ordenar a lista.
 */

import type { LeadStatus } from "@/lib/types";

export type StatusLead =
  | "novo"
  | "no_funil"
  | "mensagem_enviada"
  | "respondeu"
  | "fechado";

export type DescricaoStatus = {
  /** Texto completo, usado no desktop e no aria-label. */
  rotulo: string;
  /** Versao curta, para a coluna estreita do celular. */
  curto: string;
  /** Cor do chip (fundo + texto + anel). */
  classe: string;
  /** Cor do ponto que antecede o texto. */
  ponto: string;
};

/**
 * Cada etapa tem cor propria: a lista inteira em cinza nao diz nada de
 * relance, que era exatamente o problema da versao anterior.
 */
export const STATUS_LEAD: Record<StatusLead, DescricaoStatus> = {
  novo: {
    rotulo: "Novo lead",
    curto: "Novo",
    classe: "bg-slate-100 text-slate-600 ring-slate-200",
    ponto: "bg-slate-400",
  },
  no_funil: {
    rotulo: "No funil",
    curto: "Funil",
    classe: "bg-marca-50 text-marca-700 ring-marca-200",
    ponto: "bg-marca-500",
  },
  mensagem_enviada: {
    rotulo: "Mensagem enviada",
    curto: "Enviada",
    classe: "bg-amber-50 text-amber-700 ring-amber-200",
    ponto: "bg-amber-500",
  },
  respondeu: {
    rotulo: "Respondeu",
    curto: "Resp.",
    classe: "bg-violet-50 text-violet-700 ring-violet-200",
    ponto: "bg-violet-500",
  },
  fechado: {
    rotulo: "Fechado",
    curto: "Fechado",
    classe: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    ponto: "bg-emerald-500",
  },
};

export const ORDEM_STATUS: StatusLead[] = [
  "novo",
  "no_funil",
  "mensagem_enviada",
  "respondeu",
  "fechado",
];

export type SinaisStatus = {
  lead_id: string | null;
  lead_status: LeadStatus | null;
  contatado_fila_em: string | null;
};

/**
 * Deriva o status a partir dos sinais da empresa.
 *
 * `contatado_fila_em` e marcado quando o usuario abre o wa.me pela fila de
 * WhatsApp — por isso ele vale como "mensagem enviada" mesmo que o lead
 * ainda esteja como "novo" no funil.
 */
export function statusDoLead(sinais: SinaisStatus): StatusLead {
  if (sinais.lead_status === "fechado") return "fechado";
  if (sinais.lead_status === "respondeu") return "respondeu";
  if (sinais.lead_status === "contatado" || sinais.contatado_fila_em) {
    return "mensagem_enviada";
  }
  if (sinais.lead_id) return "no_funil";
  return "novo";
}
