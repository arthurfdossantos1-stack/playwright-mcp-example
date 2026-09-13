import type { MetadataRoute } from "next";
import { listarArtigos } from "@/lib/conteudo";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");

  const estaticas: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/conteudos`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/auth`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/termos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacidade`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cookies`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const artigos: MetadataRoute.Sitemap = listarArtigos().map((artigo) => ({
    url: `${base}${artigo.rota}`,
    changeFrequency: "monthly" as const,
    priority: artigo.destaque ? 0.9 : 0.7,
  }));

  return [...estaticas, ...artigos];
}
