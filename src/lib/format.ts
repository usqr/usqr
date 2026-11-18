// Pure helpers. No Astro imports, so node --test can load this file.

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** 2027-01-05 → "5 Jan 2027" */
export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

/** 2027-01-05 → "2027-01-05" (for the datetime attribute) */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "2025-09" → "09.2025" */
export function formatMonth(month: string): string {
  const [year, mm] = month.split('-');
  return `${mm}.${year}`;
}

/** Joins the base path and a site path. withBase('/usqr/', '/blog/') → "/usqr/blog/" */
export function withBase(base: string, path: string): string {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/** "1 post", "2 posts" */
export function countLabel(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

type Dated = { start: string; end?: string };

/** Current roles first, then the newest end; ties go to the newest start. */
export function compareRoles(a: Dated, b: Dated): number {
  const endA = a.end ?? '9999-99';
  const endB = b.end ?? '9999-99';
  if (endA !== endB) return endB.localeCompare(endA);
  return b.start.localeCompare(a.start);
}
