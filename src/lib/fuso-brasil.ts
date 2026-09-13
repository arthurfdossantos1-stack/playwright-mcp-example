/**
 * Fuso horario do Brasil pra limites diarios (cota de previas de site).
 *
 * O Brasil aboliu o horario de verao em 2019: America/Sao_Paulo hoje e
 * sempre UTC-3, fixo. Por isso da pra calcular sem depender de uma lib de
 * timezone - so usamos Intl pra ler ano/mes/dia "vistos" no fuso de SP e
 * reconstruir a meia-noite local como um instante UTC.
 */

const FORMATADOR = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Meia-noite de "hoje" no fuso de Sao Paulo, como Date (instante UTC). */
export function inicioDoDiaBrasil(agora: Date = new Date()): Date {
  const partes = FORMATADOR.formatToParts(agora);
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);

  const ano = valor("year");
  const mes = valor("month");
  const dia = valor("day");

  // Meia-noite em UTC-3 == 03:00 UTC do mesmo dia civil brasileiro.
  return new Date(Date.UTC(ano, mes - 1, dia, 3, 0, 0, 0));
}

/** "27/03/2025" no fuso do Brasil - so pra exibir/depurar. */
export function dataBrasil(agora: Date = new Date()): string {
  return FORMATADOR.format(agora);
}
