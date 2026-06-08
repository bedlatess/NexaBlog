import { getCollection, type CollectionEntry } from "astro:content";
import { tagSlug } from "./tags";

export type BlogPost = CollectionEntry<"blog">;

export function postSlug(post: BlogPost) {
  return post.id.replace(/\\/g, "/").split("/").pop()!.replace(/\.mdx?$/, "");
}

export function postUrl(post: BlogPost) {
  return `/articles/${postSlug(post)}/`;
}

export async function getPublishedPosts() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.sort(
    (a, b) => b.data.published.getTime() - a.data.published.getTime()
  );
}

export function getReadingTime(body: string) {
  const words = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]+>/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const cjk = (body.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const minutes = Math.max(1, Math.ceil((words + cjk / 2) / 220));
  return `${minutes} 分钟`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function getAllTags(posts: BlogPost[]) {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count, slug: tagSlug(label) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
