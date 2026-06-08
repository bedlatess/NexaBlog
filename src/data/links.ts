export interface LinkItem {
  name: string;
  url: string;
  description: string;
}

export const friends: LinkItem[] = [
  {
    name: "Paul Graham",
    url: "https://paulgraham.com/",
    description: "Y Combinator 创始人，写独立思考、创业与写作，文章质量极高。"
  },
  {
    name: "Xe Iaso",
    url: "https://xeiaso.net/",
    description: "独立工程师，写系统编程、工具链和技术随想，风格独特。"
  },
  {
    name: "Brandur",
    url: "https://brandur.org/",
    description: "Stripe 工程师，写 API 设计、数据库和分布式系统，克制精准。"
  },
  {
    name: "Robin Rendle",
    url: "https://robinrendle.com/",
    description: "设计师兼工程师，写 CSS、排版与 Web 设计哲学。"
  },
  {
    name: "Jim Nielsen",
    url: "https://blog.jim-nielsen.com/",
    description: "写 Web 平台、设计系统和独立博客的价值，有自己的判断。"
  },
  {
    name: "Astro",
    url: "https://astro.build/",
    description: "本站使用的框架，静态优先，零 JS 默认输出。"
  }
];
