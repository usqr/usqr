import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { fullName } from '../data/profile';
import { getSkill } from '../data/skills';
import { getPosts } from '../lib/content';
import { postUrl } from '../lib/url';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${fullName} — Blog`,
    description: 'Notes on frontend, UX, and design systems.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: postUrl(post.id),
      categories: post.data.skills.map((id) => getSkill(id).name),
    })),
  });
}
