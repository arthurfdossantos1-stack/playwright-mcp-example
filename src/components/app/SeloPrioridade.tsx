import { CLASSES_PRIORIDADE } from "@/lib/radar";
import { PRIORIDADE_CURTA, PRIORIDADE_LABEL, type PrioridadeRadar } from "@/lib/types";

/**
 * Selo de prioridade do Radar.
 *
 * Anda lado a lado com o `SeloStatus` na mesma linha da lista, e as duas
 * escalas nao dizem a mesma coisa: esta e urgencia, a outra e em que pe esta
 * a abordagem. Por isso a forma difere — aqui canto reto e sem ponto, la
 * pilula com ponto —, alem das cores nao se cruzarem mais. So a forma ja
 * separa as duas quando a lista esta em preto e branco ou o leitor nao
 * distingue as cores.
 */
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
        title={`Radar: ${PRIORIDADE_LABEL[prioridade].toLowerCase()}`}
        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ring-1 ${CLASSES_PRIORIDADE[prioridade]}`}
      >
        {PRIORIDADE_CURTA[prioridade]}
      </span>
      {intocado && (
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
          Intocado
        </span>
      )}
    </span>
  );
}
