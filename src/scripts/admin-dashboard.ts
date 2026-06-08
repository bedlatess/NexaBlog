import { createBrowserSupabase, getSupabaseConfig, type AdminPost } from "@/lib/supabase-browser";

const root = document.querySelector<HTMLElement>("[data-admin-live]");
const sessionLabel = document.querySelector<HTMLElement>("[data-admin-session]");
const list = document.querySelector<HTMLElement>("[data-admin-live-posts]");
const message = document.querySelector<HTMLElement>("[data-admin-live-message]");
const logoutButton = document.querySelector<HTMLButtonElement>("[data-admin-logout]");
const exportJsonButton = document.querySelector<HTMLButtonElement>("[data-admin-export-json]");
const exportMarkdownButton = document.querySelector<HTMLButtonElement>("[data-admin-export-markdown]");
const importJsonButton = document.querySelector<HTMLButtonElement>("[data-admin-import-json]");
const importJsonInput = document.querySelector<HTMLInputElement>("[data-admin-import-file]");
const copyDiagnosticsButton = document.querySelector<HTMLButtonElement>("[data-admin-copy-diagnostics]");
const searchInput = document.querySelector<HTMLInputElement>("[data-admin-post-search]");
const tagSelect = document.querySelector<HTMLSelectElement>("[data-admin-post-tag]");
const sortSelect = document.querySelector<HTMLSelectElement>("[data-admin-post-sort]");
const statusButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-admin-post-status]"));
const liveCounts = {
  total: document.querySelector<HTMLElement>("[data-admin-live-count='total']"),
  published: document.querySelector<HTMLElement>("[data-admin-live-count='published']"),
  draft: document.querySelector<HTMLElement>("[data-admin-live-count='draft']"),
  latest: document.querySelector<HTMLElement>("[data-admin-live-count='latest']")
};
const healthItems = new Map(
  Array.from(document.querySelectorAll<HTMLElement>("[data-admin-health]"))
    .map((item) => [item.dataset.adminHealth ?? "", item])
);
const config = getSupabaseConfig();
const supabase = createBrowserSupabase();
let allPosts: AdminPost[] = [];
let activeStatus = "all";
let activeTag = "all";
let activeSort = "updated-desc";
let currentUserId: string | null = null;

function setExportReady(ready: boolean) {
  if (exportJsonButton) exportJsonButton.disabled = !ready;
  if (exportMarkdownButton) exportMarkdownButton.disabled = !ready;
}

function setImportReady(ready: boolean) {
  if (importJsonButton) importJsonButton.disabled = !ready;
}

function setHealth(key: string, state: "pending" | "ok" | "warning" | "error", detail: string) {
  const item = healthItems.get(key);
  if (!item) return;
  item.dataset.state = state;
  const value = item.querySelector("strong");
  if (value) value.textContent = detail;
}

