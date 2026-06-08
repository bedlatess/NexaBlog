export const site = {
  name: "NexaBlog",
  title: "NexaBlog - 静态优先的个人写作系统",
  description:
    "一个轻量、精致、静态优先的个人博客系统。写作、阅读、搜索和长期归档都保持克制而可靠。",
  url: import.meta.env.PUBLIC_SITE_URL ?? "https://nexablog.example.com",
  author: "Nexa",
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
    { href: "https://github.com/", label: "GitHub" }
  ]
};
