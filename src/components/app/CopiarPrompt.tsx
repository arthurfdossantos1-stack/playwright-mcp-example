"use client";

import { useState } from "react";

export function CopiarPrompt({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sem clipboard: o texto continua selecionável na tela */
    }
  }

  return (
    <div>
      <pre className="max-h-52 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
        {texto}
      </pre>
      <button
        type="button"
        onClick={copiar}
        className="mt-2 text-xs font-semibold text-marca-700 hover:underline"
      >
        {copiado ? "Copiado!" : "Copiar prompt"}
      </button>
    </div>
  );
}
