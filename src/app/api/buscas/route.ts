import { NextResponse } from "next/server";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";
import { buscarEmpresas, detalharEmpresas, montarTermo, ErroPlaces } from "@/lib/places";
import { descobrirInstagramEmLote } from "@/lib/instagram";
import { avaliarRadar } from "@/lib/radar";
import { validarWhatsapp } from "@/lib/whatsapp";
import {
  chaveRateLimit,
  checarNoBanco,
  ipDoRequest,
  janelaPadraoSegundos,
  limitePadrao,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const Entrada = z.object({
  nicho: z.string().trim().min(2, "Informe o nicho.").max(120),
  cidade: z.string().trim().min(2, "Informe a cidade.").max(120),
  projetoId: z.string().uuid().nullable().optional(),
});

/**
 * Dispara uma varredura completa.
 *
 * Sem limite de produto: nao ha teto de empresas por varredura nem de
 * varreduras por mes. O unico controle e o rate limit TECNICO, que protege
 * a cota da Google Places API contra rajadas.
 */
export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: "Sessão expirada. Entre novamente." }, { status: 401 });
  }

  const corpoBruto = await request.json().catch(() => null);
  const analise = Entrada.safeParse(corpoBruto);
  if (!analise.success) {
    return NextResponse.json(
      { erro: analise.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { nicho, cidade, projetoId } = analise.data;

  // Protecao tecnica de infraestrutura — nao e limite de plano.
  const limite = await checarNoBanco(
    supabase,
    chaveRateLimit("busca", user.id, ipDoRequest(request)),
    limitePadrao(),
    janelaPadraoSegundos(),
  );
  if (!limite.permitido) {
    return NextResponse.json(
      {
        erro: "Muitas varreduras seguidas. Aguarde alguns segundos e tente de novo.",
        tecnico: true,
      },
      { status: 429 },
    );
  }

  const { data: busca, error: erroBusca } = await supabase
    .from("buscas")
    .insert({
      user_id: user.id,
      projeto_id: projetoId ?? null,
      nicho,
      cidade,
      termo: montarTermo(nicho, cidade),
      status: "processando",
    })
    .select("id")
    .single();

  if (erroBusca || !busca) {
    return NextResponse.json(
      { erro: erroBusca?.message ?? "Não foi possível registrar a varredura." },
      { status: 500 },
    );
  }

  try {
    // 1. Text Search — todas as paginas que o Google devolver.
    const resumos = await buscarEmpresas(nicho, cidade);

    if (resumos.length === 0) {
      await supabase
        .from("buscas")
        .update({ status: "concluida", total_resultados: 0, concluido_em: new Date().toISOString() })
        .eq("id", busca.id);
      return NextResponse.json({ buscaId: busca.id, total: 0 });
    }

    // 2. Place Details — telefone, site, avaliacoes e endereco.
    const detalhados = await detalharEmpresas(resumos, { concorrencia: 6 });

    // 3. Instagram a partir do site da empresa.
    const instagrams = await descobrirInstagramEmLote(
      detalhados.map((d) => d.website),
      5,
    );

    // 4. Radar de Oportunidades.
    const linhas = detalhados.map((empresa, indice) => {
      const instagram = instagrams[indice];
      const radar = avaliarRadar({
        website: empresa.website,
        instagram,
        totalAvaliacoes: empresa.totalAvaliacoes,
        nota: empresa.nota,
        telefone: empresa.telefone,
      });

      const whatsapp = validarWhatsapp(empresa.telefone);

      return {
        user_id: user.id,
        busca_id: busca.id,
        place_id: empresa.placeId,
        nome: empresa.nome,
        endereco: empresa.endereco,
        telefone: empresa.telefone,
        website: empresa.website,
        instagram,
        categoria: empresa.categoria,
        nota: empresa.nota,
        total_avaliacoes: empresa.totalAvaliacoes,
        latitude: empresa.latitude,
        longitude: empresa.longitude,
        google_maps_url: empresa.googleMapsUrl,
        prioridade: radar.prioridade,
        score_radar: radar.score,
        motivos_radar: radar.motivos,
        whatsapp_e164: whatsapp.e164,
        whatsapp_verificado: whatsapp.verificado,
        fotos_total: empresa.totalFotos,
      };
    });

    const { error: erroEmpresas } = await supabase
      .from("empresas")
      .upsert(linhas, { onConflict: "busca_id,place_id" });
    if (erroEmpresas) throw erroEmpresas;

    await supabase
      .from("buscas")
      .update({
        status: "concluida",
        total_resultados: linhas.length,
        concluido_em: new Date().toISOString(),
      })
      .eq("id", busca.id);

    return NextResponse.json({ buscaId: busca.id, total: linhas.length });
  } catch (e) {
    const mensagem =
      e instanceof ErroPlaces
        ? e.message
        : e instanceof Error
          ? e.message
          : "Falha ao consultar a base de empresas.";

    await supabase
      .from("buscas")
      .update({ status: "erro", erro: mensagem.slice(0, 500) })
      .eq("id", busca.id);

    return NextResponse.json(
      { erro: mensagem, buscaId: busca.id },
      { status: e instanceof ErroPlaces ? e.status : 500 },
    );
  }
}
