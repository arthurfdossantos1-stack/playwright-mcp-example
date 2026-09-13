// ===========================================================================
// RastroLead - Supabase Edge Function: worker de follow-up
// ---------------------------------------------------------------------------
// Roda periodicamente (pg_cron + pg_net, ou o scheduler da Supabase) e
// dispara todos os follow-ups vencidos: marca como "pronto", registra a
// interacao no historico do lead e encerra cadencias sem etapas pendentes.
//
// Deploy:
//   supabase functions deploy follow-ups --no-verify-jwt
//   supabase secrets set CRON_SECRET=...
// ===========================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

type FollowUp = {
  id: string;
  user_id: string;
  lead_id: string;
  lead_cadencia_id: string | null;
  canal: string;
  mensagem: string | null;
};

Deno.serve(async (req: Request) => {
  if (CRON_SECRET) {
    const header = req.headers.get("x-cron-secret") ?? "";
    if (header !== CRON_SECRET) {
      return new Response(JSON.stringify({ erro: "nao autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const agora = new Date().toISOString();

  const { data: vencidos, error } = await supabase
    .from("follow_ups")
    .select("id, user_id, lead_id, lead_cadencia_id, canal, mensagem")
    .eq("status", "pendente")
    .lte("agendado_para", agora)
    .order("agendado_para", { ascending: true })
    .limit(500);

  if (error) {
    return new Response(JSON.stringify({ erro: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lista = (vencidos ?? []) as FollowUp[];

  if (lista.length > 0) {
    await supabase
      .from("follow_ups")
      .update({ status: "pronto" })
      .in("id", lista.map((f) => f.id));

    await supabase.from("interacoes").insert(
      lista.map((f) => ({
        user_id: f.user_id,
        lead_id: f.lead_id,
        canal: f.canal,
        titulo: "Follow-up da cadencia ficou pronto para envio",
        conteudo: f.mensagem,
      })),
    );
  }

  // Encerra matriculas sem follow-up pendente.
  const cadenciasTocadas = [
    ...new Set(lista.map((f) => f.lead_cadencia_id).filter(Boolean)),
  ] as string[];

  for (const cadenciaId of cadenciasTocadas) {
    const { count } = await supabase
      .from("follow_ups")
      .select("id", { count: "exact", head: true })
      .eq("lead_cadencia_id", cadenciaId)
      .eq("status", "pendente");

    if ((count ?? 0) === 0) {
      await supabase
        .from("lead_cadencias")
        .update({ status: "concluida", encerrada_em: new Date().toISOString() })
        .eq("id", cadenciaId);
    }
  }

  return new Response(
    JSON.stringify({ processados: lista.length, cadencias_encerradas: cadenciasTocadas.length }),
    { headers: { "Content-Type": "application/json" } },
  );
});
