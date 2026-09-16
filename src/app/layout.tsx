import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { ANTI_PISCADA } from "@/lib/tema";
import { AvisoCookies } from "@/components/AvisoCookies";

/**
 * Bricolage Grotesque nos títulos, Instrument Sans na interface.
 * Inter saiu de propósito: é a fonte padrão de praticamente todo SaaS e era
 * parte do que fazia o RastroLead parecer template genérico.
 */
const fonteTitulo = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--fonte-titulo",
  display: "swap",
});

const fonteInterface = Instrument_Sans({
  subsets: ["latin"],
  variable: "--fonte-interface",
  display: "swap",
});

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
    <html lang="pt-BR" className={`${fonteTitulo.variable} ${fonteInterface.variable}`}>
      <head>
        {/* Aplica o tema antes da primeira pintura: sem isso a tela pisca
            branca por um quadro antes de virar escura. */}
        <script dangerouslySetInnerHTML={{ __html: ANTI_PISCADA }} />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <AvisoCookies />
      </body>
    </html>
  );
}
