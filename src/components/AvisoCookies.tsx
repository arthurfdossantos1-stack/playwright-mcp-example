"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { gravarPreferencia, lerPreferencia } from "@/lib/cookies";

/**
 * Aviso de cookies.
 *
 * Aparece só enquanto não houver escolha registrada. Nada é carregado antes
 * da resposta: hoje o site só grava o cookie de sessão, e a categoria de
 * medição já nasce desligada — recusar não muda nada no funcionamento.
 */
export function AvisoCookies() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    setVisivel(lerPreferencia() === null);

    function reabrir() {
      setVisivel(true);
    }
    window.addEventListener("rastrolead:cookies-reabrir", reabrir);
    return () => window.removeEventListener("rastrolead:cookies-reabrir", reabrir);
  }, []);

  function decidir(medicao: boolean) {
    gravarPreferencia(medicao);
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="anim-entrada fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4"
    >
      <div className="cartao mx-auto flex max-w-3xl flex-col gap-3 p-4 shadow-lg sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-slate-600">
          Usamos só cookies necessários para manter você conectado. Nada de rastreamento por
          padrão.{" "}
          <Link href="/cookies" className="font-semibold text-marca-700 hover:underline">
            Ver a política
          </Link>
          .
        </p>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decidir(false)}
            className="botao-secundario flex-1 !px-3.5 !py-2 !text-sm sm:flex-none"
          >
            Só os necessários
          </button>
          <button
            type="button"
            onClick={() => decidir(true)}
            className="botao-primario flex-1 !px-3.5 !py-2 !text-sm sm:flex-none"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}
