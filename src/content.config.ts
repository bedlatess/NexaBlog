import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/blog",
    retainBody: true
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    cover: z
      .object({
        label: z.string(),
        signal: z.string(),
        tone: z.enum(["blue", "ink", "green", "amber"]).default("blue"),
        image: z.string().optional()
      })
      .optional()
  })
});

export const collections = { blog };
