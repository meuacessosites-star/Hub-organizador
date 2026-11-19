/**
 * Coleções de molduras temáticas. Cada modelo usa ornamentos vetoriais
 * autorais com traços e quantidades adequados para avatares pequenos.
 * Não modifica IDs de modelos existentes.
 */
export const THEME_FRAME_MODELS = [
  'royal-tiara', 'royal-fleur',
  'orbit-planets', 'constellation-clusters',
  'faceted-gems', 'pearl-necklace',
  'paw-prints', 'little-bees',
  'sea-stars', 'sea-bubbles',
  'confetti-bursts', 'party-bells',
  'crossed-ribbons', 'braided-bows',
  'tile-mosaic', 'checker-blocks',
  'lace-hearts', 'rosebuds',
  'smiley-faces', 'candy-swirls',
  'spaced-bars', 'single-diamonds',
  'circuit-nodes', 'pixel-squares'
] as const;

export type ThemeFrameModel = typeof THEME_FRAME_MODELS[number];

export const THEME_FRAME_LABELS: Record<ThemeFrameModel, string> = {
  'royal-tiara': 'Tiaras reais',
  'royal-fleur': 'Flor-de-lis',
  'orbit-planets': 'Planetas com anéis',
  'constellation-clusters': 'Constelações',
  'faceted-gems': 'Gemas facetadas',
  'pearl-necklace': 'Colar de pérolas',
  'paw-prints': 'Patinhas',
  'little-bees': 'Abelhinhas',
  'sea-stars': 'Estrelas-do-mar',
  'sea-bubbles': 'Bolhas do mar',
  'confetti-bursts': 'Confetes festivos',
  'party-bells': 'Sininhos',
  'crossed-ribbons': 'Fitas cruzadas',
  'braided-bows': 'Laços trançados',
  'tile-mosaic': 'Mosaico de azulejos',
  'checker-blocks': 'Peças de tabuleiro',
  'lace-hearts': 'Corações de renda',
  'rosebuds': 'Botões de rosa',
  'smiley-faces': 'Carinhas felizes',
  'candy-swirls': 'Balas espirais',
  'spaced-bars': 'Barras espaçadas',
  'single-diamonds': 'Losangos isolados',
  'circuit-nodes': 'Circuitos digitais',
  'pixel-squares': 'Quadrados pixelados'
};

const THEME_COUNTS: Record<ThemeFrameModel, number> = {
  'royal-tiara': 8, 'royal-fleur': 10,
  'orbit-planets': 9, 'constellation-clusters': 8,
  'faceted-gems': 10, 'pearl-necklace': 14,
  'paw-prints': 11, 'little-bees': 10,
  'sea-stars': 9, 'sea-bubbles': 12,
  'confetti-bursts': 10, 'party-bells': 10,
  'crossed-ribbons': 12, 'braided-bows': 9,
  'tile-mosaic': 12, 'checker-blocks': 12,
  'lace-hearts': 10, 'rosebuds': 10,
  'smiley-faces': 8, 'candy-swirls': 11,
  'spaced-bars': 8, 'single-diamonds': 6,
  'circuit-nodes': 10, 'pixel-squares': 12
};

export function themeFrameCount(model: string): number | null {
  return (THEME_COUNTS as Record<string, number>)[model] ?? null;
}

