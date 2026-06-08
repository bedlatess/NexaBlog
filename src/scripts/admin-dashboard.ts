import { createBrowserSupabase, getSupabaseConfig, type AdminPost } from "@/lib/supabase-browser";

const root = document.querySelector<HTMLElement>("[data-admin-live]");
const sessionLabel = document.querySelector<HTMLElement>("[data-admin-session]");
const list = document.querySelector<HTMLElement>("[data-admin-live-posts]");
const message = document.querySelector<HTMLElement>("[data-admin-live-message]");
const logoutButton = document.querySelector<HTMLButtonElement>("[data-admin-logout]");
const config = getSupabaseConfig();
const supabase = createBrowserSupabase();

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

function renderPosts(posts: AdminPost[]) {
  if (!list) return;
  if (!posts.length) {
    list.innerHTML = '<div class="admin-row"><span><strong>暂无 Supabase 文章</strong><small>可以先创建一篇草稿验证写入链路。</small></span></div>';
    return;
  }

  list.innerHTML = posts.map((post) => `
    <a class="admin-row" href="/admin/posts/edit/?id=${encodeURIComponent(post.id)}">
      <span>
        <strong>${escapeHtml(post.title)}</strong>
        <small>${escapeHtml(post.slug)} · ${escapeHtml(post.description)}</small>
      </span>
      <span class="status-pill ${post.draft ? "is-muted" : ""}">${post.draft ? "草稿" : "已发布"}</span>
    </a>
  `).join("");
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
        renderPosts((posts ?? []) as AdminPost[]);
        setMessage("Supabase 文章读取成功。", "success");
      }
    }
  }
}

logoutButton?.addEventListener("click", async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  window.location.assign("/admin/login/");
});

