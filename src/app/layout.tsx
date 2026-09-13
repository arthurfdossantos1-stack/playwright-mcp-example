import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "RastroLead — Rastreie empresas. Encontre clientes.",
    template: "%s · RastroLead",
  },
  description: SITE.descricao,
  keywords: [
    "prospecção B2B",
    "encontrar clientes",
    "lista de empresas por cidade",
    "leads qualificados",
    "Google Places",
    "captação de clientes",
  ],
  authors: [{ name: "RastroLead" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE.url,
    siteName: SITE.nome,
    title: "RastroLead — Rastreie empresas. Encontre clientes.",
    description: SITE.descricao,
  },
  twitter: {
    card: "summary_large_image",
    title: "RastroLead — Rastreie empresas. Encontre clientes.",
    description: SITE.descricao,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
