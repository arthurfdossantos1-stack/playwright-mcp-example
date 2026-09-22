import { NextResponse } from "next/server";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Entrada = z.object({ acao: z.enum(["conectar", "desconectar"]) });

/**
 * Deixa uma ordem para o servidor.
 *
 * No modo pull o app nao alcanca o servidor, entao "conectar" nao e uma
 * chamada: e um recado que fica gravado e o servidor pega na proxima
 * consulta — poucos segundos depois.
 */
export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessao expirada." }, { status: 401 });

  const analise = Entrada.safeParse(await request.json().catch(() => null));
  if (!analise.success) return NextResponse.json({ erro: "Acao invalida." }, { status: 400 });

  const { error } = await supabase.from("whatsapp_sessao").upsert(
    {
      user_id: user.id,
      comando: analise.data.acao,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
