/**
 * Descoberta de Instagram.
 *
 * Heuristica: com o site retornado pelo Place Details, baixamos a homepage e
 * procuramos links instagram.com/<perfil> via regex, ignorando caminhos que
 * nao sao perfis (p/, reel/, explore/, accounts/, etc).
 */

const REGEX_INSTAGRAM =
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})(?:\/|\?|"|'|<|\s|$)/gi;

/** Caminhos do instagram.com que nao sao perfis de empresa. */
const RESERVADOS = new Set([
  "p",
  "reel",
  "reels",
  "tv",
  "stories",
  "explore",
  "accounts",
  "about",
  "developer",
  "developers",
  "legal",
  "privacy",
  "terms",
  "directory",
  "web",
  "share",
  "invites",
  "challenge",
  "emails",
  "session",
  "oauth",
  "graphql",
  "api",
  "static",
  "embed",
  "instagram",
]);

const TIMEOUT_MS = 7000;
const MAX_BYTES = 400_000;

export function extrairPerfilInstagram(html: string): string | null {
  REGEX_INSTAGRAM.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = REGEX_INSTAGRAM.exec(html)) !== null) {
    const perfil = match[1];
    const normalizado = perfil.toLowerCase().replace(/\.$/, "");
    if (!normalizado || RESERVADOS.has(normalizado)) continue;
    if (normalizado.length < 2) continue;
    return normalizado;
  }

  return null;
}

/** Normaliza para a URL publica do perfil. */
export function urlInstagram(perfil: string): string {
  const limpo = perfil.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  return `https://instagram.com/${limpo.replace(/\/$/, "")}`;
}

/**
 * Baixa a homepage da empresa e tenta achar o perfil do Instagram.
 * Falhas (timeout, DNS, 403, site pesado) retornam null sem quebrar a busca.
 */
export async function descobrirInstagram(website: string | null): Promise<string | null> {
  if (!website) return null;

  let url: URL;
  try {
    url = new URL(website.startsWith("http") ? website : `https://${website}`);
  } catch {
    return null;
  }

  // O proprio site ja e um Instagram.
  if (url.hostname.replace(/^www\./, "") === "instagram.com") {
    const perfil = extrairPerfilInstagram(url.toString());
    return perfil ? urlInstagram(perfil) : null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RastroLeadBot/1.0; +https://rastrolead.com.br/sobre)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      cache: "no-store",
    });

    if (!resposta.ok) return null;

    const tipo = resposta.headers.get("content-type") ?? "";
    if (!tipo.includes("html")) return null;

    const html = await lerParcial(resposta);
    const perfil = extrairPerfilInstagram(html);
    return perfil ? urlInstagram(perfil) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Le no maximo MAX_BYTES do corpo para nao travar em sites gigantes. */
async function lerParcial(resposta: Response): Promise<string> {
  const reader = resposta.body?.getReader();
  if (!reader) return resposta.text();

  const decoder = new TextDecoder();
  let total = 0;
  let texto = "";

  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    texto += decoder.decode(value, { stream: true });
  }

  try {
    await reader.cancel();
  } catch {
    /* ignora */
  }

  return texto;
}

/** Descobre o Instagram de varias empresas com concorrencia limitada. */
export async function descobrirInstagramEmLote(
  sites: (string | null)[],
  concorrencia = 5,
): Promise<(string | null)[]> {
  const saida: (string | null)[] = new Array(sites.length).fill(null);
  let cursor = 0;

  async function trabalhador() {
    while (cursor < sites.length) {
      const indice = cursor++;
      saida[indice] = await descobrirInstagram(sites[indice]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concorrencia, sites.length) }, () => trabalhador()),
  );

  return saida;
}
