import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Quantos itens o servidor leva por consulta. */
const LOTE = 20;

/**
 * Impressao digital da chave. O sal evita que um segredo fraco ("senha123")
 * seja identificado por tabela pronta; 8 digitos servem pra comparar, nao
 * pra reconstruir nada.
 */
const SAL_IMPRESSAO = "rastrolead-impressao-v1";

function impressaoDaChave(chave: string): string {
  return createHash("sha256").update(SAL_IMPRESSAO + chave).digest("hex").slice(0, 8);
}

/**
 * Diagnostico de chave, sem autenticacao de proposito: quem esta travado no
 * 401 ainda nao consegue se autenticar. Nao devolve o segredo — so se ele
 * chegou ate a funcao, o tamanho e a impressao, que e o bastante pra separar
 * "a variavel nao existe" de "existe com outro valor".
 */
export async function GET() {
  const chave = process.env.WHATSAPP_WORKER_SECRET ?? "";
  return NextResponse.json({
    configurado: chave.length > 0,
    tamanho: chave.length,
    impressao: chave ? impressaoDaChave(chave) : null,
    // Espaco ou aspas coladas no valor sao o erro mais comum de copiar e colar.
    temEspacoSobrando: chave !== chave.trim(),
    temAspas: /^["'].*["']$/.test(chave),
  });
}

const Resultado = z.object({
  itemId: z.string().uuid(),
  estado: z.enum(["enviado", "pulado", "falhou"]),
  motivo: z.string().max(300).nullable().optional(),
});

const Entrada = z.object({
  userId: z.string().uuid(),
  conectado: z.boolean().default(false),
  numero: z.string().nullable().optional(),
  qr: z.string().nullable().optional(),
  enviadasHoje: z.coerce.number().int().min(0).default(0),
  tetoHoje: z.coerce.number().int().min(0).default(20),
  /** O que o servidor concluiu desde a consulta anterior. */
  resultados: z.array(Resultado).max(100).default([]),
  /** Servidor avisa que parou, e por que (conexao caiu, teto, etc.). */
  pausar: z.string().max(300).nullable().optional(),
});

/**
 * Unica porta do servidor de WhatsApp.
 *
 * Modo PULL: o servidor pergunta se tem trabalho em vez de o app chamar ele.
 * E isso que permite rodar atras de NAT — num celular com Termux, por
 * exemplo — sem IP publico, sem tunel e sem URL que muda a cada reinicio.
 *
 * Numa chamada so ele: publica o estado da sessao (inclusive o QR), entrega
 * o que ja enviou e leva o proximo lote. Menos ida e volta = menos bateria.
 */
export async function POST(request: Request) {
  const chave = process.env.WHATSAPP_WORKER_SECRET;
  if (!chave || request.headers.get("x-chave-worker") !== chave) {
    return NextResponse.json({ erro: "Chave invalida." }, { status: 401 });
  }

  const analise = Entrada.safeParse(await request.json().catch(() => null));
  if (!analise.success) {
    return NextResponse.json({ erro: "Dados invalidos." }, { status: 400 });
  }

  const { userId, conectado, numero, qr, enviadasHoje, tetoHoje, resultados, pausar } =
    analise.data;
  const supabase = criarClienteAdmin();
  const agora = new Date().toISOString();

  // 1. Espelha o estado da sessao e consome o comando pendente.
  const { data: sessao } = await supabase
    .from("whatsapp_sessao")
    .upsert(
      {
        user_id: userId,
        conectado,
        numero: numero ?? null,
        qr: qr ?? null,
        enviadas_hoje: enviadasHoje,
        teto_hoje: tetoHoje,
        visto_em: agora,
        atualizado_em: agora,
      },
      { onConflict: "user_id" },
    )
    .select("comando")
    .single();

  const comando = sessao?.comando ?? null;
  if (comando) {
    // Consumido: so vale uma vez, senao o servidor reconectaria em looping.
    await supabase.from("whatsapp_sessao").update({ comando: null }).eq("user_id", userId);
  }

  // 2. Grava o que o servidor concluiu.
  for (const r of resultados) {
    const { data: item } = await supabase
      .from("disparo_itens")
      .update({
        estado: r.estado,
        motivo: r.motivo ?? null,
        enviado_em: r.estado === "enviado" ? agora : null,
      })
      .eq("id", r.itemId)
      .eq("user_id", userId)
      .select("empresa_id, lead_id")
      .maybeSingle();

    if (r.estado === "enviado" && item) {
      // Mesma marcacao da fila manual: sai da fila e avanca no funil.
      await supabase
        .from("empresas")
        .update({ contatado_fila_em: agora })
        .eq("id", item.empresa_id)
        .eq("user_id", userId);

      if (item.lead_id) {
        await supabase
          .from("leads")
          .update({ status: "contatado", ultimo_contato_em: agora })
          .eq("id", item.lead_id)
          .eq("user_id", userId)
          .eq("status", "novo");
      }
    }
  }

  // 3. Disparo ativo.
  const { data: disparo } = await supabase
    .from("disparos")
    .select("id, estado, intervalo_min, intervalo_max")
    .eq("user_id", userId)
    .in("estado", ["pendente", "rodando"])
    .maybeSingle();

  if (!disparo) {
    return NextResponse.json({ comando, disparo: null, itens: [] });
  }

  if (pausar) {
    await supabase
      .from("disparos")
      .update({ estado: "pausado", atualizado_em: agora })
      .eq("id", disparo.id);
    return NextResponse.json({ comando, disparo: null, itens: [] });
  }

  // 4. Proximo lote.
  const { data: itens } = await supabase
    .from("disparo_itens")
    .select("id, numero, texto")
    .eq("disparo_id", disparo.id)
    .eq("estado", "pendente")
    .order("criado_em", { ascending: true })
    .limit(LOTE);

  const lote = itens ?? [];

  if (lote.length === 0) {
    await supabase
      .from("disparos")
      .update({ estado: "concluido", atualizado_em: agora })
      .eq("id", disparo.id);
    return NextResponse.json({ comando, disparo: null, itens: [] });
  }

  if (disparo.estado === "pendente") {
    await supabase
      .from("disparos")
      .update({ estado: "rodando", atualizado_em: agora })
      .eq("id", disparo.id);
  }

  return NextResponse.json({
    comando,
    disparo: {
      id: disparo.id,
      intervaloMin: disparo.intervalo_min,
      intervaloMax: disparo.intervalo_max,
    },
    itens: lote,
  });
}
