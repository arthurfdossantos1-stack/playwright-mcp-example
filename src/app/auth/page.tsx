import { Suspense } from "react";
import type { Metadata } from "next";
import { FormularioAuth } from "@/components/auth/FormularioAuth";

export const metadata: Metadata = {
  title: "Entrar ou criar conta",
  description:
    "Acesse o RastroLead com e-mail e senha ou com sua conta Google. Criar conta é gratuito e libera todos os recursos na hora.",
  robots: { index: false, follow: true },
};

export default function PaginaAuth() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(55%_60%_at_50%_0%,rgba(37,99,235,0.13),rgba(248,250,252,0))]"
        aria-hidden="true"
      />
      <div className="relative flex w-full justify-center">
        <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-2xl bg-white" />}>
          <FormularioAuth />
        </Suspense>
      </div>
    </main>
  );
}
