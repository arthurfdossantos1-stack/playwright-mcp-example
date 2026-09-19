/**
 * Busca de perfis no Instagram via Apify.
 *
 * Por que Apify e nao a API oficial: a Graph API do Instagram NAO tem busca de
 * contas por palavra-chave. O unico "descobrir" dela e o Business Discovery,
 * que exige saber o @ exato de antemao. Para achar negocios de um nicho numa
 * cidade, so raspando a busca publica — que e o que os atores do Apify fazem.
 *
 * Custo: o plano gratuito do Apify da US$ 5 de credito por mes. A ~US$ 2,60
 * por mil perfis, isso e da ordem de 1.900 perfis/mes. Por isso existem DOIS
 * tetos, checados antes de qualquer chamada:
 *
 *   1. `APIFY_MAX_POR_BUSCA`   - teto de perfis por varredura
 *   2. `APIFY_LIMITE_MENSAL`   - teto de perfis por mes, contado no NOSSO
 *                                banco (empresas de fonte 'instagram' criadas
 *                                no ciclo), nao na API do Apify
 *
 * A contagem propria e de proposito: ela e deterministica e nao depende do
 * formato de resposta do endpoint de uso do Apify, que pode mudar.
 */

const BASE = "https://api.apify.com/v2";

/**
 * Ator que faz a busca publica do Instagram (user / hashtag / place).
 *
 * Configuravel de proposito. Os atores da Apify Store mudam de nome, de dono
 * e de schema sem aviso, e nao da pra validar o id daqui. Se o padrao parar
 * de existir, e so trocar APIFY_ATOR_BUSCA no painel — sem mexer no codigo.
 * Formato do id na API: "dono~nome" (o ~ substitui a barra).
 */
const ATOR_PADRAO = "apify~instagram-search-scraper";

function atorBusca(): string {
  const escolhido = process.env.APIFY_ATOR_BUSCA?.trim();
  if (!escolhido) return ATOR_PADRAO;
  // Aceita "dono/nome" colado direto da URL da Store.
  return escolhido.replace("/", "~");
}

/** Runs sincronos do Apify cortam em 300s; damos folga abaixo disso. */
const TIMEOUT_MS = 240_000;

export class ErroApify extends Error {
  readonly status: number;
  constructor(mensagem: string, status = 502) {
    super(mensagem);
    this.name = "ErroApify";
    this.status = status;
  }
}

export type PerfilInstagram = {
  username: string;
  nome: string | null;
  url: string;
  bio: string | null;
  /** Link externo da bio. Null aqui = a oportunidade que o Radar procura. */
  site: string | null;
  seguidores: number | null;
  publicacoes: number | null;
  verificado: boolean;
  /** Conta comercial costuma ter telefone/categoria publicos. */
  ehNegocio: boolean;
  categoria: string | null;
  telefone: string | null;
};

export function apifyConfigurado(): boolean {
  return Boolean(process.env.APIFY_TOKEN);
}

function token(): string {
  const valor = process.env.APIFY_TOKEN;
  if (!valor) {
    throw new ErroApify(
      "APIFY_TOKEN não configurada. Adicione o token do Apify para buscar no Instagram.",
      500,
    );
  }
  return valor;
}

function inteiroDoAmbiente(chave: string, padrao: number): number {
  const bruto = Number(process.env[chave]);
  return Number.isFinite(bruto) && bruto > 0 ? Math.floor(bruto) : padrao;
}

/** Teto de perfis por varredura. */
export function maxPorBusca(): number {
  return inteiroDoAmbiente("APIFY_MAX_POR_BUSCA", 40);
}

/**
 * Teto de perfis por mes. O padrao fica abaixo dos ~1.900 que o credito
 * gratuito compra, para sobrar margem se o preco do ator subir.
 */
export function limiteMensal(): number {
  return inteiroDoAmbiente("APIFY_LIMITE_MENSAL", 1500);
}

