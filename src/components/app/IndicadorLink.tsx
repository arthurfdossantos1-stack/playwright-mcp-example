"use client";

import { useLinkStatus } from "next/link";

/**
 * Reação imediata ao toque em um link de navegação.
 *
 * `useLinkStatus` fica `pending` desde o clique até a nova tela chegar. Sem
 * isso o item do menu não muda de aparência enquanto o servidor responde, e
 * a pessoa acha que o clique não pegou — e clica de novo.
 *
 * Precisa ser renderizado DENTRO do <Link> a que se refere.
 */
export function IndicadorLink({
  className = "",
  cobrindo = false,
}: {
  className?: string;
  /** Cobre o conteúdo do link em vez de aparecer ao lado (barra inferior). */
  cobrindo?: boolean;
}) {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  const roda = (
    <span
      role="status"
      aria-label="Carregando"
      className={`h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60 ${className}`}
    />
  );

  if (!cobrindo) return roda;

  return <span className="absolute inset-0 grid place-items-center bg-white/85">{roda}</span>;
}
