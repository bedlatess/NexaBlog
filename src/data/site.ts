export const site = {
  name: "PAWN",
  title: "PAWN - 产品、设计与工程",
  description:
    "独立开发者 PAWN 的写作空间。写产品思维、设计系统和工程美学的交叉地带。",
  url: import.meta.env.PUBLIC_SITE_URL ?? "https://nexablog.example.com",
  author: "PAWN",
  locale: "zh-CN",
  nav: [
    { href: "/", label: "首页" },
    { href: "/articles/", label: "文章" },
    { href: "/tags/", label: "标签" },
    { href: "/links/", label: "友链" },
    { href: "/about/", label: "关于" },
    { href: "/admin/", label: "后台" }
  ],
  socials: [
    { href: "/rss.xml", label: "RSS" },
    { href: "https://t.me/bedlate", label: "Telegram" }
  ]
};
