import Link from "next/link";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function PaginaLegal({
  titulo,
  atualizadoEm,
  children,
}: {
  titulo: string;
  atualizadoEm: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-marca-700">
            Início
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-700">{titulo}</span>
        </nav>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {titulo}
        </h1>
        <p className="mt-3 text-sm text-slate-500">Última atualização: {atualizadoEm}</p>

        <div className="prosa-artigo mt-10">{children}</div>
      </main>
      <Footer />
    </>
  );
}
