import Link from "next/link";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";

export default function NaoEncontrado() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <span className="text-6xl font-extrabold texto-gradiente">404</span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Não encontramos esta página
        </h1>
        <p className="mt-3 text-slate-600">
          O link pode ter mudado de endereço. Você ainda pode voltar ao início ou ir direto para a
          sua próxima varredura.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="botao-secundario">
            ← Voltar para o início
          </Link>
          <Link href="/app/buscar" className="botao-primario">
            Nova varredura
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
