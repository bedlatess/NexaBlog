import { site } from "./site";

const isPlaceholderDomain = site.url.includes("nexablog.example.com");
const isLocalDomain = site.url.includes("localhost") || site.url.includes("127.0.0.1");

export const deployment = {
  siteUrl: site.url,
  isProductionUrlReady: !isPlaceholderDomain && !isLocalDomain,
  checks: [
    {
      label: "站点 URL",
      status: !isPlaceholderDomain && !isLocalDomain ? "已配置" : "待配置",
      detail: site.url
    },
    {
      label: "Vercel",
      status: "已准备",
      detail: "vercel.json 已声明 Astro 构建、dist 输出和静态资源缓存"
    },
    {
      label: "生产检查",
      status: "已准备",
      detail: "运行 npm run check:production 可检查部署前配置"
    }
  ]
};

