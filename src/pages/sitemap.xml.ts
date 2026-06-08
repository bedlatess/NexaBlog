import { getAllTags, getPublishedPosts, postUrl } from "@/lib/content";
import { site } from "@/data/site";

function url(path: string) {
  return new URL(path, site.url).toString();
}

function formatW3C(date: Date) {
  return date.toISOString().split("T")[0];
}

export async function GET() {
  const posts = await getPublishedPosts();
  const tags = getAllTags(posts);
  const latestPost = posts[0];
  const lastmod = latestPost ? formatW3C(latestPost.data.updated ?? latestPost.data.published) : formatW3C(new Date());

  const staticPages = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/articles/", priority: "0.9", changefreq: "weekly" },
    { path: "/tags/", priority: "0.7", changefreq: "weekly" },
    { path: "/search/", priority: "0.6", changefreq: "monthly" },
    { path: "/about/", priority: "0.5", changefreq: "monthly" },
    { path: "/links/", priority: "0.4", changefreq: "monthly" }
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${url(page.path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
${posts
  .map(
    (post) => `  <url>
    <loc>${url(postUrl(post))}</loc>
    <lastmod>${formatW3C(post.data.updated ?? post.data.published)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("\n")}
${tags
  .map(
    (tag) => `  <url>
    <loc>${url(`/tags/${tag.slug}/`)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
