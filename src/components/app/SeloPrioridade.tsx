import { CLASSES_PRIORIDADE } from "@/lib/radar";
import { PRIORIDADE_CURTA, type PrioridadeRadar } from "@/lib/types";

export function SeloPrioridade({
  prioridade,
  intocado,
}: {
  prioridade: PrioridadeRadar;
  intocado?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${CLASSES_PRIORIDADE[prioridade]}`}
      >
        {PRIORIDADE_CURTA[prioridade]}
      </span>
      {intocado && (
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
          Intocado
        </span>
      )}
    </span>
  );
}
