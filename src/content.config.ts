import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { skillIds } from './data/skills';

const skill = z.enum(skillIds);
// Month in the form YYYY-MM.
const month = z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM');

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    skills: z.array(skill).min(1),
    draft: z.boolean().default(false),
  }),
});

const roles = defineCollection({
  loader: file('./src/content/cv/roles.yaml'),
  schema: z.object({
    title: z.string(),
    org: z.string(),
    note: z.string().optional(),
    start: month,
    end: month.optional(),
    highlights: z.array(z.string()).max(4).default([]),
    skills: z.array(skill).default([]),
  }),
});

const education = defineCollection({
  loader: file('./src/content/cv/education.yaml'),
  schema: z.object({
    program: z.string(),
    school: z.string(),
    start: z.number().int(),
    end: z.number().int(),
  }),
});

export const collections = { blog, roles, education };
