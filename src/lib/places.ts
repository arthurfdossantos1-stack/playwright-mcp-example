/**
 * Integracao com a Google Places API (New).
 *
 * Fluxo:
 *   1. places:searchText  -> lista as empresas de "nicho + cidade"
 *   2. places/{id}        -> Place Details: telefone, site, avaliacoes, endereco
 *
 * Nao ha limite de produto no numero de empresas retornadas por varredura.
 * O unico teto e a propria paginacao da API do Google (paginas de ate 20
 * resultados via nextPageToken) e um limite de seguranca de paginas para
 * nao entrar em loop caso a API mude de comportamento.
 */

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const DETAILS_URL = "https://places.googleapis.com/v1/places";

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.primaryTypeDisplayName",
  "places.businessStatus",
  "places.googleMapsUri",
  "nextPageToken",
].join(",");

const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "location",
  "googleMapsUri",
  "primaryTypeDisplayName",
  "businessStatus",
  "photos",
].join(",");

/** Teto de seguranca de paginas (a API do Google hoje devolve no maximo 3). */
const MAX_PAGINAS = 10;

export type PlaceResumo = {
  placeId: string;
  nome: string;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  nota: number | null;
  totalAvaliacoes: number;
  categoria: string | null;
  googleMapsUrl: string | null;
};

export type PlaceDetalhado = PlaceResumo & {
  telefone: string | null;
  website: string | null;
  /** Nao baixamos as fotos - so a contagem, usada como contexto no prompt de previa. */
  totalFotos: number;
};

type ApiPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  primaryTypeDisplayName?: { text?: string };
  businessStatus?: string;
  photos?: unknown[];
};

export class ErroPlaces extends Error {
  readonly status: number;
  constructor(mensagem: string, status = 502) {
    super(mensagem);
    this.name = "ErroPlaces";
    this.status = status;
  }
}

function chaveApi(): string {
  const chave = process.env.GOOGLE_PLACES_API_KEY;
  if (!chave) {
    throw new ErroPlaces(
      "GOOGLE_PLACES_API_KEY nao configurada. Adicione a chave da Places API (New) no .env.local.",
      500,
    );
  }
  return chave;
}

function normalizarResumo(place: ApiPlace): PlaceResumo | null {
  if (!place.id) return null;
  return {
    placeId: place.id,
    nome: place.displayName?.text?.trim() || "Empresa sem nome",
    endereco: place.formattedAddress?.trim() || null,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    nota: typeof place.rating === "number" ? place.rating : null,
    totalAvaliacoes: place.userRatingCount ?? 0,
    categoria: place.primaryTypeDisplayName?.text?.trim() || null,
    googleMapsUrl: place.googleMapsUri ?? null,
  };
}

/** Monta o termo de busca a partir do nicho e da cidade. */
export function montarTermo(nicho: string, cidade: string): string {
  return `${nicho.trim()} em ${cidade.trim()}`;
}

/**
 * Text Search paginado. Percorre todas as paginas disponiveis: nao ha
 * corte por plano, so o limite natural da API.
 */
export async function buscarEmpresas(
  nicho: string,
  cidade: string,
  opcoes: { sinal?: AbortSignal } = {},
): Promise<PlaceResumo[]> {
  const chave = chaveApi();
  const termo = montarTermo(nicho, cidade);

  const encontrados: PlaceResumo[] = [];
  const vistos = new Set<string>();
  let pageToken: string | undefined;

  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const corpo: Record<string, unknown> = {
      textQuery: termo,
      languageCode: "pt-BR",
      regionCode: "BR",
      pageSize: 20,
    };
    if (pageToken) corpo.pageToken = pageToken;

    const resposta = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": chave,
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
      },
      body: JSON.stringify(corpo),
      signal: opcoes.sinal,
      cache: "no-store",
    });

    if (!resposta.ok) {
      const texto = await resposta.text().catch(() => "");
      throw new ErroPlaces(
        `Google Places respondeu ${resposta.status}: ${texto.slice(0, 300)}`,
        resposta.status === 429 ? 429 : 502,
      );
    }

    const json = (await resposta.json()) as {
      places?: ApiPlace[];
      nextPageToken?: string;
    };

    for (const place of json.places ?? []) {
      const resumo = normalizarResumo(place);
      if (resumo && !vistos.has(resumo.placeId)) {
        vistos.add(resumo.placeId);
        encontrados.push(resumo);
      }
    }

    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }

  return encontrados;
}

/** Place Details de um unico place_id. */
export async function detalharEmpresa(
  placeId: string,
  opcoes: { sinal?: AbortSignal } = {},
): Promise<PlaceDetalhado | null> {
  const chave = chaveApi();

  const resposta = await fetch(`${DETAILS_URL}/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": chave,
      "X-Goog-FieldMask": DETAILS_FIELD_MASK,
      "Accept-Language": "pt-BR",
    },
    signal: opcoes.sinal,
    cache: "no-store",
  });

  if (!resposta.ok) return null;

  const place = (await resposta.json()) as ApiPlace;
  const resumo = normalizarResumo(place);
  if (!resumo) return null;

  return {
    ...resumo,
    telefone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    totalFotos: Array.isArray(place.photos) ? place.photos.length : 0,
  };
}

/**
 * Detalha varias empresas com concorrencia limitada (protege a cota do Google
 * e evita rajadas, sem restringir a quantidade de resultados da varredura).
 */
export async function detalharEmpresas(
  resumos: PlaceResumo[],
  opcoes: { concorrencia?: number; sinal?: AbortSignal } = {},
): Promise<PlaceDetalhado[]> {
  const concorrencia = Math.max(1, opcoes.concorrencia ?? 6);
  const saida: PlaceDetalhado[] = new Array(resumos.length);
  let cursor = 0;

  async function trabalhador() {
    while (cursor < resumos.length) {
      const indice = cursor++;
      const resumo = resumos[indice];
      try {
        const detalhe = await detalharEmpresa(resumo.placeId, { sinal: opcoes.sinal });
        saida[indice] = detalhe ?? { ...resumo, telefone: null, website: null, totalFotos: 0 };
      } catch {
        saida[indice] = { ...resumo, telefone: null, website: null, totalFotos: 0 };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concorrencia, resumos.length) }, () => trabalhador()),
  );

  return saida.filter(Boolean);
}
