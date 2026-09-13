import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PaginaArtigo } from "@/components/marketing/PaginaArtigo";
import { artigosDoHubComRotaPadrao, obterArtigo } from "@/lib/conteudo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return artigosDoHubComRotaPadrao().map((artigo) => ({ slug: artigo.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artigo = obterArtigo(slug);
  if (!artigo) return { title: "Conteúdo não encontrado" };

  return {
    title: artigo.titulo,
    description: artigo.resumo,
    alternates: { canonical: artigo.rota },
    openGraph: { title: artigo.titulo, description: artigo.resumo, type: "article" },
  };
}

export default async function ArtigoPorSlug({ params }: Props) {
  const { slug } = await params;
  const artigo = obterArtigo(slug);

  // Artigos com rota propria (ex.: /guia-prospeccao-b2b) nao duplicam aqui.
  if (!artigo || artigo.rota !== `/conteudos/${slug}`) notFound();

  return <PaginaArtigo artigo={artigo} />;
}
