import { NextResponse } from "next/server";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";
import { buscarEmpresas, detalharEmpresas, montarTermo, ErroPlaces } from "@/lib/places";
import { descobrirInstagramEmLote } from "@/lib/instagram";
import { avaliarRadar, avaliarRadarInstagram } from "@/lib/radar";
import { validarWhatsapp } from "@/lib/whatsapp";
import { PAISES, PAIS_PADRAO } from "@/lib/paises";
import {
  apifyConfigurado,
  buscarPerfis,
  ErroApify,
  limiteMensal,
  maxPorBusca,
} from "@/lib/apify";
import { inicioDoMesBrasil } from "@/lib/fuso-brasil";
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
  pais: z
    .string()
    .trim()
    .refine((c) => PAISES.some((p) => p.codigo === c), "País não suportado.")
    .default(PAIS_PADRAO),
  fonte: z.enum(["google", "instagram", "ambos"]).default("google"),
  projetoId: z.string().uuid().nullable().optional(),
});

/** Linha pronta pra gravar em `empresas`, montada por qualquer uma das fontes. */
type LinhaEmpresa = Record<string, unknown> & { place_id: string };

/**
 * Quanto ainda cabe da cota mensal do Apify.
 *
 * Contamos no NOSSO banco (empresas de fonte 'instagram' criadas no ciclo) em
 * vez de perguntar ao Apify: e deterministico e nao depende do formato de
 * resposta do endpoint de uso deles, que pode mudar sem aviso.
 */
async function cotaInstagramRestante(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from("empresas")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("fonte", "instagram")
    .gte("criado_em", inicioDoMesBrasil().toISOString());

  return Math.max(0, limiteMensal() - (count ?? 0));
}

