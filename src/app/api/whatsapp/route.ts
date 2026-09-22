import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Servidor sem dar sinal por mais que isso conta como fora do ar. */
const SEGUNDOS_PARA_SUMIDO = 45;

/**
 * Estado da conexao e do disparo, lido do BANCO.
 *
 * No modo pull o app nao fala com o servidor: quem publica o estado (e o QR)
 * e o proprio servidor, a cada consulta. Por isso "esta rodando?" vira
 * "deu sinal de vida ha pouco?" — nao da para pingar um celular atras de NAT.
 */
export async function GET() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessao expirada." }, { status: 401 });

  const [{ data: sessao }, { data: disparo }] = await Promise.all([
    supabase.from("whatsapp_sessao").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("disparos")
      .select("id, estado, criado_em")
      .eq("user_id", user.id)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let campanha = null;
  if (disparo) {
    const contar = (estado: string) =>
      supabase
        .from("disparo_itens")
        .select("id", { count: "exact", head: true })
        .eq("disparo_id", disparo.id)
        .eq("estado", estado);

    const [total, enviados, pulados, falhas] = await Promise.all([
      supabase
        .from("disparo_itens")
        .select("id", { count: "exact", head: true })
        .eq("disparo_id", disparo.id),
      contar("enviado"),
      contar("pulado"),
      contar("falhou"),
    ]);

    campanha = {
      estado: disparo.estado as "pendente" | "rodando" | "pausado" | "concluido" | "cancelado",
      total: total.count ?? 0,
      enviados: enviados.count ?? 0,
      pulados: pulados.count ?? 0,
      falhas: falhas.count ?? 0,
    };
  }

  const vistoEm = sessao?.visto_em ? Date.parse(sessao.visto_em) : 0;
  const servidorVivo = vistoEm > 0 && Date.now() - vistoEm < SEGUNDOS_PARA_SUMIDO * 1000;

  return NextResponse.json({
    // O usuario precisa deste id para configurar o servidor.
    userId: user.id,
    servidorVivo,
    vistoEm: sessao?.visto_em ?? null,
    conectado: servidorVivo && Boolean(sessao?.conectado),
    numero: sessao?.numero ?? null,
    qr: sessao?.qr ?? null,
    comandoPendente: sessao?.comando ?? null,
    enviadasHoje: sessao?.enviadas_hoje ?? 0,
    tetoHoje: sessao?.teto_hoje ?? 20,
    campanha,
  });
}
