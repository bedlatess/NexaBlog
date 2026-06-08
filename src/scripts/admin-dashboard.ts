import { createBrowserSupabase, getSupabaseConfig, type AdminPost } from "@/lib/supabase-browser";

const root = document.querySelector<HTMLElement>("[data-admin-live]");
const sessionLabel = document.querySelector<HTMLElement>("[data-admin-session]");
const list = document.querySelector<HTMLElement>("[data-admin-live-posts]");
const message = document.querySelector<HTMLElement>("[data-admin-live-message]");
const logoutButton = document.querySelector<HTMLButtonElement>("[data-admin-logout]");
const searchInput = document.querySelector<HTMLInputElement>("[data-admin-post-search]");
const statusButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-admin-post-status]"));
const config = getSupabaseConfig();
const supabase = createBrowserSupabase();
let allPosts: AdminPost[] = [];
let activeStatus = "all";

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
      </span>
      <span class="admin-row-actions">
        <span class="status-pill ${post.draft ? "is-muted" : ""}">${post.draft ? "草稿" : "已发布"}</span>
        ${post.draft ? "" : `<a class="tag" href="/articles/${encodeURIComponent(post.slug)}/">前台</a>`}
        <a class="tag" href="/admin/posts/edit/?id=${encodeURIComponent(post.id)}">编辑</a>
      </span>
    </div>
  `).join("");
}

function filterPosts() {
  const query = searchInput?.value.trim().toLowerCase() ?? "";
  const filtered = allPosts.filter((post) => {
    const matchesStatus =
      activeStatus === "all"
      || (activeStatus === "draft" && post.draft)
      || (activeStatus === "published" && !post.draft);
    const haystack = [
      post.title,
      post.slug,
      post.description,
      post.body,
      ...(post.tags ?? [])
    ].join(" ").toLowerCase();
    return matchesStatus && (!query || haystack.includes(query));
  });

  renderPosts(filtered);
  const publishedCount = allPosts.filter((post) => !post.draft).length;
  setMessage(`Supabase 文章：${filtered.length}/${allPosts.length} 篇匹配，已发布 ${publishedCount} 篇。`, "success");
}

function setActiveStatus(status: string) {
  activeStatus = status;
  statusButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.adminPostStatus === status));
  });
  filterPosts();
}

if (root) {
  if (!config.configured || !supabase) {
    setMessage("Supabase 尚未配置。填写 .env 后，这里会显示真实文章数据。", "error");
  } else {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      window.location.assign(`/admin/login/?next=${encodeURIComponent(window.location.pathname)}`);
    } else {
      if (sessionLabel) sessionLabel.textContent = data.session.user.email ?? "已登录";
      setMessage("正在读取 Supabase 文章...");
      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        setMessage(error.message, "error");
      } else {
        allPosts = (posts ?? []) as AdminPost[];
        filterPosts();
      }
    }
  }
}

searchInput?.addEventListener("input", filterPosts);
statusButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveStatus(button.dataset.adminPostStatus ?? "all"));
});

logoutButton?.addEventListener("click", async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  window.location.assign("/admin/login/");
});
