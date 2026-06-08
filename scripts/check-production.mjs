import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadLocalEnv } from "./load-local-env.mjs";

const root = process.cwd();
const requiredFiles = [
  "astro.config.mjs",
  "vercel.json",
  ".env.example",
  "src/content.config.ts",
  "src/pages/rss.xml.ts",
  "src/pages/sitemap.xml.ts",
  "public/assets/nexablog-og.png",
  "supabase/schema.sql"
];

const errors = [];
const warnings = [];

loadLocalEnv();

for (const file of requiredFiles) {
  if (!existsSync(resolve(root, file))) {
    errors.push(`Missing required deployment file: ${file}`);
  }
}

const siteUrl = process.env.PUBLIC_SITE_URL ?? "https://nexablog.example.com";

try {
  const parsed = new URL(siteUrl);
  if (!["https:", "http:"].includes(parsed.protocol)) {
    errors.push("PUBLIC_SITE_URL must use http or https.");
  }
  if (parsed.hostname === "nexablog.example.com") {
    warnings.push("PUBLIC_SITE_URL is still using the placeholder domain.");
  }
  if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
    warnings.push("PUBLIC_SITE_URL points to a local development host.");
  }
} catch {
  errors.push(`PUBLIC_SITE_URL is not a valid URL: ${siteUrl}`);
}

const envExample = existsSync(".env.example") ? readFileSync(".env.example", "utf8") : "";
for (const key of ["PUBLIC_SITE_URL", "PUBLIC_GISCUS_REPO", "PUBLIC_PLAUSIBLE_DOMAIN", "PUBLIC_SUPABASE_URL"]) {
  if (!envExample.includes(key)) {
    errors.push(`.env.example is missing ${key}`);
  }
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
for (const script of ["build", "build:with-supabase", "sync:supabase"]) {
  if (!packageJson.scripts?.[script]) {
    errors.push(`package.json is missing script: ${script}`);
  }
}

if (warnings.length) {
  console.log("Production check warnings:");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (!process.env.PUBLIC_SUPABASE_URL || !process.env.PUBLIC_SUPABASE_ANON_KEY) {
  console.log("Production check notes:");
  console.log("- Supabase is not configured. Use npm run build for static-only builds, or set Supabase env vars before npm run build:with-supabase.");
}

if (errors.length) {
  console.error("Production check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Production check passed.");
