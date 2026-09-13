"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/marketing/Logo";
import { criarClienteSupabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ITENS = [
  {
    href: "/app",
    rotulo: "Visão geral",
    icone: <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" />,
  },
  {
    href: "/app/buscar",
    rotulo: "Nova varredura",
    icone: (
      <path
        d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5.5 12.5L21 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
  },
  {
    href: "/app/radar",
    rotulo: "Radar",
    icone: (
      <path
        d="M12 3a9 9 0 1 0 9 9m-9-9v9m0-9 6 6m-6 3a3 3 0 1 0 0-.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
  },
  {
    href: "/app/leads",
    rotulo: "Leads",
    icone: (
      <path
        d="M4 6h16M7 12h10M10 18h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
  },
  {
    href: "/app/templates",
    rotulo: "Templates",
    icone: (
      <path
        d="M5 4h14v16l-7-3.5L5 20V4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/cadencias",
    rotulo: "Cadências",
    icone: (
      <path
        d="M8 3v4m8-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
  },
  {
    href: "/app/projetos",
    rotulo: "Projetos",
    icone: (
      <path
        d="M3 7h6l2 2h10v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/configuracoes",
    rotulo: "Configurações",
    icone: (
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8.4-3a8.4 8.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a8.3 8.3 0 0 0-2-1.2L15.6 2h-4l-.4 2.6c-.7.3-1.4.7-2 1.2l-2.3-1-2 3.5 2 1.5a8.4 8.4 0 0 0 0 2.4l-2 1.5 2 3.5 2.3-1c.6.5 1.3.9 2 1.2l.4 2.6h4l.4-2.6c.7-.3 1.4-.7 2-1.2l2.3 1 2-3.5-2-1.5c.1-.4.1-.8.1-1.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    ),
  },
];

export function NavegacaoApp({
  nome,
  email,
  pendentes,
}: {
  nome: string;
  email: string;
  pendentes: number;
}) {
  const caminho = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  async function sair() {
    const supabase = criarClienteSupabase();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const conteudoNav = (
    <>
      <nav className="flex-1 space-y-1 px-3" aria-label="Navegação do app">
        {ITENS.map((item) => {
          const ativo =
            item.href === "/app" ? caminho === "/app" : caminho.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setAberto(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                ativo
                  ? "bg-marca-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
                {item.icone}
              </svg>
              {item.rotulo}
              {item.href === "/app" && pendentes > 0 && (
                <span
                  className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    ativo ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {pendentes}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-marca-100 text-xs font-bold text-marca-700">
            {iniciais(nome || email)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate-900">
              {nome || "Sua conta"}
            </span>
            <span className="block truncate text-xs text-slate-500">{email}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={sair}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 17l5-5-5-5M20 12H9M12 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Topo mobile */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Logo href="/app" />
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-700"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={aberto}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            {aberto ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/30"
            onClick={() => setAberto(false)}
            aria-label="Fechar menu"
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white pt-4 shadow-xl">
            <div className="mb-4 px-5">
              <Logo href="/app" />
            </div>
            {conteudoNav}
          </aside>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-slate-200 bg-white pt-5 lg:flex">
        <div className="mb-5 px-5">
          <Logo href="/app" />
        </div>
        {conteudoNav}
      </aside>
    </>
  );
}

function iniciais(valor: string): string {
  const limpo = valor.trim();
  if (!limpo) return "RL";
  if (limpo.includes("@")) return limpo.slice(0, 2).toUpperCase();
  return limpo
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
