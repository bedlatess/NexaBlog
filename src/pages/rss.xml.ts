import rss from "@astrojs/rss";
import { site } from "@/data/site";
import { getPublishedPosts, postUrl } from "@/lib/content";

export async function GET() {
  const posts = await getPublishedPosts();
  return rss({
    title: site.title,
    description: site.description,
    site: site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.published,
      link: postUrl(post)
    }))
  });
}
