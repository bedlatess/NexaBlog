# NexaBlog

静态优先的开源个人博客系统。公开站完全静态构建（Astro），后台管理由 Supabase 支撑，评论、统计、打赏按需启用。

A static-first open-source blog system. The public site is fully static (Astro), admin is powered by Supabase, and comments/analytics/donations are opt-in.

**Demo**: [blog.pawn.eu.org](https://blog.pawn.eu.org)

---

## 特性 / Features

- 静态核心：Astro 构建，默认零 JS，CDN 分发
- Supabase 后台：写作、发布、图片上传、备份，全在浏览器内完成
- 自动重建：发布文章后触发 Vercel Deploy Hook
- 可选集成：Giscus 评论、Plausible 统计、多渠道打赏——不配置则不加载
- 亮暗主题：系统 / 浅色 / 深色三档，持久化
- 全文搜索：静态 JSON 索引，客户端过滤，无追踪

---

## 快速开始 / Quick Start

```bash
git clone https://github.com/bedlatess/NexaBlog.git
cd NexaBlog
cp .env.example .env
npm install
npm run dev
```

不配置任何环境变量也能运行——所有动态集成会显示"待配置"状态。

The site works with no environment variables. Dynamic integrations show a "pending" state until configured.

---

## 部署 / Deploy

1. 在 [vercel.com](https://vercel.com) 导入仓库
2. 填入环境变量（至少 `PUBLIC_SITE_URL`）
3. `vercel.json` 已预置 build command 和 output directory

```bash
PUBLIC_SITE_URL=https://your-domain.com
npm run check:production   # 本地验证
```

---

## 启用 Supabase 后台 / Enable Admin

1. 创建 Supabase 项目，在 SQL 编辑器里执行 `supabase/schema.sql`
2. 填入 `.env`：

```bash
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
PUBLIC_ADMIN_EMAIL=you@example.com
```

3. 在 Supabase Auth 里创建用户，拿到 user id 后执行：

```sql
insert into admin_users (user_id, email)
values ('your-user-id', 'you@example.com')
on conflict (user_id) do nothing;
```

4. 在 Supabase → Authentication → URL Configuration 里添加：
   - `http://localhost:4321/admin/login/`
   - `https://your-domain.com/admin/login/`

5. 打开 `/admin/login/` 登录

> anon key 是公开安全的。不要使用 service-role key。访问控制由 RLS 策略实现。

---

## 环境变量 / Environment Variables

完整列表见 `.env.example`。

| 变量 | 说明 |
|---|---|
| `PUBLIC_SITE_URL` | 生产域名，影响 SEO / RSS / Sitemap |
| `PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `PUBLIC_ADMIN_EMAIL` | 后台登录默认邮箱 |
| `PUBLIC_PLAUSIBLE_DOMAIN` | Plausible 域名（留空则不加载） |
| `PUBLIC_GISCUS_REPO` | Giscus 仓库（留空则不加载评论） |
| `PUBLIC_GISCUS_REPO_ID` | Giscus repo ID |
| `PUBLIC_GISCUS_CATEGORY` | Giscus discussion category |
| `PUBLIC_GISCUS_CATEGORY_ID` | Giscus category ID |
| `PUBLIC_DONATE_PAYPAL_URL` | PayPal 打赏链接（其他渠道同理） |

---

## 可选集成 / Optional Integrations

### Giscus 评论

在 GitHub 仓库开启 Discussions，前往 [giscus.app](https://giscus.app) 获取配置参数，填入上表 4 个必填变量。文章页会自动加载评论区。

### Plausible 统计

```bash
PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com
```

### 打赏

每个渠道填 label 或 URL 即显示，留空自动隐藏：

```bash
PUBLIC_DONATE_PAYPAL_LABEL=PayPal
PUBLIC_DONATE_PAYPAL_URL=https://paypal.me/example
```

支持：微信、支付宝、PayPal、爱发电、Crypto。

---

## 内容管理 / Content

手写文章放 `src/content/blog/`，frontmatter 示例：

```yaml
---
title: 文章标题
description: 一句话摘要
published: 2026-01-01
tags: ["设计", "工程"]
featured: true
cover:
  label: "Design"
  signal: "01. 克制"
  tone: "ink"   # blue | ink | green | amber | red
---
```

通过 Supabase 后台发布的文章同步到静态构建：

```bash
npm run sync:supabase        # 只同步
npm run build:with-supabase  # 同步 + 构建
```

---

## 自动重建 / Auto Rebuild

配置 Vercel Deploy Hook 后，在 Supabase SQL 编辑器执行 `supabase/deploy-hook-trigger.sql`，发布 / 下线文章时自动触发重建。详见 [docs/auto-publish.md](docs/auto-publish.md)。

---

## 项目结构 / Structure

```
src/
  content/blog/        手写 Markdown 文章
  pages/               路由（首页、文章、标签、搜索、RSS、Sitemap 等）
  pages/admin/         后台管理界面
  components/          Header、Footer、ArticleCard 等
  styles/global.css    Nexa Minimal 设计系统
  data/                站点配置、集成配置、友链
  lib/                 内容工具函数
public/scripts/        客户端 JS（主题、搜索、文章增强）
supabase/              数据库 schema 和部署触发 SQL
scripts/               构建脚本（sync、check、env loader）
docs/                  部署和集成文档
```

---

## 开发路线 / Roadmap

- [ ] 定时发布（Supabase Edge Function + cron）
- [ ] 数据库自动备份到 GitHub
- [ ] 多作者角色权限
- [ ] `npm create nexablog` 一键建站 CLI

---

## License

MIT
