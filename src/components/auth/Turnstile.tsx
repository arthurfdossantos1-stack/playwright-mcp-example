"use client";

import { useEffect, useRef } from "react";

export const CHAVE_TURNSTILE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type JanelaComTurnstile = Window & {
  turnstile?: {
    render: (
      alvo: HTMLElement,
      opcoes: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
        theme?: "auto" | "light" | "dark";
      },
    ) => string;
    reset: (id?: string) => void;
  };
};

/**
 * CAPTCHA do Cloudflare Turnstile (gratuito e sem custo por volume).
 *
 * Só aparece se NEXT_PUBLIC_TURNSTILE_SITE_KEY estiver configurada — sem ela o
 * componente não renderiza nada e o cadastro segue funcionando.
 *
 * Importante: quem realmente barra o robô é o Supabase. O token vai em
 * `options.captchaToken` e é o SERVIDOR de autenticação que o valida, então
 * não adianta o robô pular esta tela e chamar a API direto — é por isso que
 * o CAPTCHA precisa estar ligado também no painel do Supabase
 * (Authentication → Attack Protection → CAPTCHA).
 */
export function Turnstile({ aoResolver }: { aoResolver: (token: string | null) => void }) {
  const alvo = useRef<HTMLDivElement>(null);
  const idWidget = useRef<string | null>(null);

  useEffect(() => {
    if (!CHAVE_TURNSTILE || !alvo.current) return;

    const janela = window as JanelaComTurnstile;

    function renderizar() {
      const api = (window as JanelaComTurnstile).turnstile;
      if (!api || !alvo.current || idWidget.current) return;
      idWidget.current = api.render(alvo.current, {
        sitekey: CHAVE_TURNSTILE,
        theme: "auto",
        callback: (token) => aoResolver(token),
        "expired-callback": () => aoResolver(null),
        "error-callback": () => aoResolver(null),
      });
    }

    if (janela.turnstile) {
      renderizar();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = renderizar;
    document.head.appendChild(script);
  }, [aoResolver]);

  if (!CHAVE_TURNSTILE) return null;
  return <div ref={alvo} className="mt-4 flex justify-center" />;
}