function setMessage(text: string, tone: "muted" | "error" | "success" = "muted") {
  if (!message) return;
  message.textContent = text;
  message.dataset.tone = tone;
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char] ?? char);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "未发布";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getTime(value: string | null | undefined) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getBackupStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function downloadTextFile(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function yamlString(value: unknown) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function markdownFrontmatter(post: AdminPost) {
  return [
    "---",
    `id: "${yamlString(post.id)}"`,
    `slug: "${yamlString(post.slug)}"`,
    `title: "${yamlString(post.title)}"`,
    `description: "${yamlString(post.description)}"`,
    `published_at: ${post.published_at ? `"${yamlString(post.published_at)}"` : "null"}`,
    `updated_at: "${yamlString(post.updated_at)}"`,
    `created_at: "${yamlString(post.created_at)}"`,
    `draft: ${String(post.draft)}`,
    `featured: ${String(post.featured)}`,
    `tags: [${(post.tags ?? []).map((tag) => `"${yamlString(tag)}"`).join(", ")}]`,
    "---"
  ].join("\n");
}

function exportJsonBackup() {
  if (!allPosts.length) {
    setMessage("当前没有可导出的 Supabase 文章。", "error");
    return;
  }
  const payload = {
    exported_at: new Date().toISOString(),
    post_count: allPosts.length,
    posts: allPosts
  };
  downloadTextFile(
    `nexablog-posts-${getBackupStamp()}.json`,
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8"
  );
  setMessage(`已导出 ${allPosts.length} 篇文章 JSON 备份。`, "success");
}

function exportMarkdownBackup() {
  if (!allPosts.length) {
    setMessage("当前没有可导出的 Supabase 文章。", "error");
    return;
  }
  const content = allPosts
    .map((post) => [
      `<!-- nexablog-backup: ${post.slug} -->`,
      markdownFrontmatter(post),
      "",
      post.body || "",
      ""
    ].join("\n"))
    .join("\n\n");
  downloadTextFile(`nexablog-posts-${getBackupStamp()}.md`, content);
  setMessage(`已导出 ${allPosts.length} 篇文章 Markdown 备份。`, "success");
}

function getDiagnosticsText() {
  const publishedCount = allPosts.filter((post) => !post.draft).length;
  const draftCount = allPosts.length - publishedCount;
  const latest = allPosts[0];
  return [
    "NexaBlog diagnostics",
    `origin: ${window.location.origin}`,
    `path: ${window.location.pathname}`,
    `supabase_configured: ${String(config.configured)}`,
    `session_user: ${sessionLabel?.textContent ?? "unknown"}`,
    `posts_total: ${allPosts.length}`,
    `posts_published: ${publishedCount}`,
    `posts_draft: ${draftCount}`,
    `latest_post: ${latest ? `${latest.slug} (${latest.updated_at})` : "none"}`,
    `checked_at: ${new Date().toISOString()}`
  ].join("\n");
}

async function copyDiagnostics() {
  const text = getDiagnosticsText();
  try {
    await navigator.clipboard.writeText(text);
    setMessage("诊断信息已复制。", "success");
  } catch {
    setMessage(`无法自动复制诊断信息：${text}`, "error");
  }
}

function isBackupPost(value: unknown): value is Partial<AdminPost> & Pick<AdminPost, "slug" | "title" | "description" | "body"> {
  if (!value || typeof value !== "object") return false;
  const post = value as Record<string, unknown>;
  return typeof post.slug === "string"
    && typeof post.title === "string"
    && typeof post.description === "string"
    && typeof post.body === "string";
}

function normalizeBackupPost(post: Partial<AdminPost> & Pick<AdminPost, "slug" | "title" | "description" | "body">) {
  return {
    ...(post.id ? { id: post.id } : {}),
    slug: post.slug,
    title: post.title,
    description: post.description,
    body: post.body,
    tags: Array.isArray(post.tags) ? post.tags.filter((tag): tag is string => typeof tag === "string") : [],
    draft: Boolean(post.draft),
    featured: Boolean(post.featured),
    published_at: post.draft ? null : post.published_at ?? null,
    author_id: currentUserId
  };
}

async function readBackupFile(file: File) {
  const raw = await file.text();
  const parsed = JSON.parse(raw) as { posts?: unknown };
  if (!Array.isArray(parsed.posts)) {
    throw new Error("这不是 NexaBlog JSON 备份文件：缺少 posts 数组。");
  }
  const posts = parsed.posts.filter(isBackupPost);
  if (!posts.length) {
    throw new Error("备份文件里没有可导入的文章。");
  }
  if (posts.length !== parsed.posts.length) {
    throw new Error("备份文件包含格式不完整的文章，导入已取消。");
  }
  return posts;
}

async function refreshPosts() {
  if (!supabase) return;
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    setMessage(error.message, "error");
    setHealth("posts", "error", "读取失败");
    setHealth("backup", "warning", "无可导出");
    return;
  }

  allPosts = (posts ?? []) as AdminPost[];
  setHealth("posts", "ok", `${allPosts.length} 篇`);
  setExportReady(allPosts.length > 0);
  setHealth("backup", allPosts.length > 0 ? "ok" : "warning", allPosts.length > 0 ? "可导出" : "暂无文章");
  updateTagOptions();
  filterPosts();
}

async function importJsonBackup(file: File) {
  if (!supabase || !currentUserId) return;

  try {
    const backupPosts = await readBackupFile(file);
    const confirmed = window.confirm(`确认导入 ${backupPosts.length} 篇文章？同 id 的记录会被更新，同 slug 冲突时可能被 Supabase 拒绝。`);
    if (!confirmed) return;

    setImportReady(false);
    setMessage(`正在导入 ${backupPosts.length} 篇文章...`);
    const payload = backupPosts.map(normalizeBackupPost);
    const { error } = await supabase
      .from("posts")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      setMessage(`${error.message}${error.code ? ` (${error.code})` : ""}`, "error");
      return;
    }

    setMessage(`已导入 ${backupPosts.length} 篇文章。`, "success");
    await refreshPosts();
  } catch (error) {
    setMessage(error instanceof Error ? error.message : "导入失败，无法读取备份文件。", "error");
  } finally {
    setImportReady(true);
    if (importJsonInput) importJsonInput.value = "";
  }
}

