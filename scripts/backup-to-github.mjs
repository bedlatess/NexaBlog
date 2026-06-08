import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, GITHUB_TOKEN, GITHUB_REPOSITORY } = process.env;

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) fail("Missing Supabase env vars.");
if (!GITHUB_TOKEN || !GITHUB_REPOSITORY) fail("Missing GITHUB_TOKEN or GITHUB_REPOSITORY.");

// Fetch posts via PostgREST — no Supabase client needed, no WebSocket dep
const res = await fetch(
  `${PUBLIC_SUPABASE_URL}/rest/v1/posts?select=id,slug,title,description,body,tags,draft,featured,published_at,updated_at,cover_image&order=updated_at.desc`,
  {
    headers: {
      apikey: PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${PUBLIC_SUPABASE_ANON_KEY}`
    }
  }
);

if (!res.ok) fail(`Supabase error ${res.status}: ${await res.text()}`);
const posts = await res.json();

const backup = JSON.stringify({ posts, exported_at: new Date().toISOString() }, null, 2);
const content = Buffer.from(backup).toString("base64");

const path = "backups/posts.json";
const [owner, repo] = GITHUB_REPOSITORY.split("/");
const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
const ghHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  "Content-Type": "application/json",
  Accept: "application/vnd.github+json"
};

const existing = await fetch(apiBase, { headers: ghHeaders });
const sha = existing.ok ? (await existing.json()).sha : undefined;

const put = await fetch(apiBase, {
  method: "PUT",
  headers: ghHeaders,
  body: JSON.stringify({
    message: `chore: backup posts ${new Date().toISOString().split("T")[0]}`,
    content,
    ...(sha ? { sha } : {})
  })
});

if (!put.ok) fail(`GitHub API error ${put.status}: ${await put.text()}`);

console.log(`Backed up ${posts.length} posts to ${path}`);
