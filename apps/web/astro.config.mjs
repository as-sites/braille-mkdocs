import { defineConfig, memoryCache } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import starlight from "@astrojs/starlight";
import { fileURLToPath } from "node:url";

export default defineConfig({
  site: "https://braille-wiki.pages.dev",
  output: "server",
  server: {
    host: true,
  },
  adapter: cloudflare(),
  integrations: [
    starlight({
      title: "Braille Documentation Platform",
      description:
        "Accessible braille reference works rendered directly from published content in Postgres.",
      tagline: "Published braille codebooks, manuals, and standards.",
      prerender: false,
      pagefind: false,
      lastUpdated: true,
      pagination: true,
      sidebar: [],
      customCss: ["/src/styles/site.css"],
      components: {
        Search: "./src/components/SearchModal.astro",
        Sidebar: "./src/components/Sidebar.astro",
      },
    }),
  ],
  experimental: {
    cache: {
      provider: memoryCache(),
    },
  },
  vite: {
    resolve: {
      alias: {
        "@braille-wiki/db": fileURLToPath(
          new URL("../../packages/db/src/index.ts", import.meta.url),
        ),
        "@braille-wiki/shared": fileURLToPath(
          new URL("../../packages/shared/src/index.ts", import.meta.url),
        ),
      },
    },
  },
});
