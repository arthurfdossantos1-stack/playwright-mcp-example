/**
 * Tolerancia a schema desatualizado.
 *
 * O banco de producao e migrado a mao, entao pode estar uma versao atras do
 * codigo que ja subiu. Quando isso acontece o PostgREST responde PGRST204
 * ("Could not find the 'x' column ... in the schema cache") e a operacao
 * inteira falha — foi o que derrubou ate a busca no Google quando a coluna
 * `fonte` ainda nao existia.
 *
 * Aqui a gravacao tenta com os campos novos e, se o banco nao os conhecer,
 * repete sem eles. O recurso novo fica indisponivel ate a migracao rodar,
 * mas o que ja funcionava continua funcionando.
 */

type ErroPostgrest = { code?: string; message?: string } | null;

/** Reconhece "essa coluna nao existe neste banco". */
export function colunaAusente(erro: ErroPostgrest): boolean {
  if (!erro) return false;
  if (erro.code === "PGRST204") return true;
  const mensagem = erro.message ?? "";
  return (
    /schema cache/i.test(mensagem) ||
    /column .+ does not exist/i.test(mensagem) ||
    /could not find the .+ column/i.test(mensagem)
  );
}

/** Copia o objeto sem as chaves informadas. */
export function semColunas<T extends Record<string, unknown>>(linha: T, colunas: string[]): T {
  const copia = { ...linha };
  for (const coluna of colunas) delete copia[coluna];
  return copia;
}

/** Colunas que dependem da migracao da busca por Instagram. */
export const COLUNAS_INSTAGRAM_BUSCA = ["fonte"];
export const COLUNAS_INSTAGRAM_EMPRESA = [
  "fonte",
  "instagram_username",
  "instagram_seguidores",
  "instagram_bio",
  "instagram_site_na_bio",
];
