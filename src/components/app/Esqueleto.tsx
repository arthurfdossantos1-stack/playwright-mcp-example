/**
 * Esqueleto de carregamento.
 *
 * Toda tela do app consulta o Supabase antes de renderizar. Sem um
 * `loading.tsx`, o Next segura a tela ANTIGA até a resposta chegar — o clique
 * parece não ter funcionado e a pessoa clica de novo. Com ele, a troca é
 * instantânea e a espera fica visível no lugar certo.
 */
export function Esqueleto({ blocos = 4 }: { blocos?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando…</span>

      <div className="mb-6">
        <div className="h-7 w-52 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-2.5 h-4 w-full max-w-md animate-pulse rounded bg-slate-100" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: blocos }).map((_, i) => (
          <div key={i} className="cartao flex items-center gap-3 p-4">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div
                className="h-3.5 animate-pulse rounded bg-slate-200"
                style={{ width: `${68 - i * 9}%` }}
              />
              <div
                className="h-3 animate-pulse rounded bg-slate-100"
                style={{ width: `${48 - i * 6}%` }}
              />
            </div>
            <div className="hidden h-7 w-20 shrink-0 animate-pulse rounded-lg bg-slate-100 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
