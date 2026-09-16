import { statusDoLead, STATUS_LEAD, type SinaisStatus, type StatusLead } from "@/lib/status-lead";

/**
 * Chip de status do lead — a mesma leitura em toda tela do app.
 *
 * Aceita o status pronto ou os sinais crus (`lead_id`, `lead_status`,
 * `contatado_fila_em`), para nenhuma tela precisar repetir a regra.
 */
export function SeloStatus({
  status,
  sinais,
  curto = false,
  className = "",
}: {
  status?: StatusLead;
  sinais?: SinaisStatus;
  /** Rótulo abreviado, para colunas estreitas. */
  curto?: boolean;
  className?: string;
}) {
  const id = status ?? (sinais ? statusDoLead(sinais) : "novo");
  const descricao = STATUS_LEAD[id];

  return (
    <span
      title={descricao.rotulo}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ${descricao.classe} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${descricao.ponto}`} />
      {curto ? descricao.curto : descricao.rotulo}
    </span>
  );
}