function getNextSlug(baseSlug: string, takenSlugs: string[]) {
  const taken = new Set(takenSlugs);
  if (!taken.has(baseSlug)) return baseSlug;

  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${baseSlug}-${index}`;
    if (!taken.has(candidate)) return candidate;
  }

  return `${baseSlug}-${Date.now()}`;
}

async function getAvailableSlug(baseSlug: string) {
  if (!supabase) return baseSlug;

  const { data, error } = await supabase
    .from("posts")
    .select("slug")
    .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-%`);

  if (error) {
    setMessage(`检查 slug 是否重复失败：${error.message}`, "error");
    return baseSlug;
  }

  return getNextSlug(baseSlug, (data ?? []).map((post) => post.slug));
}

function getPostTags(post: AdminPost) {
  return Array.isArray(post.tags) ? post.tags.filter(Boolean) : [];
}

function getAllLiveTags() {
  return Array.from(new Set(allPosts.flatMap(getPostTags)))
    .sort((left, right) => left.localeCompare(right, "zh-CN"));
}

function updateTagOptions() {
  if (!tagSelect) return;
  const tags = getAllLiveTags();
  if (activeTag !== "all" && !tags.includes(activeTag)) activeTag = "all";
  tagSelect.innerHTML = [
    '<option value="all">全部标签</option>',
    ...tags.map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`)
  ].join("");
  tagSelect.value = activeTag;
  tagSelect.disabled = !tags.length;
}

function sortPosts(posts: AdminPost[]) {
  return [...posts].sort((left, right) => {
    if (activeSort === "published-desc") {
      return getTime(right.published_at) - getTime(left.published_at);
    }
    if (activeSort === "title-asc") {
      return left.title.localeCompare(right.title, "zh-CN");
    }
    if (activeSort === "draft-first") {
      if (left.draft !== right.draft) return left.draft ? -1 : 1;
      return getTime(right.updated_at) - getTime(left.updated_at);
    }
    return getTime(right.updated_at) - getTime(left.updated_at);
  });
}

function getPostUrl(post: AdminPost) {
  return `${window.location.origin}/articles/${encodeURIComponent(post.slug)}/`;
}

async function copyText(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    setMessage(successMessage, "success");
  } catch {
    setMessage(`无法自动复制：${text}`, "error");
  }
}

function renderPosts(posts: AdminPost[]) {
  if (!list) return;
  if (!posts.length) {
    list.innerHTML = `
      <div class="admin-row admin-empty-row">
        <span>
          <strong>${allPosts.length ? "没有匹配的文章" : "暂无 Supabase 文章"}</strong>
          <small>${allPosts.length ? "换个关键词或状态筛选试试。" : "可以先创建一篇草稿验证写入链路。"}</small>
        </span>
        ${allPosts.length ? "" : '<a class="tag" href="/admin/posts/new/">新建文章</a>'}
      </div>
    `;
    return;
  }

  list.innerHTML = posts.map((post) => `
    <div class="admin-row admin-post-row">
      <span>
        <strong>${escapeHtml(post.title)}</strong>
        <small>${escapeHtml(post.slug)} · 更新 ${formatDateTime(post.updated_at)}</small>
        <small>${escapeHtml(post.description)}</small>
        ${getPostTags(post).length ? `<span class="admin-post-tags">${getPostTags(post).map((tag) => `<em>${escapeHtml(tag)}</em>`).join("")}</span>` : ""}
      </span>
      <span class="admin-row-actions">
        <span class="status-pill ${post.draft ? "is-muted" : ""}">${post.draft ? "草稿" : "已发布"}</span>
        ${post.featured ? '<span class="status-pill">精选</span>' : ""}
        ${post.draft ? "" : `<a class="tag" href="/articles/${encodeURIComponent(post.slug)}/">前台</a>`}
        <button class="tag" type="button" data-admin-copy-slug="${escapeHtml(post.id)}">复制 slug</button>
        ${post.draft ? "" : `<button class="tag" type="button" data-admin-copy-url="${escapeHtml(post.id)}">复制链接</button>`}
        <button class="tag" type="button" data-admin-toggle-featured="${escapeHtml(post.id)}">${post.featured ? "取消精选" : "设为精选"}</button>
        <button class="tag" type="button" data-admin-toggle-publish="${escapeHtml(post.id)}">${post.draft ? "快速发布" : "转为草稿"}</button>
        <button class="tag" type="button" data-admin-duplicate-post="${escapeHtml(post.id)}">复制为草稿</button>
        <a class="tag" href="/admin/posts/edit/?id=${encodeURIComponent(post.id)}">编辑</a>
      </span>
    </div>
  `).join("");
}

function updateLiveCounts() {
  const publishedCount = allPosts.filter((post) => !post.draft).length;
  const draftCount = allPosts.length - publishedCount;
  const latestUpdatedAt = allPosts[0]?.updated_at ?? null;

  if (liveCounts.total) liveCounts.total.textContent = String(allPosts.length);
  if (liveCounts.published) liveCounts.published.textContent = String(publishedCount);
  if (liveCounts.draft) liveCounts.draft.textContent = String(draftCount);
  if (liveCounts.latest) liveCounts.latest.textContent = formatDateTime(latestUpdatedAt);
}

function filterPosts() {
  const query = searchInput?.value.trim().toLowerCase() ?? "";
  const filtered = sortPosts(allPosts.filter((post) => {
    const matchesStatus =
      activeStatus === "all"
      || (activeStatus === "draft" && post.draft)
      || (activeStatus === "published" && !post.draft);
    const matchesTag = activeTag === "all" || getPostTags(post).includes(activeTag);
    const haystack = [
      post.title,
      post.slug,
      post.description,
      post.body,
      ...getPostTags(post)
    ].join(" ").toLowerCase();
    return matchesStatus && matchesTag && (!query || haystack.includes(query));
  }));

  updateLiveCounts();
  renderPosts(filtered);
  const publishedCount = allPosts.filter((post) => !post.draft).length;
  const draftCount = allPosts.length - publishedCount;
  const tagText = activeTag === "all" ? "" : `，标签 ${activeTag}`;
  setMessage(`Supabase 文章：${filtered.length}/${allPosts.length} 篇匹配${tagText}，已发布 ${publishedCount} 篇，草稿 ${draftCount} 篇。`, "success");
}

function setActiveStatus(status: string) {
  activeStatus = status;
  statusButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.adminPostStatus === status));
  });
  filterPosts();
}

function replacePost(updated: AdminPost) {
  allPosts = allPosts.map((post) => post.id === updated.id ? updated : post);
  updateTagOptions();
  filterPosts();
}

async function updatePost(postId: string, patch: Partial<AdminPost>, trigger: HTMLButtonElement, pendingText: string, successText: (post: AdminPost) => string) {
  if (!supabase) return;
  const originalText = trigger.textContent ?? "";
  trigger.disabled = true;
  trigger.textContent = pendingText;

  const { data, error } = await supabase
    .from("posts")
    .update(patch)
    .eq("id", postId)
    .select("*")
    .single();

  if (error) {
    trigger.disabled = false;
    trigger.textContent = originalText;
    setMessage(error.message, "error");
    return;
  }

  const updated = data as AdminPost;
  replacePost(updated);
  setMessage(successText(updated), "success");
}

async function togglePublish(postId: string, trigger: HTMLButtonElement) {
  const source = allPosts.find((post) => post.id === postId);
  if (!source) {
    setMessage("没有找到要更新的文章，请刷新后台后重试。", "error");
    return;
  }

  const willPublish = source.draft;
  const confirmed = window.confirm(willPublish
    ? `确认发布《${source.title}》？发布后会触发重新构建，前台会在 Vercel 部署完成后显示。`
    : `确认把《${source.title}》转回草稿？前台会在重新构建后隐藏它。`);
  if (!confirmed) return;

  await updatePost(
    postId,
    willPublish
      ? { draft: false, published_at: source.published_at ?? new Date().toISOString() }
      : { draft: true, published_at: null },
    trigger,
    willPublish ? "发布中..." : "转草稿...",
    (post) => willPublish ? `已发布《${post.title}》。` : `已转为草稿：《${post.title}》。`
  );
}

async function toggleFeatured(postId: string, trigger: HTMLButtonElement) {
  const source = allPosts.find((post) => post.id === postId);
  if (!source) {
    setMessage("没有找到要更新的文章，请刷新后台后重试。", "error");
    return;
  }

  await updatePost(
    postId,
    { featured: !source.featured },
    trigger,
    source.featured ? "取消中..." : "设置中...",
    (post) => post.featured ? `已设为精选：《${post.title}》。` : `已取消精选：《${post.title}》。`
  );
}

async function duplicatePost(postId: string, trigger: HTMLButtonElement) {
  if (!supabase) return;
  const source = allPosts.find((post) => post.id === postId);
  if (!source) {
    setMessage("没有找到要复制的文章，请刷新后台后重试。", "error");
    return;
  }
  if (!currentUserId) {
    setMessage("登录会话已失效，请重新登录后再复制文章。", "error");
    return;
  }

  trigger.disabled = true;
  trigger.textContent = "复制中...";
  setMessage(`正在复制《${source.title}》为草稿...`);

  const slug = await getAvailableSlug(`${source.slug}-copy`);
  const payload = {
    slug,
    title: `${source.title} 副本`,
    description: source.description,
    body: source.body,
    tags: source.tags ?? [],
    draft: true,
    featured: false,
    published_at: null,
    author_id: currentUserId
  };

  const { data, error } = await supabase.from("posts").insert(payload).select("*").single();
  if (error) {
    trigger.disabled = false;
    trigger.textContent = "复制为草稿";
    setMessage(error.message, "error");
    return;
  }

  allPosts = [data as AdminPost, ...allPosts];
  updateTagOptions();
  setActiveStatus("draft");
  setMessage(`已复制为草稿：${data.title}。`, "success");
}

if (root) {
  setExportReady(false);
  setImportReady(false);
  if (!config.configured || !supabase) {
    setHealth("config", "error", "未配置");
    setHealth("session", "pending", "等待配置");
    setHealth("posts", "pending", "等待配置");
    setHealth("backup", "pending", "等待配置");
    setMessage("Supabase 尚未配置。填写 .env 后，这里会显示真实文章数据。", "error");
  } else {
    setHealth("config", "ok", "已配置");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setHealth("session", "error", "未登录");
      setHealth("posts", "pending", "需登录");
      setHealth("backup", "pending", "需登录");
      window.location.assign(`/admin/login/?next=${encodeURIComponent(window.location.pathname)}`);
    } else {
      currentUserId = data.session.user.id;
      setHealth("session", "ok", data.session.user.email ?? "已登录");
      setImportReady(true);
      if (sessionLabel) sessionLabel.textContent = data.session.user.email ?? "已登录";
      setMessage("正在读取 Supabase 文章...");
      await refreshPosts();
    }
  }
}

searchInput?.addEventListener("input", filterPosts);
tagSelect?.addEventListener("change", () => {
  activeTag = tagSelect.value || "all";
  filterPosts();
});
sortSelect?.addEventListener("change", () => {
  activeSort = sortSelect.value || "updated-desc";
  filterPosts();
});
statusButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveStatus(button.dataset.adminPostStatus ?? "all"));
});
exportJsonButton?.addEventListener("click", exportJsonBackup);
exportMarkdownButton?.addEventListener("click", exportMarkdownBackup);
copyDiagnosticsButton?.addEventListener("click", () => void copyDiagnostics());
importJsonButton?.addEventListener("click", () => importJsonInput?.click());
importJsonInput?.addEventListener("change", () => {
  const file = importJsonInput.files?.[0];
  if (!file) return;
  void importJsonBackup(file);
});

list?.addEventListener("click", (event) => {
  if (!(event.target instanceof HTMLElement)) return;

  const copySlugButton = event.target.closest<HTMLButtonElement>("[data-admin-copy-slug]");
  if (copySlugButton) {
    const post = allPosts.find((item) => item.id === copySlugButton.dataset.adminCopySlug);
    if (post) void copyText(post.slug, `已复制 slug：${post.slug}`);
    return;
  }

  const copyUrlButton = event.target.closest<HTMLButtonElement>("[data-admin-copy-url]");
  if (copyUrlButton) {
    const post = allPosts.find((item) => item.id === copyUrlButton.dataset.adminCopyUrl);
    if (post) void copyText(getPostUrl(post), `已复制前台链接：${post.slug}`);
    return;
  }

  const featuredButton = event.target.closest<HTMLButtonElement>("[data-admin-toggle-featured]");
  if (featuredButton) {
    void toggleFeatured(featuredButton.dataset.adminToggleFeatured ?? "", featuredButton);
    return;
  }

  const publishButton = event.target.closest<HTMLButtonElement>("[data-admin-toggle-publish]");
  if (publishButton) {
    void togglePublish(publishButton.dataset.adminTogglePublish ?? "", publishButton);
    return;
  }

  const duplicateButton = event.target.closest<HTMLButtonElement>("[data-admin-duplicate-post]");
  if (duplicateButton) {
    void duplicatePost(duplicateButton.dataset.adminDuplicatePost ?? "", duplicateButton);
  }
});

logoutButton?.addEventListener("click", async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  window.location.assign("/admin/login/");
});
