import { getAllTags, getPublishedPosts, postUrl } from "@/lib/content";
import { site } from "@/data/site";

function url(path: string) {
  return new URL(path, site.url).toString();
}

export async function GET() {
  const posts = await getPublishedPosts();
  const tags = getAllTags(posts);
  const staticPaths = ["/", "/articles/", "/tags/", "/search/", "/about/", "/links/"];
  const articlePaths = posts.map((post) => postUrl(post));
  const tagPaths = tags.map((tag) => `/tags/${tag.slug}/`);
  const paths = [...staticPaths, ...articlePaths, ...tagPaths];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (path) => `  <url>
    <loc>${url(path)}</loc>
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
