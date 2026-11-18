import { withBase } from './format';

/** Site path → URL with the base path. u('/blog/') → "/usqr/blog/" */
export const u = (path: string) => withBase(import.meta.env.BASE_URL, path);

export const skillUrl = (id: string) => u(`/skills/${id}/`);
export const postUrl = (id: string) => u(`/blog/${id}/`);
