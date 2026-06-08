export interface LinkItem {
  name: string;
  url: string;
  description: string;
  avatar?: string;
}

export const friends: LinkItem[] = [
  {
    name: "Astro",
    url: "https://astro.build/",
    description: "静态优先的内容站点框架。"
  },
  {
    name: "Supabase",
    url: "https://supabase.com/",
    description: "开源 Firebase 替代，提供数据库、认证和存储。"
  },
  {
    name: "Pagefind",
    url: "https://pagefind.app/",
    description: "高性能静态搜索引擎，可在大型站点中替代 JSON 索引。"
  }
];
