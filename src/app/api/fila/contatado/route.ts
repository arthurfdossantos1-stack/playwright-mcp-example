import { NextResponse } from "next/server";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const Entrada = z.object({
  empresaId: z.string().uuid(),
  leadId: z.string().uuid().nullable().optional(),
  /** true desfaz a marcacao (botao "Desfazer" da fila). */
  desfazer: z.boolean().default(false),
  /** So o servidor de WhatsApp manda: ele nao tem sessao de navegador. */
  userId: z.string().uuid().optional(),
});

/**
 * Marca (ou desmarca) o contato feito pela fila de WhatsApp.
 *
 * Existe como ROTA, e nao so como server action, por um motivo especifico:
 * ao tocar em "Abrir WhatsApp" o celular troca de aplicativo, e o navegador
 * pode congelar ou matar a pagina antes de uma requisicao normal terminar.
 * O resultado era o lead reaparecer na fila ao reabrir o site.
 *
 * Uma rota comum pode ser chamada com `fetch(..., { keepalive: true })`, que
 * o navegador se compromete a concluir mesmo com a pagina indo embora —
 * coisa que server action nao aceita. O cliente ainda guarda o que nao
 * confirmou e reenvia no proximo carregamento.
 */
export async function POST(request: Request) {
  const analise = Entrada.safeParse(await request.json().catch(() => null));
  if (!analise.success) {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  const { empresaId, leadId, desfazer, userId } = analise.data;

  // Duas portas: o navegador (sessao) e o servidor de WhatsApp (chave
  // compartilhada). O servidor nao tem cookie, entao manda o userId e prova
  // quem e pela chave — mesmo padrao da rota de cron.
  const chaveWorker = process.env.WHATSAPP_WORKER_SECRET;
  const vemDoWorker =
    Boolean(chaveWorker) && request.headers.get("x-chave-worker") === chaveWorker;

  let supabase;
  let donoId: string;

  if (vemDoWorker) {
    if (!userId) {
      return NextResponse.json({ erro: "userId é obrigatório." }, { status: 400 });
    }
    supabase = criarClienteAdmin();
    donoId = userId;
  } else {
    supabase = await criarClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
    }
    donoId = user.id;
  }

  const user = { id: donoId };
  const agora = new Date().toISOString();

  const { error } = await supabase
    .from("empresas")
    .update({ contatado_fila_em: desfazer ? null : agora })
    .eq("id", empresaId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  // A fila E o funil: quem recebeu mensagem avanca de "novo" para "contatado".
  if (leadId) {
    if (desfazer) {
      await supabase
        .from("leads")
        .update({ status: "novo" })
        .eq("id", leadId)
        .eq("user_id", user.id)
        .eq("status", "contatado");
    } else {
      await supabase
        .from("leads")
        .update({ status: "contatado", ultimo_contato_em: agora })
        .eq("id", leadId)
        .eq("user_id", user.id)
        .eq("status", "novo");

      await supabase.from("interacoes").insert({
        user_id: user.id,
        lead_id: leadId,
        canal: "whatsapp",
        titulo: "Mensagem de WhatsApp aberta pela fila",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
