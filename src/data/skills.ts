// Skill list = the schema enum (design/layers/05-surface.md).
// A post or role with a skill that is not here fails the build.

export const areas = [
  { id: 'frontend', name: 'Frontend', statement: 'Semantic HTML, modern CSS, and TypeScript that stay simple to change.' },
  { id: 'ux', name: 'UX', statement: 'Interfaces that start from user needs and a clear content order.' },
  { id: 'ds', name: 'Design systems', statement: 'Tokens, components, and migrations that ship in small steps.' },
] as const;

export type AreaId = (typeof areas)[number]['id'];

export const skills = [
  { id: 'html', name: 'HTML', area: 'frontend' },
  { id: 'css', name: 'CSS', area: 'frontend' },
  { id: 'typescript', name: 'TypeScript', area: 'frontend' },
  { id: 'playwright', name: 'Playwright', area: 'frontend' },
  { id: 'testing', name: 'Testing', area: 'frontend' },
  { id: 'ai', name: 'AI', area: 'frontend' },
  { id: 'claude-code', name: 'Claude Code', area: 'frontend' },
  { id: 'aem', name: 'AEM', area: 'frontend' },
  { id: 'pim-core', name: 'PIM Core', area: 'frontend' },
  { id: 'ux-research', name: 'UX research', area: 'ux' },
  { id: 'ui-design', name: 'UI design', area: 'ux' },
  { id: 'typography', name: 'Typography', area: 'ux' },
  { id: 'process', name: 'Process', area: 'ux' },
  { id: 'design-tokens', name: 'Design tokens', area: 'ds' },
  { id: 'code-review', name: 'Code review', area: 'ds' },
  { id: 'mentoring', name: 'Mentoring', area: 'ds' },
] as const satisfies readonly { id: string; name: string; area: AreaId }[];

export type SkillId = (typeof skills)[number]['id'];

export const skillIds = skills.map((s) => s.id) as [SkillId, ...SkillId[]];

export function getSkill(id: SkillId) {
  const skill = skills.find((s) => s.id === id);
  if (!skill) throw new Error(`Unknown skill: ${id}`);
  return skill;
}

export function getArea(id: AreaId) {
  const area = areas.find((a) => a.id === id);
  if (!area) throw new Error(`Unknown area: ${id}`);
  return area;
}
