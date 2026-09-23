import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { LeadStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Teto da lista. Acima disso a tela vira rolagem infinita no celular. */
const TETO = 200;

type Linha = {
  id: string;
  nome: string;
  whatsapp_e164: string | null;
  score_radar: number | null;
  website: string | null;
  buscas: { nicho: string; cidade: string } | { nicho: string; cidade: string }[] | null;
  leads: { status: LeadStatus } | { status: LeadStatus }[] | null;
};

/**
 * Quem pode entrar num disparo agora.
 *
 * Mesmos filtros que a criacao do disparo usa. Escolher na tela uma lista
 * montada por outra regra seria pior que nao escolher: o usuario marcaria
 * nomes que depois nao entrariam, sem explicacao.
 */
export async function GET() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessao expirada." }, { status: 401 });

  const { data, error } = await supabase
    .from("empresas")
    .select(
      "id, nome, whatsapp_e164, score_radar, website, buscas ( nicho, cidade ), leads!inner ( status )",
    )
    .not("whatsapp_e164", "is", null)
    .is("contatado_fila_em", null)
    .is("whatsapp_invalido_em", null)
    .in("leads.status", ["novo", "contatado"])
    .order("score_radar", { ascending: false })
    .limit(TETO);

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const leads = ((data ?? []) as unknown as Linha[]).map((e) => {
    const busca = Array.isArray(e.buscas) ? e.buscas[0] : e.buscas;
    const lead = Array.isArray(e.leads) ? e.leads[0] : e.leads;
    return {
      id: e.id,
      nome: e.nome,
      whatsapp: e.whatsapp_e164,
      score: e.score_radar ?? 0,
      semSite: !e.website,
      cidade: busca?.cidade ?? null,
      nicho: busca?.nicho ?? null,
      status: lead?.status ?? "novo",
    };
  });

  return NextResponse.json({ leads, teto: TETO });
}
