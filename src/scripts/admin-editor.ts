import { createBrowserSupabase, getSupabaseConfig, type AdminPost } from "@/lib/supabase-browser";

const form = document.querySelector<HTMLFormElement>("[data-admin-editor]");
const message = document.querySelector<HTMLElement>("[data-admin-editor-message]");
const debug = document.querySelector<HTMLElement>("[data-admin-editor-debug]");
const preview = document.querySelector<HTMLElement>("[data-admin-preview]");
const saveButton = document.querySelector<HTMLButtonElement>("[data-admin-save]");
const publishButton = document.querySelector<HTMLButtonElement>("[data-admin-publish]");
const unpublishButton = document.querySelector<HTMLButtonElement>("[data-admin-unpublish]");
const viewPostLink = document.querySelector<HTMLAnchorElement>("[data-admin-view-post]");
const copyLinkButton = document.querySelector<HTMLButtonElement>("[data-admin-copy-link]");
const localDraftPanel = document.querySelector<HTMLElement>("[data-admin-local-draft]");
const localDraftMessage = document.querySelector<HTMLElement>("[data-admin-local-draft-message]");
const restoreDraftButton = document.querySelector<HTMLButtonElement>("[data-admin-restore-draft]");
const discardDraftButton = document.querySelector<HTMLButtonElement>("[data-admin-discard-draft]");
const preflightPanel = document.querySelector<HTMLElement>("[data-admin-preflight]");
const preflightList = document.querySelector<HTMLElement>("[data-admin-preflight-list]");
const deployStatusPanel = document.querySelector<HTMLElement>("[data-admin-deploy-status]");
const deployStatusTitle = document.querySelector<HTMLElement>("[data-admin-deploy-title]");
const deployStatusDetail = document.querySelector<HTMLElement>("[data-admin-deploy-detail]");
const deployStatusLink = document.querySelector<HTMLAnchorElement>("[data-admin-deploy-view]");
const config = getSupabaseConfig();
const supabase = createBrowserSupabase();
const params = new URLSearchParams(window.location.search);
let postId = params.get("id");
let currentPost: AdminPost | null = null;
let sessionReady = false;
const editorVersion = "admin-editor-2026-06-07-2148";
const localDraftKey = `nexablog:admin-draft:${postId ?? "new"}`;

const fields = {
  slug: document.querySelector<HTMLInputElement>("[name='slug']"),
  title: document.querySelector<HTMLInputElement>("[name='title']"),
  description: document.querySelector<HTMLInputElement>("[name='description']"),
  tags: document.querySelector<HTMLInputElement>("[name='tags']"),
  body: document.querySelector<HTMLTextAreaElement>("[name='body']"),
  draft: document.querySelector<HTMLInputElement>("[name='draft']"),
  featured: document.querySelector<HTMLInputElement>("[name='featured']")
};

function setMessage(text: string, tone: "muted" | "error" | "success" = "muted") {
  if (!message) return;
  message.textContent = text;
  message.dataset.tone = tone;
}

function setDebug(text: string) {
  if (!debug) return;
  debug.textContent = `诊断：${text}`;
}

function getPublicPostUrl(slug: string) {
  return `/articles/${encodeURIComponent(slug)}/`;
}

function getAbsolutePostUrl(slug: string) {
  return new URL(getPublicPostUrl(slug), window.location.origin).toString();
}

function setSaving(saving: boolean) {
  if (saveButton) {
    saveButton.disabled = saving;
    saveButton.textContent = saving ? "保存中..." : postId ? "保存修改" : "创建草稿";
  }
  if (publishButton) {
    publishButton.disabled = saving;
    publishButton.textContent = saving ? "发布中..." : "发布文章";
  }
  if (unpublishButton) {
    unpublishButton.disabled = saving;
    unpublishButton.textContent = saving ? "下线中..." : "下线为草稿";
  }
}

