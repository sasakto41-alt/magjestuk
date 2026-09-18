import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Для GitHub Pages: статический экспорт HTML/CSS/JS
  output: "export",
  // Если репозиторий называется не <username>.github.io, нужно указать путь
  // например basePath: "/my-repo" для репозитория my-repo
  // basePath: "/your-repo-name",
  // Добавляем trailing slash для совместимости с GitHub Pages
  trailingSlash: true,
  // Отключаем оптимизацию изображений (не работает в static export)
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
