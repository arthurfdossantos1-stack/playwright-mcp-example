import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Worker de follow-up.
 *
 * Marca como "pronto" todos os follow-ups vencidos, registra a interacao no
 * historico do lead e encerra as cadencias sem etapas pendentes.
 *
 * Como agendar (escolha uma):
 *   - pg_cron + pg_net chamando esta rota (ver supabase/cron.sql)
 *   - Supabase Edge Function `follow-ups` (ver supabase/functions/follow-ups)
 *   - Cron da sua hospedagem (ex.: Vercel Cron) apontando para cá
 *
 * Protegido por CRON_SECRET no header `x-cron-secret` ou `Authorization: Bearer`.
 */
export async function POST(request: Request) {
  const segredo = process.env.CRON_SECRET;

  if (segredo) {
    const header =
      request.headers.get("x-cron-secret") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
      "";
    if (header !== segredo) {
      return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
    }
  }

  let supabase;
  try {
    supabase = criarClienteAdmin();
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Cliente administrativo indisponível." },
      { status: 500 },
    );
  }

  const agora = new Date().toISOString();

  const { data: vencidos, error } = await supabase
    .from("follow_ups")
    .select("id, user_id, lead_id, lead_cadencia_id, canal, mensagem")
    .eq("status", "pendente")
    .lte("agendado_para", agora)
    .order("agendado_para", { ascending: true })
    .limit(500);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  const lista = vencidos ?? [];

  if (lista.length === 0) {
    return NextResponse.json({ processados: 0, cadencias_encerradas: 0 });
  }

  const { error: erroAtualizacao } = await supabase
    .from("follow_ups")
    .update({ status: "pronto" })
    .in(
      "id",
      lista.map((f) => f.id),
    );
  if (erroAtualizacao) {
    return NextResponse.json({ erro: erroAtualizacao.message }, { status: 500 });
  }

  await supabase.from("interacoes").insert(
    lista.map((f) => ({
      user_id: f.user_id,
      lead_id: f.lead_id,
      canal: f.canal,
      titulo: "Follow-up da cadência ficou pronto para envio",
      conteudo: f.mensagem,
    })),
  );

  // Encerra as matriculas que nao tem mais follow-up pendente.
  const matriculas = [...new Set(lista.map((f) => f.lead_cadencia_id).filter(Boolean))] as string[];
  let encerradas = 0;

  for (const matricula of matriculas) {
    const { count } = await supabase
      .from("follow_ups")
      .select("id", { count: "exact", head: true })
      .eq("lead_cadencia_id", matricula)
      .eq("status", "pendente");

    if ((count ?? 0) === 0) {
      await supabase
        .from("lead_cadencias")
        .update({ status: "concluida", encerrada_em: new Date().toISOString() })
        .eq("id", matricula);
      encerradas += 1;
    }
  }

  return NextResponse.json({ processados: lista.length, cadencias_encerradas: encerradas });
}

/** GET serve para checagem de saude do agendador. */
export async function GET() {
  return NextResponse.json({
    rota: "/api/cron/follow-ups",
    metodo: "POST",
    protegido: Boolean(process.env.CRON_SECRET),
  });
}
