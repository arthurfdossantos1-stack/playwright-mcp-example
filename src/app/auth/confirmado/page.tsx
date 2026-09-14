import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/marketing/Logo";

export const metadata: Metadata = {
  title: "E-mail confirmado",
  robots: { index: false, follow: false },
};

/**
 * Tela de fim do link de confirmacao de e-mail.
 *
 * Importante: NAO exige sessao. O link do e-mail quase sempre abre no navegador
 * interno do app de e-mail (Gmail, Outlook), onde a sessao criada nao vale pro
 * navegador de verdade do usuario. Antes isso caia direto no /app e mostrava
 * uma tela vazia/inacessivel; agora mostra a confirmacao e manda voltar ao site.
 */
export default async function PaginaConfirmado({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(55%_60%_at_50%_0%,rgba(37,99,235,0.13),rgba(248,250,252,0))]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="cartao p-8 text-center">
          {erro ? (
            <>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v5m0 3.5h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
                Esse link não vale mais
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Links de confirmação expiram depois de um tempo ou já foram usados uma vez. Entre
                com seu e-mail e senha — se ainda faltar confirmar, a gente reenvia o link.
              </p>
            </>
          ) : (
            <>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
                Verificação concluída
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Seu e-mail foi confirmado com sucesso. Agora volte para o site e entre com seu
                e-mail e senha — sua conta já está liberada, com acesso completo.
              </p>
            </>
          )}

          <Link href="/auth" className="botao-primario mt-7 w-full">
            Voltar para o site e entrar
          </Link>

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Abriu esse link pelo app de e-mail? Pode fechar esta aba e voltar ao navegador onde
            você estava — a confirmação já foi registrada.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-800">
            ← Ir para a página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}
