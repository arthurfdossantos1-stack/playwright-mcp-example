import type { NextConfig } from "next";

/**
 * Cabecalhos de seguranca.
 *
 * O objetivo e o basico bem feito: impedir que o site seja embutido em outro
 * (clickjacking), que o navegador adivinhe tipos de arquivo, que a URL vaze
 * para terceiros e que qualquer script de fora seja carregado.
 *
 * Sobre a CSP: o Next injeta scripts inline no streaming do RSC, entao
 * `script-src` precisa aceitar inline. Isso enfraquece a CSP contra XSS, mas
 * `script-src 'self'` continua barrando script de DOMINIO externo, que e o
 * vetor mais comum. Fechar isso de vez exigiria nonce por requisicao — e
 * nonce obriga toda pagina a virar dinamica, matando o build estatico da
 * landing. A troca foi consciente.
 */
const CSP = [
  "default-src 'self'",
  // challenges.cloudflare.com: widget do Turnstile (CAPTCHA do cadastro).
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // Supabase (auth e dados) e o unico destino externo chamado do navegador.
  // Places e Gemini so sao chamados do servidor, entao nao entram aqui.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com",
  "frame-src 'self' https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const CABECALHOS = [
  { key: "Content-Security-Policy", value: CSP },
  // Redundante com frame-ancestors, para navegador antigo.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // HTTPS obrigatorio por 2 anos, subdominios inclusos.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Arquivos Markdown de conteudo sao lidos do disco em build/SSR.
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [{ source: "/:caminho*", headers: CABECALHOS }];
  },
};

export default nextConfig;