/** Os pequenos motivos são desenhados com geometria própria, sem fontes/ícones externos. */
export function themeFrameMotif(model: string, color: string, index: number): string | null {
  const filled = (d: string) => '<path d="' + d + '" fill="' + color + '"/>';
  const line = (d: string, width = 1.8) => '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + width + '" stroke-linejoin="round" stroke-linecap="round"/>';
  const dot = (x: number, y: number, r: number) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + color + '"/>';
  const star = 'M0 -4.8 L1.15 -1.4 L4.7 -1.4 L1.9 .8 L2.8 4.4 L0 2.3 L-2.8 4.4 L-1.9 .8 L-4.7 -1.4 L-1.15 -1.4Z';
  switch (model) {
    case 'royal-tiara':
      return filled('M-5 1.8 L-3.8 -3 L-1.8 -.9 L0 -4.8 L1.8 -.9 L3.8 -3 L5 1.8 L5 3.6 H-5Z') +
        dot(0, -1, .85);
    case 'royal-fleur':
      return filled('M0 -5 Q-3 -3 -1.8 -.9 Q-5 -3 -4.7 0 Q-4 2 -2 1 Q-2 3 0 4 Q2 3 2 1 Q4 2 4.7 0 Q5 -3 1.8 -.9 Q3 -3 0 -5Z') +
        line('M-3 3 H3',1);
    case 'orbit-planets':
      return '<circle r="2.45" fill="' + color + '"/>' +
        '<ellipse rx="5.3" ry="2.1" transform="rotate(-25)" stroke="' + color + '" stroke-width="1.7" fill="none"/>';
    case 'constellation-clusters':
      return line('M-4 1 L-1 -3.5 L3 -1.8 L4 3 L-4 1',1.1) +
        dot(-4,1,1.25) + dot(-1,-3.5,1.5) + dot(3,-1.8,1.1) + dot(4,3,1.45);
    case 'faceted-gems':
      return line('M-4.8 -1.9 L-2.2 -4.4 H2.2 L4.8 -1.9 L0 4.7Z M-4.8 -1.9 H4.8 M-2.2 -4.4 L-1.3 -1.9 L0 4.7 L1.3 -1.9 L2.2 -4.4',1.55);
    case 'pearl-necklace':
      return dot(-3.2,0,1.8) + dot(0,-1.5,2.5) + dot(3.2,0,1.8) + dot(0,3.15,1.15);
    case 'paw-prints':
      return filled('M-3 1 Q-2 -1 0 -.7 Q2 -1 3 1 Q4 4 1.5 4 Q0 3.1 -1.5 4 Q-4 4 -3 1Z') +
        dot(-3.8,-1.8,1.2) + dot(-1.25,-3.4,1.2) + dot(1.55,-3.4,1.2) + dot(3.9,-1.8,1.15);
    case 'little-bees':
      return '<ellipse cx="-1.8" cy="-2.5" rx="2.4" ry="1.7" transform="rotate(-25 -1.8 -2.5)" stroke="' + color + '" stroke-width="1.4" fill="none"/>' +
        '<ellipse cx="1.8" cy="-2.5" rx="2.4" ry="1.7" transform="rotate(25 1.8 -2.5)" stroke="' + color + '" stroke-width="1.4" fill="none"/>' +
        '<ellipse cy="1.1" rx="2.5" ry="3" fill="' + color + '"/>' + line('M-2 .1 H2 M-2 2 H2',.95);
    case 'sea-stars':
      return filled('M0 -5.2 L1.3 -1.6 L4.9 -1.8 L2.1 1 L3 4.8 L0 2.9 L-3 4.8 L-2.1 1 L-4.9 -1.8 L-1.3 -1.6Z') +
        dot(0,0,.8);
    case 'sea-bubbles':
      return '<circle cx="-2.4" cy="1.1" r="2.6" stroke="' + color + '" stroke-width="1.8" fill="none"/>' +
        '<circle cx="2.5" cy="-1.7" r="2.1" stroke="' + color + '" stroke-width="1.8" fill="none"/>' +
        dot(3.4,3.1,1);
    case 'confetti-bursts':
      return index % 2 === 0
        ? filled('M-4 -3 L-1 -4 L0 -1 L-3 0Z M1 1 L4 0 L5 3 L2 4Z') + line('M-2 3 L0 1 M2 -4 L4 -2',1.7)
        : filled('M-4 0 L-1 -3 L2 0 L-1 3Z') + dot(4,-3,1.4) + dot(4,3,1.25);
    case 'party-bells':
      return filled('M-3 1.7 V-1.2 Q-3 -3.8 0 -3.8 Q3 -3.8 3 -1.2 V1.7 L4.1 3 H-4.1Z') +
        dot(0,4,1.2) + dot(0,-4.7,.85);
    case 'crossed-ribbons':
      return line('M-4.2 -4.2 L4.2 4.2 M4.2 -4.2 L-4.2 4.2',2.6) +
        filled('M-4 -4 L-1 -3 L-3 -1Z M4 -4 L1 -3 L3 -1Z');
    case 'braided-bows':
      return line('M0 0 C-3 -5 -5 -4 -4 .2 C-5 4 -1.5 4 0 0 C1.5 4 5 4 4 .2 C5 -4 3 -5 0 0Z M-2 1 L-3 5 M2 1 L3 5',1.9) +
        dot(0,0,1.05);
    case 'tile-mosaic':
      return '<rect x="-4.5" y="-4.5" width="4" height="4" rx=".55" fill="' + color + '"/>' +
        '<rect x=".5" y="-4.5" width="4" height="4" rx=".55" fill="' + color + '" opacity=".6"/>' +
        '<rect x="-4.5" y=".5" width="4" height="4" rx=".55" fill="' + color + '" opacity=".6"/>' +
        '<rect x=".5" y=".5" width="4" height="4" rx=".55" fill="' + color + '"/>';
    case 'checker-blocks':
      return filled(index % 2 ? 'M-4 -4 H1 V1 H-4Z M1 1 H4 V4 H1Z' : 'M-4 1 H1 V4 H-4Z M1 -4 H4 V1 H1Z') +
        line('M-4 -4 H4 V4 H-4Z',1);
    case 'lace-hearts':
      return line('M0 4 Q-5 0 -4 -2 Q-3 -5 0 -2 Q3 -5 4 -2 Q5 0 0 4Z',1.8) +
        dot(-3,-1, .8) + dot(3,-1,.8) + dot(0,1,.8);
    case 'rosebuds':
      return filled('M0 3 Q-4 1 -3 -2 Q-2 -5 0 -3 Q2 -5 3 -2 Q4 1 0 3Z') +
        line('M-2 0 Q0 -2 2 0 Q0 2 -1 1 M0 3 V5',1.3);
    case 'smiley-faces':
      return '<circle r="4.5" fill="none" stroke="' + color + '" stroke-width="1.8"/>' +
        dot(-1.55,-1.2,.65) + dot(1.55,-1.2,.65) + line('M-2.3 1 Q0 3.6 2.3 1',1.55);
    case 'candy-swirls':
      return '<circle r="4.2" fill="none" stroke="' + color + '" stroke-width="1.7"/>' +
        line('M0 -2.8 C3 -3 3 1 0 1.8 C-2 2.5 -3 -.5 -1 -1.2 M-4 -3 L-5.5 -4.5 M4 3 L5.5 4.5',1.7);
    case 'spaced-bars':
      return line('M0 -5 V5',3.1);
    case 'single-diamonds':
      return filled('M0 -5 L4.3 0 L0 5 L-4.3 0Z');
    case 'circuit-nodes':
      return line('M-4 -3 H0 V0 H4 M0 0 V3 H-3',1.65) +
        dot(-4,-3,1.2) + dot(4,0,1.2) + dot(-3,3,1.25);
    case 'pixel-squares':
      return '<rect x="-4.3" y="-4.3" width="3.3" height="3.3" fill="' + color + '"/>' +
        '<rect x="1" y="-1" width="3.3" height="3.3" fill="' + color + '"/>' +
        '<rect x="-3.7" y="2.1" width="2.4" height="2.4" fill="' + color + '"/>';
    default:
      return null;
  }
}
