# NexaBlog 项目概况

## 项目是什么

NexaBlog 是一个**静态优先的开源个人博客系统**，设计理念是"静态核心 + 动态增强"：

- 公开站点完全静态构建（Astro），默认零 JS，快速、可靠、SEO 友好
- 后台管理由 Supabase 支撑（数据库、Auth、文件存储），按需叠加
- 评论、统计、打赏作为可选集成，不配置则不加载
- 一键部署到 Vercel，支持自动同步 Supabase 文章触发重建

**演示站**：[blog.pawn.eu.org](https://blog.pawn.eu.org)  
**仓库**：[github.com/bedlatess/NexaBlog](https://github.com/bedlatess/NexaBlog)

---

## 已完成

### 公开站（静态）
- 首页：精选文章 + 最近文章 + 标签云 + RSS 订阅召唤区块
- 文章列表：按年份分组归档
- 文章详情：目录（scroll 跟踪）、阅读时间、上下篇导航、标签、阅读进度条
- 标签云 + 按标签筛选
- 全文搜索：静态 JSON 索引，客户端过滤，支持多词、键盘上下选择
- 关于页、友链页、404 页（含随机文章推荐）
- RSS feed、Sitemap、robots.txt、Open Graph、JSON-LD 结构化数据
- 亮色 / 暗色 / 跟随系统三档主题，持久化
- 代码块复制按钮、回到顶部按钮、移动端底部导航
- 全站响应式（桌面、平板、移动端）

### 后台管理（Supabase）
- 登录：邮箱密码 + Magic Link
- Dashboard：静态内容统计、集成健康检查、Supabase 文章列表
- 新建 / 编辑文章：Markdown 编辑器、实时预览、图片上传（Supabase Storage）
- 文章操作：发布、下线、复制草稿、删除
- 发布前检查（preflight）、本地自动保存草稿
- 文章过滤 / 搜索 / 排序
- JSON 导出备份 / 导入恢复、Markdown 导出
- 后台设置页

### 构建管道
- `npm run sync:supabase`：拉取 Supabase 已发布文章为本地 Markdown
- `npm run build:with-supabase`：sync + 静态构建
- Vercel Deploy Hook：Supabase SQL trigger，发布文章时自动触发重建
- `npm run check:production`：部署前环境变量检查

### 数据库（Supabase）
- `posts` 表：UUID、slug、标题、描述、正文、标签数组、草稿/精选标记、时间戳
- `settings` 表：JSONB 键值存储
- `admin_users` 表：管理员白名单
- 完整 RLS：公开只读已发布文章，管理员全权限
- `updated_at` 自动触发器

---

## 未配置 / 待完善

| 功能 | 状态 | 说明 |
|------|------|------|
| Giscus 评论 | 待配置 | 需要在 GitHub 仓库开启 Discussions，填入 4 个环境变量 |
| Plausible 统计 | 待配置 | 需要 Plausible 账号，填入 `PLAUSIBLE_DOMAIN` 环境变量 |
| 打赏（微信/支付宝/PayPal 等） | 待配置 | 在 `src/data/integrations.ts` 填入对应账号信息 |
| 数据库自动备份到 GitHub | 未开发 | 文档中规划但未实现 |
| `src/data/integrations.ts` | 需确认是否存在 | 集成配置文件，部署时需按实际填写 |
| 管理员首次入库 | 手动步骤 | 建表后需手动执行 SQL 插入第一个 admin_users 记录 |
| `PUBLIC_SITE_URL` 等环境变量 | 需确认 Vercel 已配置 | 影响 SEO 元数据、RSS、Sitemap 的绝对 URL |

---

## 后续开发方向

### 近期（体验打磨）
- **富文本工具栏**：Markdown 编辑器目前是纯文本，可加加粗/链接/代码等快捷按钮
- **文章封面图**：目前封面是纯 CSS 信号卡片，可支持真实图片封面
- **搜索升级**：用 Pagefind 替换当前手写 JSON 索引，支持全文内容检索（不只标题和描述）

### 中期（功能扩展）
- **多作者支持**：当前只有一个管理员角色，可扩展为 author 权限
- **草稿预览**：通过 Vercel Preview Deployment 或独立预览路由查看未发布文章
- **定时发布**：Supabase Edge Function + cron 实现 `published_at` 到期自动触发重建
- **数据库自动备份**：定时将 posts 表导出到 GitHub Gist 或仓库

### 长期（开源生态）
- **主题系统**：允许用户替换 `global.css` 设计 token，实现多主题
- **插件接口**：标准化 integrations.ts 配置结构，方便社区贡献新集成
- **CLI 初始化工具**：`npm create nexablog` 一键建站，交互式填写 site.ts 和 integrations.ts
- **文档站**：独立的部署文档、配置文档和二次开发指南
