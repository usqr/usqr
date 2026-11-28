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
    id: 'lato-var',
    title: 'LatoVar',
    year: 2026,
    description: 'Lato as a variable font: one file with every weight from 100 to 900, hinted in FontLab 9 and tested. This site uses it.',
    kind: ['Type', 'Variable font', 'Open source'],
  },
  {
    id: 'font-analysis',
    title: 'Font analysis app',
    year: 2026,
    description: 'A library for font files. It scans folders, measures each font, and finds fonts by x-height, contrast, weight, and width.',
    kind: ['Type', 'Tool', 'Web app'],
  },
  {
    id: 'vitraj',
    title: 'vitraj',
    year: 2026,
    description: 'A dual-pane file manager for macOS. It is my fork of fman, with file preview, a gallery view, and themes. Release 2.0.0 is out.',
    kind: ['Tool', 'Desktop app', 'Open source'],
  },
  {
    id: 'precog',
    title: 'Precog',
    year: 2026,
    description: 'IDE-style autocomplete for zsh, bash, and fish. My fork of the Amazon Q autocomplete, without AWS.',
    kind: ['Tool', 'CLI', 'Open source'],
  },
  {
    id: 'kindle-writer',
    title: 'Kindle writer',
    year: 2026,
    description: 'A Kindle as a typewriter: a Bluetooth keyboard, an Android phone as a relay, and a small Python server.',
    kind: ['Hardware hack', 'Android', 'Python'],
  },
];
