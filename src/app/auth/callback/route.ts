import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

/**
 * Callback do Supabase Auth: troca o `code` do OAuth / link de e-mail por uma
 * sessao e leva o usuario direto para o app. Nao ha etapa de plano ou
 * pagamento entre o cadastro e o acesso.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const erroDescricao = searchParams.get("error_description");
  const proximoBruto = searchParams.get("proximo") ?? "/app";
  const proximo = proximoBruto.startsWith("/") ? proximoBruto : "/app";

  if (erroDescricao) {
    return NextResponse.redirect(
      `${origin}/auth?modo=login&erro=${encodeURIComponent(erroDescricao)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth`);
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth?modo=login&erro=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}${proximo}`);
}
