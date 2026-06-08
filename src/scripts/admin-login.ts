import { createBrowserSupabase, getSupabaseConfig } from "@/lib/supabase-browser";

const form = document.querySelector<HTMLFormElement>("[data-admin-login-form]");
const emailInput = document.querySelector<HTMLInputElement>("[data-admin-email]");
const passwordInput = document.querySelector<HTMLInputElement>("[data-admin-password]");
const otpButton = document.querySelector<HTMLButtonElement>("[data-admin-magic-link]");
const message = document.querySelector<HTMLElement>("[data-admin-login-message]");
const config = getSupabaseConfig();
const supabase = createBrowserSupabase();

function setMessage(text: string, tone: "muted" | "error" | "success" = "muted") {
  if (!message) return;
  message.textContent = text;
  message.dataset.tone = tone;
}

function nextUrl() {
  return new URLSearchParams(window.location.search).get("next") ?? "/admin/";
}

if (!config.configured || !supabase) {
  setMessage("Supabase 尚未配置。请先填写 PUBLIC_SUPABASE_URL 和 PUBLIC_SUPABASE_ANON_KEY。", "error");
  form?.querySelectorAll("input, button").forEach((node) => {
    (node as HTMLInputElement | HTMLButtonElement).disabled = true;
  });
} else {
  const { data } = await supabase.auth.getSession();
  if (data.session) window.location.assign(nextUrl());

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput?.value.trim();
    const password = passwordInput?.value;
    if (!email || !password) {
      setMessage("请输入邮箱和密码。", "error");
      return;
    }

    setMessage("正在登录...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message, "error");
      return;
    }
    window.location.assign(nextUrl());
  });

  otpButton?.addEventListener("click", async () => {
    const email = emailInput?.value.trim();
    if (!email) {
      setMessage("请输入邮箱后再发送 magic link。", "error");
      return;
    }

    setMessage("正在发送 magic link...");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: new URL(nextUrl(), window.location.origin).toString()
      }
    });
    setMessage(error ? error.message : "Magic link 已发送，请检查邮箱。", error ? "error" : "success");
  });
}

