"use client";

import { useEffect, useState } from "react";

export const CHAVE_AVISOS = "rastrolead:avisos-busca";

/**
 * Avisos da última varredura.
 *
 * Aviso não é erro: a varredura terminou, mas algo não rodou por inteiro —
 * tipicamente o Google recusando os detalhes por cota, o que deixa empresas
 * sem telefone e sem site. Antes isso passava em silêncio e parecia que os
 * negócios é que não tinham telefone.
 *
 * Vem por sessionStorage porque quem faz a chamada é a tela de busca e quem
 * mostra é a de resultados, depois de uma navegação.
 */
export function AvisosDaBusca() {
  const [avisos, setAvisos] = useState<string[]>([]);

  useEffect(() => {
    try {
      const bruto = sessionStorage.getItem(CHAVE_AVISOS);
      if (!bruto) return;
      sessionStorage.removeItem(CHAVE_AVISOS);
      const dados = JSON.parse(bruto);
      if (Array.isArray(dados) && dados.length > 0) setAvisos(dados.map(String));
    } catch {
      /* sem storage não há aviso a mostrar */
    }
  }, []);

  if (avisos.length === 0) return null;

  return (
    <div
      className="anim-entrada mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4"
      role="status"
    >
      <div className="flex gap-3">
        <svg
          viewBox="0 0 24 24"
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            d="M12 8v5m0 3.5h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="min-w-0 space-y-1.5">
          {avisos.map((aviso) => (
            <p key={aviso} className="text-sm leading-relaxed text-amber-900">
              {aviso}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
