export function tagSlug(tag: string) {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

export function tagLabelFromSlug(slug: string, tags: string[]) {
  const decoded = decodeURIComponent(slug);
  return tags.find((tag) => tagSlug(tag) === decoded) ?? decoded;
}
