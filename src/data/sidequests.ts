// Side projects and other experiments. One entry = one row on /sidequests/.
export interface Sidequest {
  /** URL segment: /sidequests/<id>/ */
  id: string;
  title: string;
  /** Year of the current version. */
  year: number;
  description: string;
  kind: string[];
}

export const sidequests: Sidequest[] = [
  {
    id: 'brandbook',
    title: 'unsquare brandbook',
    year: 2026,
    description: 'My personal brand: the logo, the brandmark, the colors, the type, and the patterns. This site uses each of them.',
    kind: ['Brand', 'Identity', 'Design system'],
  },
  {
    id: 'font-analysis',
    title: 'Font analysis app',
    year: 2026,
    description: 'A library for font files. It scans folders, measures each font, and finds fonts by x-height, contrast, weight, and width.',
    kind: ['Type', 'Tool', 'Web app'],
  },
];
