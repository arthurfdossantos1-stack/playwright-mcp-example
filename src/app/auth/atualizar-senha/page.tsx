import type { Metadata } from "next";
import { FormularioNovaSenha } from "@/components/auth/FormularioNovaSenha";

export const metadata: Metadata = {
  title: "Definir nova senha",
  robots: { index: false, follow: false },
};

export default function AtualizarSenha() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <FormularioNovaSenha />
    </main>
  );
}
