import { NextResponse } from "next/server";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";
import { aplicarVariaveis, contextoDaEmpresa } from "@/lib/templates";
import type { LeadStatus } from "@/lib/types";

export const runtime = "nodejs";

const Entrada = z.object({
  templateId: z.string().uuid(),
  quantidade: z.coerce.number().int().min(1).max(200).default(20),
  intervaloMin: z.coerce.number().int().min(20).max(600).default(45),
  intervaloMax: z.coerce.number().int().min(30).max(900).default(90),
  /** Escolha manual. Sem ela, o app pega o topo do radar. */
  empresaIds: z.array(z.string().uuid()).max(200).optional(),
});

type LinhaEmpresa = {
  id: string;
  nome: string;
  telefone: string | null;
  whatsapp_e164: string | null;
  website: string | null;
  instagram: string | null;
  nota: number | null;
  total_avaliacoes: number;
  buscas: { nicho: string; cidade: string } | { nicho: string; cidade: string }[] | null;
  leads: { id: string; status: LeadStatus } | { id: string; status: LeadStatus }[] | null;
};

/**
 * Monta o disparo e deixa gravado. Quem executa e o servidor, quando
 * perguntar se tem trabalho.
 *
 * O texto de cada mensagem sai daqui ja com as variaveis substituidas: o
 * servidor so entrega. Assim ele nao precisa conhecer template nem banco, e
 * um vazamento la nao expoe os leads.
 */
export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessao expirada." }, { status: 401 });

  const analise = Entrada.safeParse(await request.json().catch(() => null));
  if (!analise.success) {
    return NextResponse.json(
      { erro: analise.error.issues[0]?.message ?? "Dados invalidos." },
      { status: 400 },
    );
  }

  const { templateId, quantidade, intervaloMin, intervaloMax, empresaIds } = analise.data;

  // Um disparo ativo por vez: dois ao mesmo tempo dobram o ritmo e o risco.
  // "pausado" conta como ativo porque ele volta sozinho quando a conexao
  // reaparece — sem isso, cada queda de rede virava um disparo novo por cima
  // do antigo, e o mesmo lead receberia a mensagem uma vez por disparo.
  const { data: ativos } = await supabase
    .from("disparos")
    .select("id")
    .eq("user_id", user.id)
    .in("estado", ["pendente", "rodando", "pausado"])
    .limit(1);
  if (ativos && ativos.length > 0) {
    return NextResponse.json(
      { erro: "Ja existe um disparo em andamento. Use \"Parar agora\" antes de comecar outro." },
      { status: 409 },
    );
  }

  let consulta = supabase
    .from("empresas")
    .select(
      "id, nome, telefone, whatsapp_e164, website, instagram, nota, total_avaliacoes, buscas ( nicho, cidade ), leads!inner ( id, status )",
    )
    .not("whatsapp_e164", "is", null)
    .is("contatado_fila_em", null)
    // Numero que o WhatsApp ja disse nao existir nao volta para a fila.
    .is("whatsapp_invalido_em", null)
    .in("leads.status", ["novo", "contatado"]);

  // Escolha manual manda: quem marcou sabe quem quer chamar. Os filtros
  // acima continuam valendo, senao um lead ja contatado voltaria pela
  // selecao e receberia a mesma mensagem de novo.
  consulta = empresaIds?.length
    ? consulta.in("id", empresaIds)
    : consulta.order("score_radar", { ascending: false }).limit(quantidade);

  const [{ data: template }, { data: perfil }, { data: empresas, error: erroEmpresas }] =
    await Promise.all([
      supabase.from("templates").select("*").eq("id", templateId).maybeSingle(),
      supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle(),
      consulta,
    ]);

  if (erroEmpresas) {
    return NextResponse.json({ erro: erroEmpresas.message }, { status: 500 });
  }

  if (!template) return NextResponse.json({ erro: "Template nao encontrado." }, { status: 400 });

  const meuNome = perfil?.nome ?? "";
  const linhas = ((empresas ?? []) as unknown as LinhaEmpresa[])
    .map((empresa) => {
      const lead = Array.isArray(empresa.leads) ? empresa.leads[0] : empresa.leads;
      if (!lead || !empresa.whatsapp_e164) return null;
      const busca = Array.isArray(empresa.buscas) ? empresa.buscas[0] : empresa.buscas;

      return {
        user_id: user.id,
        empresa_id: empresa.id,
        lead_id: lead.id,
        numero: empresa.whatsapp_e164,
        texto: aplicarVariaveis(
          template.corpo,
          contextoDaEmpresa(empresa, {
            cidade: busca?.cidade ?? null,
            nicho: busca?.nicho ?? null,
            meuNome,
          }),
        ),
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  if (linhas.length === 0) {
    return NextResponse.json(
      {
        erro: empresaIds?.length
          ? "Os leads marcados ja foram contatados ou nao tem celular valido."
          : "Nenhum lead do funil com celular valido esperando mensagem.",
      },
      { status: 400 },
    );
  }

  const { data: disparo, error: erroDisparo } = await supabase
    .from("disparos")
    .insert({
      user_id: user.id,
      estado: "pendente",
      intervalo_min: intervaloMin,
      intervalo_max: Math.max(intervaloMax, intervaloMin + 10),
    })
    .select("id")
    .single();

  if (erroDisparo || !disparo) {
    return NextResponse.json(
      { erro: erroDisparo?.message ?? "Nao consegui criar o disparo." },
      { status: 500 },
    );
  }

  const { error: erroItens } = await supabase
    .from("disparo_itens")
    .insert(linhas.map((l) => ({ ...l, disparo_id: disparo.id })));

  if (erroItens) {
    // Disparo sem itens so confundiria a tela: desfaz.
    await supabase.from("disparos").delete().eq("id", disparo.id);
    return NextResponse.json({ erro: erroItens.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, total: linhas.length });
}

/** Cancela o disparo ativo. O servidor para na proxima consulta. */
export async function DELETE() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessao expirada." }, { status: 401 });

  const { error } = await supabase
    .from("disparos")
    .update({ estado: "cancelado", atualizado_em: new Date().toISOString() })
    .eq("user_id", user.id)
    .in("estado", ["pendente", "rodando", "pausado"]);

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
