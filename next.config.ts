import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Arquivos Markdown de conteudo sao lidos do disco em build/SSR.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
