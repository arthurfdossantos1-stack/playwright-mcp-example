"use client";

import { reabrirAviso } from "@/lib/cookies";

/** Reabre o aviso de cookies para quem quiser mudar de ideia depois. */
export function BotaoPreferenciasCookies() {
  return (
    <button type="button" onClick={reabrirAviso} className="botao-secundario !py-2 !text-sm">
      Rever minhas preferências de cookies
    </button>
  );
}
