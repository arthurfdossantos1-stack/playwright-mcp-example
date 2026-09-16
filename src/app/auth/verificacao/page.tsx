import { Suspense } from "react";
import type { Metadata } from "next";
import { DesafioMfa } from "@/components/auth/DesafioMfa";

export const metadata: Metadata = {
  title: "Verificação em 2 etapas",
  robots: { index: false, follow: false },
};

export default function PaginaVerificacao() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(55%_60%_at_50%_0%,rgba(37,99,235,0.13),rgba(248,250,252,0))]"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md">
        <Suspense fallback={null}>
          <DesafioMfa />
        </Suspense>
      </div>
    </main>
  );
}
