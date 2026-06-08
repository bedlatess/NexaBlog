import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, GITHUB_TOKEN, GITHUB_REPOSITORY } = process.env;

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) fail("Missing Supabase env vars.");
if (!GITHUB_TOKEN || !GITHUB_REPOSITORY) fail("Missing GITHUB_TOKEN or GITHUB_REPOSITORY.");

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { data, error } = await supabase
  .from("posts")
  .select("id,slug,title,description,body,tags,draft,featured,published_at,updated_at,cover_image")
  .order("updated_at", { ascending: false });

if (error) fail(`Supabase error: ${error.message}`);

const backup = JSON.stringify({ posts: data ?? [], exported_at: new Date().toISOString() }, null, 2);
const content = Buffer.from(backup).toString("base64");

const path = "backups/posts.json";
const [owner, repo] = GITHUB_REPOSITORY.split("/");
const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
const headers = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  "Content-Type": "application/json",
  Accept: "application/vnd.github+json"
};

// get current sha if file exists (needed for update)
const existing = await fetch(apiBase, { headers });
const sha = existing.ok ? (await existing.json()).sha : undefined;

const res = await fetch(apiBase, {
  method: "PUT",
  headers,
  body: JSON.stringify({
    message: `chore: backup posts ${new Date().toISOString().split("T")[0]}`,
    content,
    ...(sha ? { sha } : {})
  })
});

if (!res.ok) {
  const body = await res.text();
  fail(`GitHub API error ${res.status}: ${body}`);
}

console.log(`Backed up ${(data ?? []).length} posts to ${path}`);
