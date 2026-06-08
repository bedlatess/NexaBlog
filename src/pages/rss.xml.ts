import rss from "@astrojs/rss";
import { site } from "@/data/site";
import { getPublishedPosts, postUrl } from "@/lib/content";

export async function GET() {
  const posts = await getPublishedPosts();
  return rss({
    title: site.title,
    description: site.description,
    site: site.url,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: `<language>zh-CN</language><atom:link href="${new URL("/rss.xml", site.url)}" rel="self" type="application/rss+xml"/>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.published,
      link: postUrl(post),
      categories: post.data.tags,
      content: post.body
    }))
  });
}
