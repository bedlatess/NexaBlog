import { defineConfig } from "astro/config";
import { loadLocalEnv } from "./scripts/load-local-env.mjs";

loadLocalEnv();

const site = process.env.PUBLIC_SITE_URL ?? "https://nexablog.example.com";

export default defineConfig({
  site,
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark"
      },
      wrap: true
    }
  },
  vite: {
    build: {
      assetsInlineLimit: 0
    }
  }
});
