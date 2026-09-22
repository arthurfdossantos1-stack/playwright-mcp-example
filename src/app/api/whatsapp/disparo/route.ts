import { NextResponse } from "next/server";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";
import { chamarWorker, ErroWorker } from "@/lib/whatsapp-worker";
import { aplicarVariaveis, contextoDaEmpresa } from "@/lib/templates";
import type { LeadStatus } from "@/lib/types";

export const runtime = "nodejs";

const Entrada = z.object({
  templateId: z.string().uuid(),
  /** Quantos leads no máximo. O servidor ainda corta pelo teto do dia. */
  quantidade: z.coerce.number().int().min(1).max(200).default(30),
  intervaloMin: z.coerce.number().int().min(20).max(600).default(45),
  intervaloMax: z.coerce.number().int().min(30).max(900).default(90),
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
 * Enfileira o disparo no servidor de WhatsApp.
 *
 * O texto de cada mensagem e montado AQUI, com as variaveis do template ja
 * substituidas por lead. O servidor so entrega — ele nao conhece template
 * nem banco, entao um vazamento la nao expoe os dados dos leads.
 */
export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });

  const analise = Entrada.safeParse(await request.json().catch(() => null));
  if (!analise.success) {
    return NextResponse.json(
      { erro: analise.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { templateId, quantidade, intervaloMin, intervaloMax } = analise.data;

  const [{ data: template }, { data: perfil }, { data: empresas }] = await Promise.all([
    supabase.from("templates").select("*").eq("id", templateId).maybeSingle(),
    supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle(),
    // Mesmo criterio da fila manual: filtros na tabela principal, para o
    // limite valer sobre o que JA passou por eles.
    supabase
      .from("empresas")
      .select(
        "id, nome, telefone, whatsapp_e164, website, instagram, nota, total_avaliacoes, buscas ( nicho, cidade ), leads!inner ( id, status )",
      )
      .not("whatsapp_e164", "is", null)
      .is("contatado_fila_em", null)
      .in("leads.status", ["novo", "contatado"])
      .order("score_radar", { ascending: false })
      .limit(quantidade),
  ]);

  if (!template) {
    return NextResponse.json({ erro: "Template não encontrado." }, { status: 400 });
  }

  const meuNome = perfil?.nome ?? "";
  const itens = ((empresas ?? []) as unknown as LinhaEmpresa[])
    .map((empresa) => {
      const lead = Array.isArray(empresa.leads) ? empresa.leads[0] : empresa.leads;
      if (!lead || !empresa.whatsapp_e164) return null;
      const busca = Array.isArray(empresa.buscas) ? empresa.buscas[0] : empresa.buscas;

      return {
        empresaId: empresa.id,
        leadId: lead.id,
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
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (itens.length === 0) {
    return NextResponse.json(
      { erro: "Nenhum lead do funil com celular válido esperando mensagem." },
      { status: 400 },
    );
  }

  try {
    const resposta = await chamarWorker<{ total: number; tetoHoje: number }>("/campanha", {
      metodo: "POST",
      corpo: { itens, userId: user.id, intervaloMin, intervaloMax },
    });
    return NextResponse.json({ ok: true, ...resposta });
  } catch (e) {
    const erro = e instanceof ErroWorker ? e : null;
    return NextResponse.json(
      { erro: erro?.message ?? "Falha ao iniciar o disparo." },
      { status: erro?.status ?? 502 },
    );
  }
}

/** Para o disparo em andamento. */
export async function DELETE() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });

  try {
    await chamarWorker("/campanha/parar", { metodo: "POST" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const erro = e instanceof ErroWorker ? e : null;
    return NextResponse.json(
      { erro: erro?.message ?? "Falha ao parar o disparo." },
      { status: erro?.status ?? 502 },
    );
  }
}
