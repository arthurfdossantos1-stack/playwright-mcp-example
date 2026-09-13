import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { listarArtigos } from "@/lib/conteudo";

export const metadata: Metadata = {
  title: "Conteúdos sobre prospecção B2B",
  description:
    "Guias e artigos práticos sobre como encontrar clientes, qualificar empresas e organizar o follow-up na prospecção B2B.",
  alternates: { canonical: "/conteudos" },
};

export default function HubConteudos() {
  const artigos = listarArtigos();
  const [destaque, ...demais] = artigos;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <header className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-marca-600">
            Conteúdos
          </span>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">
            Prospecção B2B na prática
          </h1>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-600">
            Material direto ao ponto sobre encontrar empresas, escolher quem abordar primeiro e
            transformar contato em cliente. Tudo aberto, sem cadastro obrigatório.
          </p>
        </header>

        {destaque && (
          <Link
            href={destaque.rota}
            className="mt-12 block overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 transition hover:border-marca-300 hover:shadow-lg sm:p-10"
          >
            <span className="inline-flex rounded-full bg-marca-50 px-2.5 py-1 text-xs font-semibold text-marca-700">
              Em destaque · {destaque.categoria}
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {destaque.titulo}
            </h2>
            <p className="mt-3 max-w-2xl text-[1.0625rem] leading-relaxed text-slate-600">
              {destaque.resumo}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-marca-700">
              Ler agora · {destaque.leitura}
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {demais.map((artigo) => (
            <Link
              key={artigo.slug}
              href={artigo.rota}
              className="cartao flex h-full flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {artigo.categoria}
              </span>
              <h2 className="mt-3 text-lg font-bold leading-snug text-slate-900">{artigo.titulo}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{artigo.resumo}</p>
              <span className="mt-4 text-xs font-medium text-slate-500">{artigo.leitura}</span>
            </Link>
          ))}
        </div>

        <section className="mt-16 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Da leitura para a lista de empresas
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-600">
            Crie sua conta e rode a primeira varredura por nicho e cidade. É gratuito, não tem
            planos e não tem limite de uso.
          </p>
          <Link href="/auth?modo=cadastro" className="botao-primario mt-6">
            Começar agora, é grátis
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