/**
 * Dispara uma varredura completa.
 *
 * Sem limite de produto: nao ha teto de empresas por varredura nem de
 * varreduras por mes no Google. O unico controle e o rate limit TECNICO, que
 * protege a cota da API, mais o teto de credito do Apify quando a fonte
 * inclui Instagram (esse sim custa dinheiro de verdade).
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

  const { nicho, cidade, pais, fonte, projetoId } = analise.data;
  const querInstagram = fonte === "instagram" || fonte === "ambos";

  if (querInstagram && !apifyConfigurado()) {
    return NextResponse.json(
      {
        erro: "A busca no Instagram ainda não está configurada. Falta o token do Apify.",
      },
      { status: 400 },
    );
  }

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

  // Teto de credito ANTES de gastar: se a cota do mes acabou, a varredura de
  // Instagram nem comeca. Em "ambos", o Google continua normalmente.
  let cotaInstagram = 0;
  if (querInstagram) {
    cotaInstagram = Math.min(await cotaInstagramRestante(supabase, user.id), maxPorBusca());
    if (cotaInstagram === 0 && fonte === "instagram") {
      return NextResponse.json(
        {
          erro: `Cota do Instagram esgotada neste mês (${limiteMensal()} perfis). Ela volta no dia 1º — até lá, use a busca do Google.`,
        },
        { status: 429 },
      );
    }
  }

  const { data: busca, error: erroBusca } = await supabase
    .from("buscas")
    .insert({
      user_id: user.id,
      projeto_id: projetoId ?? null,
      nicho,
      cidade,
      pais,
      fonte,
      termo: montarTermo(nicho, cidade, pais),
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

  const linhas: LinhaEmpresa[] = [];
  const avisos: string[] = [];

  try {
    if (fonte === "google" || fonte === "ambos") {
      linhas.push(...(await coletarDoGoogle()));
    }

    if (querInstagram && cotaInstagram > 0) {
      try {
        linhas.push(...(await coletarDoInstagram(cotaInstagram)));
      } catch (e) {
        // Em "ambos", o Instagram falhar nao pode derrubar o que o Google ja
        // trouxe: vira aviso e a varredura conclui com o que deu certo.
        if (fonte === "ambos" && e instanceof ErroApify) {
          avisos.push(e.message);
        } else {
          throw e;
        }
      }
    } else if (querInstagram && cotaInstagram === 0) {
      avisos.push(`Cota do Instagram esgotada neste mês (${limiteMensal()} perfis).`);
    }

    if (linhas.length === 0) {
      await supabase
        .from("buscas")
        .update({ status: "concluida", total_resultados: 0, concluido_em: new Date().toISOString() })
        .eq("id", busca.id);
      return NextResponse.json({ buscaId: busca.id, total: 0, avisos });
    }

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

    return NextResponse.json({ buscaId: busca.id, total: linhas.length, avisos });
  } catch (e) {
    const mensagem =
      e instanceof ErroPlaces || e instanceof ErroApify
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
      { status: e instanceof ErroPlaces || e instanceof ErroApify ? e.status : 500 },
    );
  }

  // ------------------------------------------------------------------ fontes

  async function coletarDoGoogle(): Promise<LinhaEmpresa[]> {
    // 1. Text Search — todas as paginas que o Google devolver.
    const resumos = await buscarEmpresas(nicho, cidade, { pais });
    if (resumos.length === 0) return [];

    // 2. Place Details — telefone, site, avaliacoes e endereco.
    const { itens: detalhados, falhas } = await detalharEmpresas(resumos, {
      concorrencia: 6,
      pais,
    });

    // Antes essa falha era silenciosa e a empresa entrava no funil sem
    // telefone, como se o negocio e que nao tivesse numero. Agora ela aparece.
    if (falhas > 0) {
      avisos.push(
        `${falhas} de ${resumos.length} empresas ficaram sem telefone e site: o Google recusou os detalhes (cota). Rode a varredura de novo daqui a pouco para completar.`,
      );
    }

    // 3. Instagram a partir do site da empresa.
    const instagrams = await descobrirInstagramEmLote(
      detalhados.map((d) => d.website),
      5,
    );

    // 4. Radar de Oportunidades.
    return detalhados.map((empresa, indice) => {
      const instagram = instagrams[indice];
      const radar = avaliarRadar({
        website: empresa.website,
        instagram,
        totalAvaliacoes: empresa.totalAvaliacoes,
        nota: empresa.nota,
        telefone: empresa.telefone,
      });
      const whatsapp = validarWhatsapp(empresa.telefone, pais);

      return {
        user_id: user!.id,
        busca_id: busca!.id,
        fonte: "google",
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
  }

  async function coletarDoInstagram(teto: number): Promise<LinhaEmpresa[]> {
    const perfis = await buscarPerfis(nicho, cidade, { limite: teto });

    return perfis.map((perfil) => {
      const radar = avaliarRadarInstagram({
        siteNaBio: Boolean(perfil.site),
        seguidores: perfil.seguidores,
        publicacoes: perfil.publicacoes,
        telefone: perfil.telefone,
        ehNegocio: perfil.ehNegocio,
      });
      const whatsapp = validarWhatsapp(perfil.telefone, pais);

      return {
        user_id: user!.id,
        busca_id: busca!.id,
        fonte: "instagram",
        // O Instagram nao tem place_id; "ig:<username>" cumpre o mesmo papel
        // de chave de deduplicacao dentro da varredura.
        place_id: `ig:${perfil.username}`,
        nome: perfil.nome ?? `@${perfil.username}`,
        endereco: null,
        telefone: perfil.telefone,
        website: perfil.site,
        instagram: perfil.url,
        instagram_username: perfil.username,
        instagram_seguidores: perfil.seguidores,
        instagram_bio: perfil.bio,
        instagram_site_na_bio: Boolean(perfil.site),
        categoria: perfil.categoria,
        nota: null,
        total_avaliacoes: 0,
        latitude: null,
        longitude: null,
        google_maps_url: null,
        prioridade: radar.prioridade,
        score_radar: radar.score,
        motivos_radar: radar.motivos,
        whatsapp_e164: whatsapp.e164,
        whatsapp_verificado: whatsapp.verificado,
        fotos_total: perfil.publicacoes ?? 0,
      };
    });
  }
}
