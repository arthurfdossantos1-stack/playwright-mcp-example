import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import {
  chamarWorker,
  ErroWorker,
  workerConfigurado,
  type EstadoWorker,
} from "@/lib/whatsapp-worker";

export const runtime = "nodejs";

/** Estado da conexão e do disparo. A tela consulta isto a cada poucos segundos. */
export async function GET() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });

  if (!workerConfigurado()) {
    return NextResponse.json({ configurado: false });
  }

  try {
    const estado = await chamarWorker<EstadoWorker>("/estado");
    return NextResponse.json({ configurado: true, ...estado });
  } catch (e) {
    const erro = e instanceof ErroWorker ? e : null;
    return NextResponse.json(
      { configurado: true, erro: erro?.message ?? "Falha ao consultar o servidor." },
      { status: erro?.status ?? 502 },
    );
  }
}
