import { getCollection, type CollectionEntry } from 'astro:content';
import { skills, type SkillId } from '../data/skills';
import { compareRoles } from './format';

export type Post = CollectionEntry<'blog'>;
export type Role = CollectionEntry<'roles'>;

/** Published posts, newest first. Drafts are never built. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getRoles(): Promise<Role[]> {
  const roles = await getCollection('roles');
  return roles.sort((a, b) => compareRoles(a.data, b.data));
}

export async function getEducation() {
  const items = await getCollection('education');
  return items.sort((a, b) => b.data.start - a.data.start);
}

export function postsFor(posts: Post[], skill: SkillId): Post[] {
  return posts.filter((p) => p.data.skills.includes(skill));
}

export function rolesFor(roles: Role[], skill: SkillId): Role[] {
  return roles.filter((r) => r.data.skills.includes(skill));
}

/** Skills that get a page: at least one post or one role (04-interaction-flow.md). */
export async function getSkillsWithPages() {
  const [posts, roles] = await Promise.all([getPosts(), getRoles()]);
  return skills
    .map((skill) => ({ skill, posts: postsFor(posts, skill.id), roles: rolesFor(roles, skill.id) }))
    .filter(({ posts, roles }) => posts.length > 0 || roles.length > 0);
}