function updatePublishedActions(post: AdminPost | null) {
  const isPublished = Boolean(post && !post.draft && post.published_at);
  if (viewPostLink) {
    viewPostLink.hidden = !isPublished;
    if (post) viewPostLink.href = getPublicPostUrl(post.slug);
  }
  if (copyLinkButton) {
    copyLinkButton.hidden = !isPublished;
    copyLinkButton.dataset.postUrl = post && isPublished ? getAbsolutePostUrl(post.slug) : "";
  }
  if (unpublishButton) {
    unpublishButton.hidden = !isPublished;
  }
}

function setDeployStatus(kind: "published" | "unpublished", slug: string) {
  if (!deployStatusPanel) return;

  const postPath = getPublicPostUrl(slug);
  deployStatusPanel.hidden = false;
  deployStatusPanel.dataset.status = kind;

  if (deployStatusTitle) {
    deployStatusTitle.textContent = kind === "published"
      ? "已写入 Supabase，等待 Vercel 构建"
      : "已改为草稿，等待前台移除";
  }
  if (deployStatusDetail) {
    deployStatusDetail.textContent = kind === "published"
      ? "通常 30 秒到 2 分钟后前台会更新。若打开仍是 404，稍等再刷新即可。"
      : "数据库已经下线这篇文章。前台会在下一次部署完成后不再展示它。";
  }
  if (deployStatusLink) {
    deployStatusLink.hidden = false;
    deployStatusLink.textContent = kind === "published" ? "打开前台" : "检查原前台地址";
    deployStatusLink.href = postPath;
  }
}

function clearDeployStatus() {
  if (deployStatusPanel) deployStatusPanel.hidden = true;
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

function generateDraftSlug() {
  const stamp = new Date()
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 14);
  return `draft-${stamp}`;
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
    setDebug(`检查 slug 是否重复失败：${error.message}`);
    return baseSlug;
  }

  return getNextSlug(baseSlug, (data ?? []).map((post) => post.slug));
}

function isDuplicateSlugError(error: { code?: string; message?: string }) {
  return error.code === "23505" || error.message?.includes("posts_slug_key");
}

function fieldValue(field: HTMLInputElement | HTMLTextAreaElement | null) {
  return field?.value ?? "";
}

function trimmedFieldValue(field: HTMLInputElement | HTMLTextAreaElement | null) {
  return fieldValue(field).trim();
}

function getFormSnapshot() {
  return {
    slug: fieldValue(fields.slug),
    title: fieldValue(fields.title),
    description: fieldValue(fields.description),
    tags: fieldValue(fields.tags),
    body: fieldValue(fields.body),
    draft: fields.draft?.checked ?? true,
    featured: fields.featured?.checked ?? false,
    savedAt: new Date().toISOString()
  };
}

function hasMeaningfulDraft(snapshot: ReturnType<typeof getFormSnapshot>) {
  return Boolean(
    snapshot.slug.trim()
    || snapshot.title.trim()
    || snapshot.description.trim()
    || snapshot.tags.trim()
    || snapshot.body.trim()
  );
}

function applySnapshot(snapshot: ReturnType<typeof getFormSnapshot>) {
  if (fields.slug) fields.slug.value = snapshot.slug;
  if (fields.title) fields.title.value = snapshot.title;
  if (fields.description) fields.description.value = snapshot.description;
  if (fields.tags) fields.tags.value = snapshot.tags;
  if (fields.body) fields.body.value = snapshot.body;
  if (fields.draft) fields.draft.checked = snapshot.draft;
  if (fields.featured) fields.featured.checked = snapshot.featured;
  updatePreview();
}

function readLocalDraft() {
  try {
    const raw = window.localStorage.getItem(localDraftKey);
    return raw ? JSON.parse(raw) as ReturnType<typeof getFormSnapshot> : null;
  } catch {
    return null;
  }
}

function writeLocalDraft() {
  try {
    const snapshot = getFormSnapshot();
    if (!hasMeaningfulDraft(snapshot)) {
      window.localStorage.removeItem(localDraftKey);
      return;
    }
    window.localStorage.setItem(localDraftKey, JSON.stringify(snapshot));
  } catch {
    setDebug("本地草稿保存失败，浏览器可能禁用了 localStorage。");
  }
}

