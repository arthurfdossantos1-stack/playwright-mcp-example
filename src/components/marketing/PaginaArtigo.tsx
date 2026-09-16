import Link from "next/link";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { renderizarMarkdown, type Artigo } from "@/lib/conteudo";

export async function PaginaArtigo({ artigo }: { artigo: Artigo }) {
  const html = await renderizarMarkdown(artigo.conteudoMarkdown);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-marca-700">
            Início
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/conteudos" className="hover:text-marca-700">
            Conteúdos
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-700">{artigo.categoria}</span>
        </nav>

        <header className="border-b border-slate-200 pb-8">
          <span className="inline-flex rounded-full bg-marca-50 px-2.5 py-1 text-xs font-semibold text-marca-700">
            {artigo.categoria}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-[2.5rem]">
            {artigo.titulo}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">{artigo.resumo}</p>
          <p className="mt-4 text-sm text-slate-500">{artigo.leitura}</p>
        </header>

        <article
          className="prosa-artigo pt-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <aside className="mt-14 rounded-2xl bg-gradient-to-br from-marca-700 via-marca-600 to-acento-600 px-6 py-10 text-center sm:px-10">
          <h2 className="text-2xl font-bold tracking-tight text-[#ffffff]">
            Coloque em prática no RastroLead
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[#eff6ff]/90">
            Varredura por nicho e cidade, Radar de Oportunidades, templates e cadências. Gratuito,
            sem planos e sem limite de uso.
          </p>
          <Link
            href="/auth?modo=cadastro"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ffffff] px-6 py-3 font-semibold text-[#1d4ed8] transition hover:bg-[#eff6ff]"
          >
            Criar conta gratuita
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </aside>

        <div className="mt-10 text-center">
          <Link href="/conteudos" className="text-sm font-semibold text-marca-700 hover:underline">
            ← Ver todos os conteúdos
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
