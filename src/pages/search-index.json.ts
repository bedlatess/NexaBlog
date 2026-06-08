import { getPublishedPosts, formatDate, getReadingTime, postUrl } from "@/lib/content";

export async function GET() {
  const posts = await getPublishedPosts();
  const index = posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    date: formatDate(post.data.published),
    readingTime: getReadingTime(post.body),
    tags: post.data.tags,
    url: postUrl(post),
    haystack: [
      post.data.title,
      post.data.description,
      post.data.tags.join(" "),
      post.body.slice(0, 1200)
    ]
      .join(" ")
      .toLowerCase()
  }));

  return new Response(JSON.stringify(index), {
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
