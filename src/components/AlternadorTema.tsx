"use client";

import { useEffect, useState } from "react";
import { aplicarTema, gravarTema, lerTema, TEMAS, type Tema } from "@/lib/tema";

const ICONES: Record<Tema, React.ReactNode> = {
  claro: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path
        d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
        strokeLinecap="round"
      />
    </>
  ),
  escuro: <path d="M20 13.4A8.2 8.2 0 0 1 10.6 4a8.4 8.4 0 1 0 9.4 9.4Z" strokeLinejoin="round" />,
  sistema: (
    <>
      <rect x="2.8" y="4.2" width="18.4" height="12.4" rx="2" />
      <path d="M8.5 20h7M12 16.6V20" strokeLinecap="round" />
    </>
  ),
};

/**
 * Alterna claro / escuro / do sistema.
 *
 * Renderiza o ícone só depois de montar: no servidor não dá para saber o que
 * está no localStorage, e chutar causaria troca visível de ícone.
 */
export function AlternadorTema({ className = "" }: { className?: string }) {
  const [tema, setTema] = useState<Tema>("sistema");
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setTema(lerTema());
    setMontado(true);
  }, []);

  function proximo() {
    const indice = TEMAS.findIndex((t) => t.id === tema);
    const escolhido = TEMAS[(indice + 1) % TEMAS.length].id;
    setTema(escolhido);
    gravarTema(escolhido);
    aplicarTema(escolhido);
  }

  const atual = TEMAS.find((t) => t.id === tema) ?? TEMAS[2];

  return (
    <button
      type="button"
      onClick={proximo}
      title={`Tema: ${atual.rotulo} — clique para trocar`}
      aria-label={`Tema: ${atual.rotulo}. Clique para trocar.`}
      className={`inline-grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        {montado ? ICONES[tema] : ICONES.sistema}
      </svg>
    </button>
  );
}
