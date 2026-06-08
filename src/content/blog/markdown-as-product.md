---
title: 把 Markdown 当成产品界面
description: 代码高亮、表格、标题目录和复制按钮共同决定了技术文章的阅读质量。
published: 2026-06-01
tags: ["Markdown", "写作", "工程"]
cover:
  label: "Writing"
  signal: "03. 作者体验"
  tone: "amber"
---

## 写作文件也是界面

如果发布一篇文章需要经过笨重流程，作者会越来越少写。V1 选择 Markdown 内容集合，是为了让写作这件事保持可见、可版本化、可迁移。

| 能力 | V1 做法 | 后续增强 |
| --- | --- | --- |
| 草稿 | frontmatter `draft` | 后台草稿箱 |
| 标签 | frontmatter `tags` | 标签管理 |
| 预览 | Astro dev server | 管理后台预览 |

## 技术文章需要细节

代码块要有高亮，也要能复制；标题要能跳转，也要能形成目录；发布日期和更新时间要同时存在，因为读者需要判断内容的新鲜度。

