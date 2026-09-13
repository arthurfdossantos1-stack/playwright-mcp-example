import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const DIRETORIO = path.join(process.cwd(), "content", "artigos");

export type Artigo = {
  slug: string;
  titulo: string;
  resumo: string;
  rota: string;
  categoria: string;
  leitura: string;
  publicadoEm: string;
  destaque: boolean;
  conteudoMarkdown: string;
};

marked.setOptions({ gfm: true, breaks: false });

function lerArquivo(nomeArquivo: string): Artigo {
  const slug = nomeArquivo.replace(/\.md$/, "");
  const bruto = fs.readFileSync(path.join(DIRETORIO, nomeArquivo), "utf8");
  const { data, content } = matter(bruto);

  return {
    slug,
    titulo: String(data.titulo ?? slug),
    resumo: String(data.resumo ?? ""),
    rota: String(data.rota ?? `/conteudos/${slug}`),
    categoria: String(data.categoria ?? "Prospecção"),
    leitura: String(data.leitura ?? "5 min de leitura"),
    publicadoEm: String(data.publicadoEm ?? ""),
    destaque: Boolean(data.destaque ?? false),
    conteudoMarkdown: content,
  };
}

export function listarArtigos(): Artigo[] {
  if (!fs.existsSync(DIRETORIO)) return [];
  return fs
    .readdirSync(DIRETORIO)
    .filter((arquivo) => arquivo.endsWith(".md"))
    .map(lerArquivo)
    .sort((a, b) => {
      if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
      return b.publicadoEm.localeCompare(a.publicadoEm);
    });
}

export function obterArtigo(slug: string): Artigo | null {
  const arquivo = path.join(DIRETORIO, `${slug}.md`);
  if (!fs.existsSync(arquivo)) return null;
  return lerArquivo(`${slug}.md`);
}

/** Artigos que vivem em /conteudos/[slug] (os com rota propria ficam de fora). */
export function artigosDoHubComRotaPadrao(): Artigo[] {
  return listarArtigos().filter((artigo) => artigo.rota === `/conteudos/${artigo.slug}`);
}

export async function renderizarMarkdown(markdown: string): Promise<string> {
  return marked.parse(markdown) as string | Promise<string>;
}
