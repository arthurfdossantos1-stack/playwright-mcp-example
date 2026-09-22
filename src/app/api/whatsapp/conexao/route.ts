import { NextResponse } from "next/server";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";
import { chamarWorker, ErroWorker } from "@/lib/whatsapp-worker";

export const runtime = "nodejs";

const Entrada = z.object({ acao: z.enum(["conectar", "desconectar"]) });

/** Liga ou desliga a sessão do WhatsApp no servidor. */
export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });

  const analise = Entrada.safeParse(await request.json().catch(() => null));
  if (!analise.success) return NextResponse.json({ erro: "Ação inválida." }, { status: 400 });

  try {
    await chamarWorker(`/${analise.data.acao}`, { metodo: "POST" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const erro = e instanceof ErroWorker ? e : null;
    return NextResponse.json(
      { erro: erro?.message ?? "Falha ao falar com o servidor." },
      { status: erro?.status ?? 502 },
    );
  }
}
