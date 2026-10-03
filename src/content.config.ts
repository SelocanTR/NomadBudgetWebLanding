// The blog: one folder per post and language, `src/content/blog/<lang>/<slug>/index.md`,
// its pictures beside it. The first folder is the language, the second the post's
// address; the same post in the
// other language shares its `translationKey` (see src/blog.ts, which refuses a published
// post without its pair).

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { TOPICS } from './i18n';

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '{en,tr}/*/index.md',
    // "en/some-post/index.md" → "en/some-post"
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        description: z.string().max(200),
        translationKey: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        topic: z.enum(TOPICS),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        // Money, fees and the like: a "for information only" note above the post.
        disclaimer: z.boolean().default(false),
        draft: z.boolean().default(false),
      })
      .refine((d) => !d.cover || !!d.coverAlt, { message: 'a cover needs coverAlt', path: ['coverAlt'] }),
});

export const collections = { blog };
