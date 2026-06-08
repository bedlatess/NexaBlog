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
