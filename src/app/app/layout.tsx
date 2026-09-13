import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { NavegacaoApp } from "@/components/app/NavegacaoApp";

export const metadata: Metadata = {
  title: { default: "Meu painel", template: "%s · RastroLead" },
  robots: { index: false, follow: false },
};

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Autenticou, tem acesso completo. Nao existe verificacao de plano.
  if (!user) redirect("/auth?proximo=/app");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nome, email")
    .eq("id", user.id)
    .maybeSingle();

  const { count: pendentes } = await supabase
    .from("follow_ups")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["pendente", "pronto"])
    .lte("agendado_para", new Date().toISOString());

  const nome =
    perfil?.nome ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.email ? user.email.split("@")[0] : "");

  return (
    <div className="min-h-screen bg-slate-50">
      <NavegacaoApp
        nome={nome}
        email={perfil?.email ?? user.email ?? ""}
        pendentes={pendentes ?? 0}
      />
      <div className="lg:pl-60">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
