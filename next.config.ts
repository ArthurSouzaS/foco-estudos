import type { NextConfig } from "next";

/**
 * Export estático para o GitHub Pages.
 * O basePath pode ser sobrescrito pela variável NEXT_PUBLIC_BASE_PATH
 * (ex.: string vazia para rodar na raiz de um domínio próprio).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/foco-estudos";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
