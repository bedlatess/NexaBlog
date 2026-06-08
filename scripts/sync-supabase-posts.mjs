import { createClient } from "@supabase/supabase-js";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadLocalEnv } from "./load-local-env.mjs";

const outDir = join(process.cwd(), "src", "content", "blog", "generated");
const marker = "<!-- generated: supabase -->";

function fail(message) {
  console.error(`Supabase sync failed: ${message}`);
  process.exit(1);
}

function yamlString(value) {
  return JSON.stringify(String(value ?? ""));
}

function yamlArray(values) {
  return `[${(values ?? []).map((value) => yamlString(value)).join(", ")}]`;
}

function normalizeSlug(slug) {
  const value = String(slug ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value)) {
    fail(`Invalid post slug from Supabase: ${slug}`);
  }
  return value;
}

function normalizeBody(body) {
  const value = String(body ?? "").replace(/\r\n/g, "\n");
  const normalized = value.includes("\n") ? value : value.replace(/\\n/g, "\n");
  return normalized.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (match, alt, src) => {
    if (/^(https?:\/\/|\/)/i.test(src)) return match;
    console.warn(`Skipped local image reference from Supabase post body: ${src}`);
    return alt ? `[${alt}]` : "";
  });
}

function toMarkdown(post) {
  const published = post.published_at ? new Date(post.published_at) : new Date();
  const updated = post.updated_at ? new Date(post.updated_at) : published;
  return `---\n` +
    `title: ${yamlString(post.title)}\n` +
    `description: ${yamlString(post.description)}\n` +
    `published: ${published.toISOString()}\n` +
    `updated: ${updated.toISOString()}\n` +
    `tags: ${yamlArray(post.tags)}\n` +
    `featured: ${Boolean(post.featured)}\n` +
    `draft: false\n` +
    `cover:\n` +
    `  label: ${yamlString("Supabase")}\n` +
    `  signal: ${yamlString("Live Content")}\n` +
    `  tone: "green"\n` +
    `---\n\n` +
    `${marker}\n\n` +
    `${normalizeBody(post.body)}\n`;
}

async function cleanGeneratedFiles() {
  await mkdir(outDir, { recursive: true });
  const files = await readdir(outDir);
  await Promise.all(files.map(async (file) => {
    if (!file.endsWith(".md")) return;
    const path = join(outDir, file);
    const content = await readFile(path, "utf8");
    if (content.includes(marker)) await rm(path);
  }));
}

async function getManualSlugs() {
  const blogDir = join(process.cwd(), "src", "content", "blog");
  const files = await readdir(blogDir, { withFileTypes: true });
  return new Set(
    files
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name.replace(/\.md$/, ""))
  );
}

loadLocalEnv();

const url = process.env.PUBLIC_SUPABASE_URL;
const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  fail("PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are required.");
}

const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const { data, error } = await supabase
  .from("posts")
  .select("slug,title,description,body,tags,draft,featured,published_at,updated_at")
  .eq("draft", false)
  .not("published_at", "is", null)
  .lte("published_at", new Date().toISOString())
  .order("published_at", { ascending: false });

if (error) fail(error.message);

await cleanGeneratedFiles();
const manualSlugs = await getManualSlugs();

for (const post of data ?? []) {
  const slug = normalizeSlug(post.slug);
  if (manualSlugs.has(slug)) {
    fail(`Supabase post slug conflicts with a hand-written Markdown post: ${slug}`);
  }
  await writeFile(join(outDir, `${slug}.md`), toMarkdown(post), "utf8");
}

if (!existsSync(join(outDir, ".gitkeep"))) {
  await writeFile(join(outDir, ".gitkeep"), "", "utf8");
}

console.log(`Synced ${(data ?? []).length} Supabase post(s) into src/content/blog/generated.`);
