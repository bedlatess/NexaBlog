import { site } from "./site";

const isPlaceholderDomain = site.url.includes("nexablog.example.com");
const isLocalDomain = site.url.includes("localhost") || site.url.includes("127.0.0.1");

export const deployment = {
  siteUrl: site.url,
  buildCommand: "npm run build:with-supabase",
  isProductionUrlReady: !isPlaceholderDomain && !isLocalDomain,
  publishFlow: [
    "保存草稿不会触发前台发布",
    "取消草稿并保存会写入 published_at",
    "Supabase trigger 会调用 Vercel Deploy Hook",
    "Vercel 构建会先同步 Supabase，再生成静态页面"
  ],
  troubleshooting: [
    "确认文章不是草稿，并且 published_at 已写入",
    "打开 Vercel Deployments，确认最新部署状态为 Ready",
    "检查构建日志是否出现 Supabase 同步、图片路径或环境变量错误",
    "如果前台仍是旧内容，等待缓存刷新后强制刷新浏览器",
    "如果发布 Hook 泄露或失效，在 Vercel 重新生成 Deploy Hook 并更新 Supabase trigger"
  ],
  checks: [
    {
      label: "站点 URL",
      status: !isPlaceholderDomain && !isLocalDomain ? "已配置" : "待配置",
      detail: site.url
    },
    {
      label: "Vercel",
      status: "已准备",
      detail: "vercel.json 已声明 Supabase 同步构建、dist 输出和静态资源缓存"
    },
    {
      label: "自动发布",
      status: "已接入",
      detail: "发布文章后检查 Vercel Deployments，Ready 后前台可见"
    },
    {
      label: "生产检查",
      status: "已准备",
      detail: "运行 npm run check:production 可检查部署前配置"
    }
  ]
};
