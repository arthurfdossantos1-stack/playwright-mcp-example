import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PaginaArtigo } from "@/components/marketing/PaginaArtigo";
import { obterArtigo } from "@/lib/conteudo";

const SLUG = "como-encontrar-clientes";

export const metadata: Metadata = {
  title: "Como encontrar clientes: o método completo para prospectar do zero",
  description:
    "Roteiro prático para encontrar clientes sem depender de indicação: defina o perfil, use dados públicos, qualifique a lista e organize o follow-up.",
  alternates: { canonical: "/como-encontrar-clientes" },
};

export default function ComoEncontrarClientes() {
  const artigo = obterArtigo(SLUG);
  if (!artigo) notFound();
  return <PaginaArtigo artigo={artigo} />;
}
