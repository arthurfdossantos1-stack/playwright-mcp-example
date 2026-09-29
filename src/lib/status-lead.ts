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
 * Duas escalas dividem a mesma linha da lista: este status e a prioridade do
 * Radar (`CLASSES_PRIORIDADE`). Enquanto as duas usavam as mesmas cores, a
 * cor nao significava nada — ambar era "Enviada" AQUI, "Media-alta" LA, e
 * ainda o ponto da aba "Respondeu". Quem olhava nao tinha como aprender.
 *
 * Agora o Radar fica com a rampa de urgencia (rosa > ambar > azul > cinza) e
 * este status nao encosta nela. Aqui a cor so aparece quando diz algo que a
 * aba do estagio nao diz:
 *
 *   - respondeu -> violeta: tem conversa aberta esperando voce.
 *   - fechado   -> verde:   acabou, deu certo.
 *   - o resto   -> cinza:   quem informa e a PALAVRA, nao o tom.
 *
 * Cinza tambem e "prioridade baixa" no Radar, e isso e proposital: nas duas
 * escalas cinza quer dizer a mesma coisa — nada que mereca sua atencao.
 */
export const STATUS_LEAD: Record<StatusLead, DescricaoStatus> = {
  novo: {
    rotulo: "Novo lead",
    curto: "Novo",
    classe: "bg-slate-100 text-slate-700 ring-slate-200",
    ponto: "bg-slate-400",
  },
  no_funil: {
    rotulo: "No funil",
    curto: "Funil",
    classe: "bg-slate-100 text-slate-700 ring-slate-300",
    ponto: "bg-slate-500",
  },
  mensagem_enviada: {
    rotulo: "Mensagem enviada",
    curto: "Enviada",
    classe: "bg-slate-200 text-slate-800 ring-slate-300",
    ponto: "bg-slate-700",
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

/**
 * Estagio do funil (`leads.status`) -> status derivado.
 *
 * Existe para as abas do funil tirarem a cor do ponto DAQUI, e nao de uma
 * segunda tabela de cores. Antes havia duas: a aba pintava "Respondeu" de
 * ambar enquanto o selo da mesma linha pintava de violeta.
 */
export const STATUS_DO_ESTAGIO: Record<LeadStatus, StatusLead> = {
  novo: "novo",
  contatado: "mensagem_enviada",
  respondeu: "respondeu",
  fechado: "fechado",
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