type ItemApify = {
  username?: string;
  fullName?: string;
  full_name?: string;
  url?: string;
  biography?: string;
  externalUrl?: string;
  external_url?: string;
  followersCount?: number;
  followers_count?: number;
  postsCount?: number;
  posts_count?: number;
  verified?: boolean;
  isVerified?: boolean;
  isBusinessAccount?: boolean;
  businessCategoryName?: string;
  businessPhoneNumber?: string;
  [chave: string]: unknown;
};

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function numero(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

/**
 * Normaliza o item do Apify.
 *
 * Os atores do Store variam no nome dos campos entre versoes (camelCase x
 * snake_case), entao aceitamos as duas grafias em vez de quebrar quando o
 * ator for atualizado.
 */
function normalizar(item: ItemApify): PerfilInstagram | null {
  const username = texto(item.username);
  if (!username) return null;

  return {
    username,
    nome: texto(item.fullName) ?? texto(item.full_name),
    url: texto(item.url) ?? `https://www.instagram.com/${username}/`,
    bio: texto(item.biography),
    site: texto(item.externalUrl) ?? texto(item.external_url),
    seguidores: numero(item.followersCount) ?? numero(item.followers_count),
    publicacoes: numero(item.postsCount) ?? numero(item.posts_count),
    verificado: Boolean(item.verified ?? item.isVerified),
    ehNegocio: Boolean(item.isBusinessAccount),
    categoria: texto(item.businessCategoryName),
    telefone: texto(item.businessPhoneNumber),
  };
}

/**
 * Roda o ator e devolve os itens do dataset numa unica chamada.
 * `maxItems` e enviado ao Apify tambem como parametro da URL: e ele que
 * limita o que e COBRADO, nao so o que voltou.
 */
async function rodarAtor(
  ator: string,
  entrada: Record<string, unknown>,
  maxItens: number,
  sinal?: AbortSignal,
): Promise<ItemApify[]> {
  const url = `${BASE}/acts/${ator}/run-sync-get-dataset-items?token=${encodeURIComponent(
    token(),
  )}&maxItems=${maxItens}&timeout=${Math.floor(TIMEOUT_MS / 1000)}`;

  const abortador = new AbortController();
  const relogio = setTimeout(() => abortador.abort(), TIMEOUT_MS);
  sinal?.addEventListener("abort", () => abortador.abort(), { once: true });

  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entrada),
      signal: abortador.signal,
      cache: "no-store",
    });

    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => "");
      if (resposta.status === 401 || resposta.status === 403) {
        throw new ErroApify("Token do Apify inválido ou sem permissão.", 502);
      }
      if (resposta.status === 402) {
        throw new ErroApify(
          "O crédito do Apify acabou neste mês. A busca no Instagram volta no próximo ciclo.",
          402,
        );
      }
      if (resposta.status === 404) {
        throw new ErroApify(
          `O ator "${ator.replace("~", "/")}" não existe na sua conta do Apify. Abra a Apify Store, escolha um scraper de busca do Instagram e coloque o id dele (dono/nome) em APIFY_ATOR_BUSCA.`,
          400,
        );
      }
      throw new ErroApify(`Apify respondeu ${resposta.status}: ${corpo.slice(0, 200)}`, 502);
    }

    const json = (await resposta.json()) as unknown;
    return Array.isArray(json) ? (json as ItemApify[]) : [];
  } catch (e) {
    if (e instanceof ErroApify) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new ErroApify("A busca no Instagram demorou demais e foi cancelada.", 504);
    }
    throw new ErroApify("Falha ao falar com o Apify.", 502);
  } finally {
    clearTimeout(relogio);
  }
}

/**
 * Procura perfis de um nicho numa cidade.
 *
 * `limite` ja chega cortado pela cota mensal restante — esta funcao so aplica
 * o teto por varredura por cima.
 */
export async function buscarPerfis(
  nicho: string,
  cidade: string,
  opcoes: { limite?: number; sinal?: AbortSignal } = {},
): Promise<PerfilInstagram[]> {
  const teto = Math.max(0, Math.min(opcoes.limite ?? maxPorBusca(), maxPorBusca()));
  if (teto === 0) return [];

  const termo = `${nicho.trim()} ${cidade.trim()}`.trim();

  const itens = await rodarAtor(
    atorBusca(),
    {
      search: termo,
      searchType: "user",
      searchLimit: teto,
      resultsLimit: teto,
    },
    teto,
    opcoes.sinal,
  );

  const vistos = new Set<string>();
  const perfis: PerfilInstagram[] = [];
  for (const item of itens) {
    const perfil = normalizar(item);
    if (!perfil || vistos.has(perfil.username)) continue;
    vistos.add(perfil.username);
    perfis.push(perfil);
    if (perfis.length >= teto) break;
  }
  return perfis;
}