function clearLocalDraft() {
  try {
    window.localStorage.removeItem(localDraftKey);
  } catch {
    // Ignore localStorage cleanup failures.
  }
  if (localDraftPanel) localDraftPanel.hidden = true;
}

function showLocalDraftPrompt() {
  const snapshot = readLocalDraft();
  if (!snapshot || !hasMeaningfulDraft(snapshot) || !localDraftPanel) return;

  const savedAt = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(snapshot.savedAt));
  if (localDraftMessage) localDraftMessage.textContent = `发现 ${savedAt} 保存的浏览器本地草稿。`;
  localDraftPanel.hidden = false;
}

function getPreflightChecks() {
  const slug = trimmedFieldValue(fields.slug);
  const title = trimmedFieldValue(fields.title);
  const description = trimmedFieldValue(fields.description);
  const body = fieldValue(fields.body).trim();
  const tags = fieldValue(fields.tags).split(",").map((tag) => tag.trim()).filter(Boolean);
  const imageRefs = Array.from(body.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)).map((match) => match[1]);
  const relativeImages = imageRefs.filter((src) => !/^(https?:\/\/|\/)/i.test(src));
  const placeholderImages = imageRefs.filter((src) => src.includes("example.com"));
  const placeholderLinks = Array.from(body.matchAll(/\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g))
    .map((match) => match[1])
    .filter((href) => href.includes("example.com"));

  return [
    {
      level: slug && /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) ? "ok" : "error",
      text: slug ? "Slug 格式可发布。" : "Slug 不能为空。"
    },
    {
      level: title ? "ok" : "error",
      text: title ? "标题已填写。" : "标题不能为空。"
    },
    {
      level: description ? "ok" : "error",
      text: description ? "摘要已填写。" : "摘要不能为空。"
    },
    {
      level: body.length >= 20 ? "ok" : "warning",
      text: body.length >= 20 ? "正文长度正常。" : "正文很短，建议发布前再补充内容。"
    },
    {
      level: tags.length ? "ok" : "warning",
      text: tags.length ? `已设置 ${tags.length} 个标签。` : "尚未设置标签。"
    },
    {
      level: relativeImages.length ? "error" : "ok",
      text: relativeImages.length ? "正文包含相对图片路径，请改成 https 图片地址或 /assets/ 路径。" : "没有会阻塞构建的相对图片路径。"
    },
    {
      level: placeholderImages.length || placeholderLinks.length ? "warning" : "ok",
      text: placeholderImages.length || placeholderLinks.length ? "正文仍包含 example.com 占位链接。" : "没有 example.com 占位链接。"
    }
  ];
}

function updatePreflight() {
  if (!preflightList || !preflightPanel) return;
  const checks = getPreflightChecks();
  preflightList.innerHTML = checks
    .map((check) => `<li data-level="${check.level}">${escapeHtml(check.text)}</li>`)
    .join("");
  preflightPanel.dataset.level = checks.some((check) => check.level === "error")
    ? "error"
    : checks.some((check) => check.level === "warning")
      ? "warning"
      : "ok";
}

function getBlockingPreflightErrors() {
  return getPreflightChecks().filter((check) => check.level === "error");
}

function getMarkdownSnippet(action: string, selection: string) {
  const selected = selection || "";
  const inline = selected.trim() || "文字";
  const block = selected.trim() || "正文";

  const snippets: Record<string, string> = {
    heading: `## ${inline}`,
    bold: `**${inline}**`,
    link: `[${inline}](https://example.com)`,
    quote: selected
      ? selected.split("\n").map((line) => `> ${line}`).join("\n")
      : `> ${block}`,
    list: selected
      ? selected.split("\n").map((line) => `- ${line || "列表项"}`).join("\n")
      : "- 列表项",
    code: selected.includes("\n")
      ? `\`\`\`\n${selected}\n\`\`\``
      : `\`${inline}\``,
    image: `![图片描述](https://example.com/image.jpg)`
  };

  return snippets[action] ?? selected;
}

