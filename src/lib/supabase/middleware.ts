import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ROTAS_PROTEGIDAS = ["/app"];

/**
 * Renova a sessao do Supabase a cada request e protege as rotas do app.
 * Nao ha verificacao de plano: basta estar autenticado para ter acesso total.
 */
export async function atualizarSessao(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sem credenciais configuradas o middleware nao bloqueia nada (ambiente novo).
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const protegida = ROTAS_PROTEGIDAS.some(
    (rota) => caminho === rota || caminho.startsWith(`${rota}/`),
  );

  if (protegida && !user) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/auth";
    destino.searchParams.set("proximo", caminho);
    return NextResponse.redirect(destino);
  }

  if (caminho === "/auth" && user) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/app";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return response;
}
