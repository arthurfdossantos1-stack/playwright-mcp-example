"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Barra inferior fixa para telas pequenas.
 *
 * O uso principal do produto é no celular, e o hambúrguer escondia justamente
 * as cinco ações do dia a dia. Alvos de 56px de altura, alcançáveis com o
 * polegar. O menu completo (templates, cadências, projetos, configurações)
 * continua no drawer, acessível pelo topo.
 */

const ITENS = [
  {
    href: "/app",
    rotulo: "Início",
    raiz: true,
    icone: <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" strokeLinejoin="round" />,
  },
  {
    href: "/app/buscar",
    rotulo: "Buscar",
    icone: (
      <>
        <circle cx="11" cy="11" r="6.2" />
        <path d="M15.8 15.8 20.4 20.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/app/radar",
    rotulo: "Radar",
    icone: (
      <>
        <path d="M12 3a9 9 0 1 0 9 9m-9-9v9m0-9 6 6" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2.2" />
      </>
    ),
  },
  {
    href: "/app/leads",
    rotulo: "Leads",
    icone: <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />,
  },
  {
    href: "/app/enviar-mensagem",
    rotulo: "Enviar",
    icone: <path d="m3 3 18 9-18 9 4.5-9L3 3Z" strokeLinejoin="round" />,
  },
];

export function NavInferior({
  pendentes,
  filaWhatsapp,
}: {
  pendentes: number;
  filaWhatsapp: number;
}) {
  const caminho = usePathname();

  function badge(href: string): number {
    if (href === "/app") return pendentes;
    if (href === "/app/enviar-mensagem") return filaWhatsapp;
    return 0;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      aria-label="Navegação principal"
    >
      {ITENS.map((item) => {
        const ativo = item.raiz ? caminho === item.href : caminho.startsWith(item.href);
        const contagem = badge(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={`relative flex min-h-14 flex-col items-center justify-center gap-1 text-[10.5px] font-semibold transition ${
              ativo ? "text-marca-600" : "text-slate-400"
            }`}
          >
            <span className="relative">
              <svg
                viewBox="0 0 24 24"
                className="h-[21px] w-[21px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                {item.icone}
              </svg>
              {contagem > 0 && (
                <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-[#ffffff]">
                  {contagem > 9 ? "9+" : contagem}
                </span>
              )}
            </span>
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