function insertMarkdown(action: string) {
  const textarea = fields.body;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selection = value.slice(start, end);
  const snippet = getMarkdownSnippet(action, selection);
  const needsLeadingBreak = start > 0 && value[start - 1] !== "\n" && /^(## |>|- |```)/.test(snippet);
  const prefix = needsLeadingBreak ? "\n" : "";
  const nextValue = `${value.slice(0, start)}${prefix}${snippet}${value.slice(end)}`;
  const cursor = start + prefix.length + snippet.length;

  textarea.value = nextValue;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
  updatePreview();
  updatePreflight();
  writeLocalDraft();
  setDebug(`已插入 Markdown 片段：${action}。`);
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderMarkdownPreview(markdown: string) {
  const source = markdown.trim();
  if (!source) return "<p>从这里开始写 Markdown。</p>";

  const blocks: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let listLines: string[] = [];

  const flushList = () => {
    if (!listLines.length) return;
    blocks.push(`<ul>${listLines.map((line) => `<li>${renderInlineMarkdown(line)}</li>`).join("")}</ul>`);
    listLines = [];
  };

  const flushCode = () => {
    blocks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeLines = [];
  };

  for (const rawLine of source.split("\n")) {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      flushList();
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      blocks.push(`<h3>${renderInlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      blocks.push(`<h2>${renderInlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      blocks.push(`<h2>${renderInlineMarkdown(line.slice(2))}</h2>`);
      continue;
    }

    if (line.startsWith("> ")) {
      flushList();
      blocks.push(`<blockquote>${renderInlineMarkdown(line.slice(2))}</blockquote>`);
      continue;
    }

    if (line.startsWith("- ")) {
      listLines.push(line.slice(2));
      continue;
    }

    flushList();
    blocks.push(`<p>${renderInlineMarkdown(line)}</p>`);
  }

  flushList();
  if (inCodeBlock) flushCode();

  return blocks.join("");
}

function updatePreview() {
  if (!preview) return;
  preview.innerHTML = `
    <p class="eyebrow">Preview</p>
    <h2>${escapeHtml(fields.title?.value || "未命名文章")}</h2>
    <p>${escapeHtml(fields.description?.value || "暂无摘要")}</p>
    <div class="admin-preview-body">
      ${renderMarkdownPreview(fields.body?.value || "")}
    </div>
  `;
}

function fill(post: AdminPost) {
  currentPost = post;
  if (fields.slug) fields.slug.value = post.slug;
  if (fields.title) fields.title.value = post.title;
  if (fields.description) fields.description.value = post.description;
  if (fields.tags) fields.tags.value = post.tags.join(", ");
  if (fields.body) fields.body.value = post.body;
  if (fields.draft) fields.draft.checked = post.draft;
  if (fields.featured) fields.featured.checked = post.featured;
  updatePreview();
  updatePreflight();
  updatePublishedActions(post);
}

async function ensureSession({ redirect = true } = {}) {
  setDebug("正在读取浏览器登录会话。");
  if (!config.configured || !supabase) {
    setMessage("Supabase 尚未配置。请先填写环境变量。", "error");
    setDebug("Supabase 环境变量未注入到浏览器脚本。");
    form?.querySelectorAll("input, textarea, button").forEach((node) => {
      (node as HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement).disabled = true;
    });
    return false;
  }
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    setMessage("登录会话不存在，请重新登录。", "error");
    setDebug(`没有找到当前 origin 的登录会话：${window.location.origin}`);
    if (redirect) {
      window.location.assign(`/admin/login/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
    return false;
  }
  sessionReady = true;
  setMessage(`已登录：${data.session.user.email ?? "当前用户"}。可以保存文章。`, "success");
  setDebug(`会话有效，用户 ${data.session.user.email ?? data.session.user.id}。`);
  return true;
}

form?.addEventListener("input", () => {
  updatePreview();
  updatePreflight();
  writeLocalDraft();
  clearDeployStatus();
});
document.querySelectorAll<HTMLButtonElement>("[data-markdown-insert]").forEach((button) => {
  button.addEventListener("click", () => insertMarkdown(button.dataset.markdownInsert ?? ""));
});
restoreDraftButton?.addEventListener("click", () => {
  const snapshot = readLocalDraft();
  if (!snapshot) return;
  applySnapshot(snapshot);
  if (localDraftPanel) localDraftPanel.hidden = true;
  updatePreflight();
  setMessage("已恢复浏览器本地草稿，保存前不会写入 Supabase。", "success");
});
discardDraftButton?.addEventListener("click", () => {
  clearLocalDraft();
  setMessage("已丢弃浏览器本地草稿。", "success");
});
saveButton?.addEventListener("click", () => {
  setMessage("已点击保存按钮，正在提交表单...");
  setDebug("保存按钮 click 已被主编辑模块捕获。");
});
publishButton?.addEventListener("click", () => {
  if (fields.draft) fields.draft.checked = false;
  updatePreflight();
  setMessage("准备发布文章，正在提交表单...");
  setDebug("发布按钮 click 已触发，已自动取消草稿状态。");
  form?.requestSubmit();
});
copyLinkButton?.addEventListener("click", async () => {
  const url = copyLinkButton.dataset.postUrl;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    setMessage("前台链接已复制。", "success");
  } catch {
    setMessage(`无法自动复制，请手动复制：${url}`, "error");
  }
});
unpublishButton?.addEventListener("click", () => {
  if (fields.draft) fields.draft.checked = true;
  updatePreflight();
  setMessage("准备下线文章并保存为草稿...");
  setDebug("下线按钮 click 已触发，已自动勾选草稿状态。");
  form?.requestSubmit();
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("表单提交事件已触发。");
  setDebug("表单 submit 已被主编辑模块捕获。");
  if (!supabase) {
    setMessage("Supabase 客户端不可用，请检查环境变量。", "error");
    setDebug("Supabase 客户端创建失败。");
    return;
  }

  const isCreating = !postId;
  const requestedSlug = trimmedFieldValue(fields.slug) || (isCreating ? generateDraftSlug() : "");
  const title = trimmedFieldValue(fields.title) || (isCreating ? "未命名草稿" : "");
  const description = trimmedFieldValue(fields.description) || (isCreating ? "从后台创建的草稿。" : "");
  if (isCreating) {
    if (fields.slug && !trimmedFieldValue(fields.slug)) fields.slug.value = requestedSlug;
    if (fields.title && !trimmedFieldValue(fields.title)) fields.title.value = title;
    if (fields.description && !trimmedFieldValue(fields.description)) fields.description.value = description;
    updatePreview();
  }
  if (!requestedSlug || !title || !description) {
    setMessage("请填写 slug、标题和摘要。", "error");
    setDebug("表单校验未通过：slug、标题、摘要为必填。");
    return;
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(requestedSlug)) {
    setMessage("Slug 只能使用小写英文、数字和连字符，例如 first-live-post。", "error");
    setDebug(`表单校验未通过：slug "${requestedSlug}" 格式不合法。`);
    fields.slug?.focus();
    return;
  }

  try {
    setSaving(true);
    setMessage(sessionReady ? "正在准备保存..." : "正在检查登录会话...");
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      setMessage(sessionError.message, "error");
      setDebug(`读取会话失败：${sessionError.message}`);
      return;
    }
    const userId = sessionData.session?.user.id ?? null;
    if (!userId) {
      setMessage("登录会话已失效，请重新登录。", "error");
      setDebug("保存前检查发现会话已失效。");
      window.location.assign(`/admin/login/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    const isDraft = fields.draft?.checked ?? true;
    const wasPublishedBefore = Boolean(currentPost && !currentPost.draft && currentPost.published_at);
    const preflightErrors = getBlockingPreflightErrors();
    if (!isDraft && preflightErrors.length) {
      setMessage(`发布前检查未通过：${preflightErrors.map((item) => item.text).join("；")}`, "error");
      setDebug("发布被发布前检查拦截。草稿保存不受影响。");
      return;
    }
    const slug = isCreating ? await getAvailableSlug(requestedSlug) : requestedSlug;
    if (isCreating && slug !== requestedSlug) {
      if (fields.slug) fields.slug.value = slug;
      setDebug(`slug "${requestedSlug}" 已存在，自动改为 "${slug}"。`);
    }
    const payload = {
      slug,
      title,
      description,
      body: fieldValue(fields.body),
      tags: fieldValue(fields.tags).split(",").map((tag) => tag.trim()).filter(Boolean),
      draft: isDraft,
      featured: fields.featured?.checked ?? false,
      published_at: isDraft ? null : currentPost?.published_at ?? new Date().toISOString(),
      author_id: userId
    };

    setMessage("正在写入 Supabase...");
    setDebug(`准备写入 posts，slug=${slug}，draft=${String(isDraft)}。`);
    const query = postId
      ? supabase.from("posts").update(payload).eq("id", postId).select("*").single()
      : supabase.from("posts").insert(payload).select("*").single();
    const { data, error } = await query;

    if (error) {
      if (isDuplicateSlugError(error)) {
        setMessage("这个 Slug 已经被另一篇文章使用，请换一个，或让系统新建时自动追加编号。", "error");
      } else {
        setMessage(`${error.message}${error.code ? ` (${error.code})` : ""}`, "error");
      }
      setDebug(`Supabase 写入失败：${error.message}${error.code ? ` (${error.code})` : ""}`);
      return;
    }

    const publishMessage = isDraft
      ? "草稿已保存；如果此前已发布，Vercel 会自动重新部署并从前台移除。"
      : `已发布，Vercel 会自动重新部署。部署 Ready 后可访问 ${getPublicPostUrl(slug)}`;
    const slugMessage = slug === requestedSlug ? "" : `Slug 已自动改为 ${slug}。`;
    setMessage(`${slugMessage}${publishMessage}`, "success");
    setDebug(`Supabase 写入成功，id=${data?.id ?? postId ?? "unknown"}。`);
    clearLocalDraft();
    currentPost = data as AdminPost;
    updatePublishedActions(currentPost);
    if (!isDraft) {
      setDeployStatus("published", slug);
    } else if (wasPublishedBefore) {
      setDeployStatus("unpublished", slug);
    } else {
      clearDeployStatus();
    }
    if (!postId && data?.id) {
      postId = data.id;
      window.history.replaceState({}, "", `/admin/posts/edit/?id=${encodeURIComponent(data.id)}`);
      setSaving(false);
    }
  } catch (error) {
    setMessage(error instanceof Error ? error.message : "保存失败，浏览器脚本发生未知错误。", "error");
    setDebug(error instanceof Error ? `浏览器异常：${error.message}` : "浏览器发生未知异常。");
  } finally {
    setSaving(false);
  }
});

async function initEditor() {
  setDebug(`${editorVersion} 已加载。origin=${window.location.origin}`);
  setMessage("编辑器脚本已加载，正在检查 Supabase 会话...");
  updatePreview();
  updatePreflight();

  if (!(await ensureSession())) return;

  if (postId) {
    setMessage("正在读取文章...");
    const { data, error } = await supabase!
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();
    if (error) setMessage(error.message, "error");
    else {
      fill(data as AdminPost);
      setMessage("文章已载入。", "success");
    }
  }
  showLocalDraftPrompt();
}

void initEditor();

document.querySelector<HTMLButtonElement>("[data-admin-delete]")?.addEventListener("click", async () => {
  if (!supabase || !postId) return;
  const title = fields.title?.value || "这篇文章";
  if (!window.confirm(`确认删除「${title}」？这个操作会删除 Supabase 记录。`)) return;

  setMessage("正在删除...");
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) {
    setMessage(error.message, "error");
    return;
  }
  clearLocalDraft();
  window.location.assign("/admin/");
});
