// unsquare brand data. Sources: usqr_brandbook_026a_240427a.pdf (palette, CMYK, logo rules)
// and the generated asset set 210502_generated (brandmark paths, moved to the origin).

/** Brandmark weights: ring (main), thick ring (fat), solid (full). Same outer shape, viewBox 0 0 120 120.5. */
export const marks = {
  main: 'M60.4,0C43.1,0 26,3.4 10,10C-3.4,43 -3.3,76.5 10,110.5C42.9,123.5 76.2,124.2 110,110.5C123.6,76 123.1,42.6 110,10C94.2,3.6 77.4,0.2 60.4,0ZM60.3,8.6C75,8.8 89.6,11.7 103.3,17.2C114.6,45.1 115.1,73.8 103.3,103.3C74,115.1 45.2,114.5 16.8,103.3C5.3,74.2 5.2,45.5 16.8,17.2C30.6,11.5 45.4,8.6 60.3,8.6Z',
  fat: 'M60.4,0C43.1,0 26,3.4 10,10C-3.4,43 -3.3,76.5 10,110.5C42.9,123.5 76.2,124.2 110,110.5C123.6,76 123.1,42.6 110,10C94.2,3.6 77.4,0.2 60.4,0ZM60.3,12.5C73.9,12.6 87.4,15.3 100,20.4C110.5,46.2 110.9,72.8 100,100.1C73,110.9 46.3,110.4 20,100.1C9.4,73.2 9.3,46.6 20,20.4C32.8,15.2 46.5,12.5 60.3,12.5Z',
  full: 'M60.4,0C43.1,0 26,3.4 10,10C-3.4,43 -3.3,76.5 10,110.5C42.9,123.5 76.2,124.2 110,110.5C123.6,76 123.1,42.6 110,10C94.2,3.6 77.4,0.2 60.4,0Z',
} as const;
export type MarkWeight = keyof typeof marks;
export const markViewBox = '0 0 120 120.5';

export interface Swatch {
  /** Token name without the prefix: --usqr-<id> in tokens.css. */
  id: string;
  hex: string;
  rgb: string;
  /** Print values from the brandbook. Derived web colors have none. */
  cmyk?: string;
  /** Color of the large swatch name (WCAG AA large text, 3 : 1 or more). */
  on: 'coal' | 'snow' | 'ink';
  use: string;
}

export const palette: { group: string; note: string; swatches: Swatch[] }[] = [
  {
    group: 'Main',
    note: 'Gold is the signature. Coal and snow carry the page.',
    swatches: [
      { id: 'gold', hex: '#ffa400', rgb: '255 164 0', cmyk: '0 42 100 0', on: 'coal', use: 'Logo, marks, rules. Not for text on snow (1.88).' },
      { id: 'coal', hex: '#403f4c', rgb: '64 63 76', cmyk: '71 68 50 40', on: 'snow', use: 'Text on light (9.74). Logo ground.' },
      { id: 'snow', hex: '#f8f8fb', rgb: '248 248 251', cmyk: '2 2 0 0', on: 'coal', use: 'Light background. Text in dark mode.' },
    ],
  },
  {
    group: 'Secondary',
    note: 'One secondary color in one view, at most. Never a large fill.',
    swatches: [
      { id: 'sky', hex: '#0197f6', rgb: '1 151 246', cmyk: '71 34 0 0', on: 'ink', use: 'Focus ring.' },
      { id: 'lava', hex: '#e84855', rgb: '232 72 85', cmyk: '2 87 63 0', on: 'snow', use: 'Errors, rare emphasis.' },
      { id: 'sun', hex: '#f9dc5c', rgb: '249 220 92', cmyk: '3 10 77 0', on: 'coal', use: 'Highlight behind text.' },
    ],
  },
  {
    group: 'Supplementary',
    note: 'A warm neutral for quiet surfaces.',
    swatches: [
      { id: 'gray', hex: '#ecebe6', rgb: '236 235 230', cmyk: '6 5 8 0', on: 'coal', use: 'Code blocks only.' },
    ],
  },
  {
    group: 'Web',
    note: 'Derived for the screen: text-safe versions (4.5 : 1 on snow) and a dark ground.',
    swatches: [
      { id: 'ink', hex: '#26252e', rgb: '38 37 46', on: 'snow', use: 'Dark-mode background.' },
      { id: 'gold-text', hex: '#9e6600', rgb: '158 102 0', on: 'snow', use: 'Gold as text on snow (4.55).' },
      { id: 'sky-text', hex: '#0176c0', rgb: '1 118 192', on: 'snow', use: 'Links on snow (4.55).' },
      { id: 'lava-text', hex: '#c8303e', rgb: '200 48 62', on: 'snow', use: 'Error text on snow (5.02).' },
    ],
  },
];

/** Logo color schemes from the brandbook (p3, p4): mark, "un", "square" on a ground. */
export const logoSchemes = [
  { id: 'gold-snow', label: 'Main on snow', ground: 'snow', mark: 'gold', un: 'coal', square: 'gold' },
  { id: 'gold-coal', label: 'Main on coal', ground: 'coal', mark: 'gold', un: 'snow', square: 'gold' },
  { id: 'coal-snow', label: 'Supplementary on snow', ground: 'snow', mark: 'coal', un: 'gold', square: 'coal' },
  { id: 'snow-coal', label: 'Supplementary on coal', ground: 'coal', mark: 'snow', un: 'gold', square: 'snow' },
] as const;
