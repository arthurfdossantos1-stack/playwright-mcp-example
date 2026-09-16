import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { NavegacaoApp } from "@/components/app/NavegacaoApp";
import { NavInferior } from "@/components/app/NavInferior";
import { Migalhas } from "@/components/app/Migalhas";

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

  // Verificacao em duas etapas: se a conta tem um fator ativo e a sessao ainda
  // esta em aal1, o codigo do app ainda nao foi digitado. Barrar AQUI e o que
  // impede alguem de pular a tela de desafio indo direto na URL do painel.
  const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (nivel?.nextLevel === "aal2" && nivel.nextLevel !== nivel.currentLevel) {
    redirect("/auth/verificacao?proximo=/app");
  }

  const [{ data: perfil }, { count: pendentes }, { data: leadsDaFila }] = await Promise.all([
    supabase.from("profiles").select("nome, email").eq("id", user.id).maybeSingle(),
    supabase
      .from("follow_ups")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["pendente", "pronto"])
      .lte("agendado_para", new Date().toISOString()),
    // Mesmo criterio da /app/enviar-mensagem. Antes o badge contava TODA
    // empresa com celular valido, entao mostrava um numero que nao batia com
    // o tamanho real da fila. O filtro final fica em JS, igual ao da pagina.
    supabase
      .from("leads")
      .select("id, empresas ( whatsapp_e164, contatado_fila_em )")
      .eq("user_id", user.id)
      .in("status", ["novo", "contatado"])
      .limit(300),
  ]);

  type EmpresaDaFila = { whatsapp_e164: string | null; contatado_fila_em: string | null };
  const filaWhatsapp = (
    (leadsDaFila ?? []) as unknown as { empresas: EmpresaDaFila | EmpresaDaFila[] | null }[]
  ).filter((lead) => {
    const empresa = Array.isArray(lead.empresas) ? lead.empresas[0] : lead.empresas;
    return Boolean(empresa?.whatsapp_e164) && !empresa?.contatado_fila_em;
  }).length;

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
        filaWhatsapp={filaWhatsapp}
      />
      <div className="lg:pl-60">
        {/* pb-24 no mobile abre espaço para a barra inferior fixa */}
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:pb-10">
          <Migalhas />
          {children}
        </main>
      </div>

      <NavInferior pendentes={pendentes ?? 0} filaWhatsapp={filaWhatsapp} />
    </div>
  );
}
