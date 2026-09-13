import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PaginaArtigo } from "@/components/marketing/PaginaArtigo";
import { obterArtigo } from "@/lib/conteudo";

const SLUG = "guia-prospeccao-b2b";

export const metadata: Metadata = {
  title: "Guia de prospecção B2B em 4 passos",
  description:
    "Definir o perfil ideal, pesquisar com intenção, qualificar os resultados e organizar o acompanhamento: o processo completo de prospecção B2B.",
  alternates: { canonical: "/guia-prospeccao-b2b" },
};

export default function GuiaProspeccaoB2B() {
  const artigo = obterArtigo(SLUG);
  if (!artigo) notFound();
  return <PaginaArtigo artigo={artigo} />;
}
