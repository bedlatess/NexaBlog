---
title: 静态优先不是退回过去
description: NexaBlog 的第一原则是把公开阅读体验做成确定、快速、可长期维护的静态产品。
published: 2026-06-07
updated: 2026-06-07
tags: ["架构", "Astro", "静态优先"]
featured: true
cover:
  label: "Architecture"
  signal: "00. 静态核心"
  tone: "blue"
---

## 为什么先静态

个人博客最重要的不是后台有多少按钮，而是读者打开文章时能不能立刻进入内容。静态优先让页面可以被 CDN 直接分发，也让安全边界天然变小。

NexaBlog 的公开站点由 Markdown 内容集合生成。构建时完成文章列表、标签、RSS、搜索索引和 SEO 元数据，运行时只留下必要的增强脚本。

## 动态增强的边界

后台、评论、统计和打赏都很重要，但它们不应该支配阅读体验。V1 把这些能力设计为配置化入口：

- 评论区域预留 Giscus 容器。
- 搜索先使用静态 JSON 索引。
- 管理后台未来可以写入 Markdown 或同步到 Supabase。
- 统计和打赏通过配置打开，不影响首屏渲染。

## 一个小的实现片段

```ts
export async function getPublishedPosts() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.sort(
    (a, b) => b.data.published.getTime() - a.data.published.getTime()
  );
}
```

这个函数不迷人，但它说明了 V1 的取向：让数据流足够清楚，后续功能才不会拖着公开站点一起变复杂。

