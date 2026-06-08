import { createBrowserSupabase, getSupabaseConfig, type AdminPost } from "@/lib/supabase-browser";

const form = document.querySelector<HTMLFormElement>("[data-admin-editor]");
const message = document.querySelector<HTMLElement>("[data-admin-editor-message]");
const debug = document.querySelector<HTMLElement>("[data-admin-editor-debug]");
const preview = document.querySelector<HTMLElement>("[data-admin-preview]");
const saveButton = document.querySelector<HTMLButtonElement>("[data-admin-save]");
const config = getSupabaseConfig();
const supabase = createBrowserSupabase();
const params = new URLSearchParams(window.location.search);
let postId = params.get("id");
let currentPost: AdminPost | null = null;
let sessionReady = false;
const editorVersion = "admin-editor-2026-06-07-2148";

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

function setSaving(saving: boolean) {
  if (!saveButton) return;
  saveButton.disabled = saving;
  saveButton.textContent = saving ? "保存中..." : postId ? "保存修改" : "创建草稿";
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

form?.addEventListener("input", updatePreview);
document.querySelectorAll<HTMLButtonElement>("[data-markdown-insert]").forEach((button) => {
  button.addEventListener("click", () => insertMarkdown(button.dataset.markdownInsert ?? ""));
});
saveButton?.addEventListener("click", () => {
  setMessage("已点击保存按钮，正在提交表单...");
  setDebug("保存按钮 click 已被主编辑模块捕获。");
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
      ? "草稿已保存，不会触发前台发布。"
      : `已发布，Vercel 会自动重新部署。部署 Ready 后可访问 ${getPublicPostUrl(slug)}`;
    const slugMessage = slug === requestedSlug ? "" : `Slug 已自动改为 ${slug}。`;
    setMessage(`${slugMessage}${publishMessage}`, "success");
    setDebug(`Supabase 写入成功，id=${data?.id ?? postId ?? "unknown"}。`);
    currentPost = data as AdminPost;
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
  window.location.assign("/admin/");
});
