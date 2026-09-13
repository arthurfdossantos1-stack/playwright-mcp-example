import Link from "next/link";
import { Logo } from "./Logo";
import { SITE } from "@/lib/site";

const COLUNAS = [
  {
    titulo: "Produto",
    links: [
      { href: "/#inicio", rotulo: "Início" },
      { href: "/#como-funciona", rotulo: "Como funciona" },
      { href: "/#demonstracao", rotulo: "Demonstração" },
      { href: "/auth?modo=cadastro", rotulo: "Criar conta gratuita" },
    ],
  },
  {
    titulo: "Recursos",
    links: [
      { href: "/#recursos", rotulo: "Busca por nicho e cidade" },
      { href: "/#recursos", rotulo: "Radar de Oportunidades" },
      { href: "/#recursos", rotulo: "Templates de mensagem" },
      { href: "/#recursos", rotulo: "Follow-up e cadências" },
    ],
  },
  {
    titulo: "Conteúdos",
    links: [
      { href: "/conteudos", rotulo: "Todos os conteúdos" },
      { href: "/como-encontrar-clientes", rotulo: "Como encontrar clientes" },
      { href: "/guia-prospeccao-b2b", rotulo: "Guia de prospecção B2B" },
      { href: "/#faq", rotulo: "Perguntas frequentes" },
    ],
  },
  {
    titulo: "Legal",
    links: [
      { href: "/termos", rotulo: "Termos de uso" },
      { href: "/privacidade", rotulo: "Privacidade" },
      { href: "/cookies", rotulo: "Cookies" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              Prospecção B2B sem planilha e sem achismo: encontre empresas por nicho e cidade,
              priorize quem realmente precisa de você e acompanhe cada contato.
            </p>
            <p className="mt-4 text-sm text-slate-600">
              Fale com a gente:{" "}
              <a href={`mailto:${SITE.contato}`} className="font-medium text-marca-700 hover:underline">
                {SITE.contato}
              </a>
            </p>
          </div>

          {COLUNAS.map((coluna) => (
            <div key={coluna.titulo}>
              <h3 className="text-sm font-semibold text-slate-900">{coluna.titulo}</h3>
              <ul className="mt-4 space-y-2.5">
                {coluna.links.map((link) => (
                  <li key={`${coluna.titulo}-${link.rotulo}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 transition hover:text-marca-700"
                    >
                      {link.rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} RastroLead. Todos os direitos reservados.
          </p>
          <p className="text-xs text-slate-500">
            Dados públicos de empresas via Google Places. Feito no Brasil 🇧🇷
          </p>
        </div>
      </div>
    </footer>
  );
}
