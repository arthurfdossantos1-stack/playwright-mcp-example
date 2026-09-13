/**
 * Cadencias de follow-up.
 *
 * Uma cadencia e uma lista de etapas com deslocamento em dias a partir do
 * inicio (dia 0 = primeira mensagem, dia 3 = lembrete, dia 7 = ultimo contato).
 * Ao matricular um lead, geramos os follow-ups agendados; o worker/cron
 * dispara os que ja venceram.
 */

import type { CanalContato } from "@/lib/types";

export type EtapaParaAgendar = {
  id: string;
  dia_offset: number;
  canal: CanalContato;
  template_id: string | null;
  titulo: string | null;
};

export type FollowUpAgendado = {
  etapa_id: string;
  canal: CanalContato;
  agendado_para: string;
  mensagem: string | null;
};

/** Hora padrao de disparo (9h no fuso do servidor) para nao cair de madrugada. */
const HORA_PADRAO = 9;

export function dataDoOffset(inicio: Date, diaOffset: number): Date {
  const data = new Date(inicio.getTime());
  data.setDate(data.getDate() + diaOffset);
  if (diaOffset > 0) {
    data.setHours(HORA_PADRAO, 0, 0, 0);
  }
  return data;
}

/**
 * Gera os follow-ups de uma matricula. `mensagens` mapeia etapa_id -> texto
 * ja com as variaveis do template substituidas.
 */
export function agendarCadencia(
  etapas: EtapaParaAgendar[],
  inicio: Date,
  mensagens: Record<string, string | null> = {},
): FollowUpAgendado[] {
  return [...etapas]
    .sort((a, b) => a.dia_offset - b.dia_offset)
    .map((etapa) => ({
      etapa_id: etapa.id,
      canal: etapa.canal,
      agendado_para: dataDoOffset(inicio, etapa.dia_offset).toISOString(),
      mensagem: mensagens[etapa.id] ?? null,
    }));
}

/** Cadencia sugerida ao criar a conta. */
export const CADENCIA_PADRAO = {
  nome: "Cadência padrão (0 / 3 / 7)",
  descricao: "Primeira mensagem, lembrete no dia 3 e último contato no dia 7.",
  etapas: [
    { ordem: 1, dia_offset: 0, canal: "whatsapp" as const, titulo: "Primeira mensagem" },
    { ordem: 2, dia_offset: 3, canal: "whatsapp" as const, titulo: "Lembrete" },
    { ordem: 3, dia_offset: 7, canal: "whatsapp" as const, titulo: "Último contato" },
  ],
};

export function rotuloDia(diaOffset: number): string {
  if (diaOffset === 0) return "Dia 0 — imediato";
  if (diaOffset === 1) return "Dia 1 — no dia seguinte";
  return `Dia ${diaOffset}`;
}
