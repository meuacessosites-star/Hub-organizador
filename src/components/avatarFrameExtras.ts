/**
 * Modelos novos de molduras: silhuetas próprias para permanecerem distintas
 * mesmo quando o avatar é exibido pequeno (40–52px). Não alterar os IDs
 * anteriores: modelos salvos em contas antigas continuam compatíveis.
 */
export const EXTRA_FRAME_MODELS = [
  'long-petals', 'short-petals', 'bold-stars', 'star-clusters',
  'alternating-leaves', 'twin-leaves', 'paired-hearts', 'inverted-hearts',
  'wide-links', 'slender-links', 'pointed-drops', 'round-drops',
  'broad-scallops', 'bold-zigzags', 'diagonal-strokes', 'stroke-blocks',
  'separated-crosses', 'large-hollow-diamonds', 'bead-clusters',
  'alternating-grand-arches', 'four-corner-sparkles', 'long-sun-rays',
  'ribbon-bows', 'cherry-blossoms', 'butterflies', 'little-clouds',
  'mini-anchors', 'tiny-flames', 'hexagon-badges', 'mountain-peaks'
] as const;

export type ExtraFrameModel = typeof EXTRA_FRAME_MODELS[number];

export const EXTRA_FRAME_LABELS: Record<ExtraFrameModel, string> = {
  'long-petals': 'Pétalas longas',
  'short-petals': 'Pétalas curtinhas',
  'bold-stars': 'Estrelas marcantes',
  'star-clusters': 'Trio de estrelas',
  'alternating-leaves': 'Folhas alternadas',
  'twin-leaves': 'Folhas geminadas',
  'paired-hearts': 'Corações em dupla',
  'inverted-hearts': 'Corações invertidos',
  'wide-links': 'Elos largos',
  'slender-links': 'Elos entrelaçados',
  'pointed-drops': 'Gotas pontiagudas',
  'round-drops': 'Gotas arredondadas',
  'broad-scallops': 'Ondas largas',
  'bold-zigzags': 'Zigue-zague',
  'diagonal-strokes': 'Traços diagonais',
  'stroke-blocks': 'Tracinhos em blocos',
  'separated-crosses': 'Cruzes espaçadas',
  'large-hollow-diamonds': 'Losangos grandes',
  'bead-clusters': 'Miçangas agrupadas',
  'alternating-grand-arches': 'Arcos alternados grandes',
  'four-corner-sparkles': 'Quatro pontos de brilho',
  'long-sun-rays': 'Raios de sol longos',
  'ribbon-bows': 'Laços largos',
  'cherry-blossoms': 'Flores de cerejeira',
  'butterflies': 'Borboletinhas',
  'little-clouds': 'Nuvens fofinhas',
  'mini-anchors': 'Âncoras',
  'tiny-flames': 'Chaminhas',
  'hexagon-badges': 'Hexágonos',
  'mountain-peaks': 'Picos de montanha'
};

/** Menos elementos = intervalos nítidos e contornos perceptíveis em avatares pequenos. */
const EXTRA_FRAME_COUNTS: Record<ExtraFrameModel, number> = {
  'long-petals': 12, 'short-petals': 16,
  'bold-stars': 9, 'star-clusters': 10,
  'alternating-leaves': 14, 'twin-leaves': 10,
  'paired-hearts': 10, 'inverted-hearts': 12,
  'wide-links': 11, 'slender-links': 14,
  'pointed-drops': 12, 'round-drops': 16,
  'broad-scallops': 12, 'bold-zigzags': 10,
  'diagonal-strokes': 16, 'stroke-blocks': 12,
  'separated-crosses': 10, 'large-hollow-diamonds': 11,
  'bead-clusters': 14, 'alternating-grand-arches': 12,
  'four-corner-sparkles': 4, 'long-sun-rays': 12,
  'ribbon-bows': 10, 'cherry-blossoms': 11,
  'butterflies': 10, 'little-clouds': 10,
  'mini-anchors': 10, 'tiny-flames': 14,
  'hexagon-badges': 12, 'mountain-peaks': 11
};

export function extraFrameCount(model: string): number | null {
  return (EXTRA_FRAME_COUNTS as Record<string, number>)[model] ?? null;
}

/** Formas autorais em SVG, com contraste de espessura e espaçamento próprios. */
export function extraFrameMotif(model: string, color: string, index: number): string | null {
  const fill = (d: string) => '<path d="' + d + '" fill="' + color + '"/>';
  const path = (d: string, width = 2) => '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + width + '" stroke-linejoin="round" stroke-linecap="round"/>';
  const circle = (x: number, y: number, r: number) =>
    '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + color + '"/>';
  const heart = 'M0 3.5 C-6 0.2 -4.5 -3.7 -1.6 -2.2 C-0.6 -1.5 0 -0.5 0 -0.5 C1 -3.6 5 -3.9 4.6 -0.7 C4.5 0.9 2.3 2.8 0 3.5Z';
  const star = 'M0 -4.4 L1.3 -1.4 L4.6 -1 L2 1.3 L2.9 4.2 L0 2.4 L-2.9 4.2 L-2 1.3 L-4.6 -1 L-1.3 -1.4Z';

  switch (model) {
    case 'long-petals': return fill('M0 -5 Q4.5 -2.2 1.5 1.8 L0 4.1 L-1.5 1.8 Q-4.5 -2.2 0 -5Z');
    case 'short-petals': return fill('M0 -3.7 Q2.1 -3.1 1 0 L0 1 Q-1 -1.3 0 -3.7Z') +
      fill('M2.6 .3 Q4.2 2.6 0 3.6 Q-1 2 2.6 .3Z') + circle(-1.5, 1.5, 1.35);
    case 'bold-stars': return fill(star);
    case 'star-clusters': return '<g transform="translate(-3 -1.8) scale(.85)">' + fill(star) + '</g>' +
      '<g transform="translate(3 1.7) scale(.65)">' + fill(star) + '</g>' + circle(0, 4, .9);
    case 'alternating-leaves': return index % 2
      ? fill('M-3 2 Q-5 -3 2 -4 Q4 1 -3 2Z')
      : fill('M3 2 Q5 -3 -2 -4 Q-4 1 3 2Z');
    case 'twin-leaves': return fill('M-1 2 Q-6 1 -4 -3 Q-1 -4 -1 2Z') +
      fill('M1 2 Q6 1 4 -3 Q1 -4 1 2Z') + path('M0 4 V-2', 1);
    case 'paired-hearts': return '<g transform="translate(-2.8 -.4) scale(.57)">' + fill(heart) + '</g>' +
      '<g transform="translate(2.8 .4) scale(.57)">' + fill(heart) + '</g>';
    case 'inverted-hearts': return '<g transform="rotate(180) scale(1.05)">' + fill(heart) + '</g>';
    case 'wide-links': return path('M-4.9 -2.6 H1.3 A2.6 2.6 0 0 1 1.3 2.6 H-4.9 A2.6 2.6 0 0 1 -4.9 -2.6Z', 2.6);
    case 'slender-links': return '<ellipse cx="-1.9" cy="-1.2" rx="3.3" ry="2.1" transform="rotate(-33 -1.9 -1.2)" fill="none" stroke="' + color + '" stroke-width="1.6"/>' +
      '<ellipse cx="1.9" cy="1.2" rx="3.3" ry="2.1" transform="rotate(-33 1.9 1.2)" fill="none" stroke="' + color + '" stroke-width="1.6"/>';
    case 'pointed-drops': return fill('M0 -5.1 Q4.6 -.1 3 2.6 Q0 5 -3 2.6 Q-4.6 -.1 0 -5.1Z');
    case 'round-drops': return circle(0, .6, 3.15) + circle(-.9, -.4, .75);
    case 'broad-scallops': return path('M-5 2 Q-5 -4 0 -4 Q5 -4 5 2', 2.5);
    case 'bold-zigzags': return path('M-5 2.7 L-2.5 -3 L0 2.7 L2.5 -3 L5 2.7', 2.7);
    case 'diagonal-strokes': return path('M-3.8 3.8 L3.8 -3.8', 2.9);
    case 'stroke-blocks': return path('M-4 -2.7 H4 M-3 0 H3 M-4 2.7 H4', 2.05);
    case 'separated-crosses': return path('M0 -4.2 V4.2 M-4.2 0 H4.2', 2.6);
    case 'large-hollow-diamonds': return path('M0 -5 L4.8 0 L0 5 L-4.8 0Z', 1.9);
    case 'bead-clusters': return circle(-2.7, 1, 2.2) + circle(2.7, 1, 2.2) + circle(0, -2.9, 2.2);
    case 'alternating-grand-arches': return index % 2 ? path('M-5 -2.5 Q0 5 5 -2.5', 2.3) : path('M-5 2.5 Q0 -5 5 2.5', 2.3);
    case 'four-corner-sparkles': return fill('M0 -5.2 L1.4 -1.5 L5.2 0 L1.4 1.5 L0 5.2 L-1.4 1.5 L-5.2 0 L-1.4 -1.5Z');
    case 'long-sun-rays': return circle(0, 0, 2) + path('M0 -5 V-3.3 M0 3.3 V5 M-5 0 H-3.3 M3.3 0 H5 M-3.7 -3.7 L-2.5 -2.5 M3.7 3.7 L2.5 2.5 M3.7 -3.7 L2.5 -2.5 M-3.7 3.7 L-2.5 2.5', 1.7);
    case 'ribbon-bows': return path('M0 0 C-3 -5 -6 -3 -4 0 C-6 3 -2 5 0 0 C2 5 6 3 4 0 C6 -3 3 -5 0 0Z', 1.9) + circle(0, 0, 1.2);
    case 'cherry-blossoms': return Array.from({length:5}, (_,i) =>
      '<g transform="rotate(' + i * 72 + ')">' + fill('M0 0 Q-2.8 -2.4 0 -4.5 Q2.8 -2.4 0 0Z') + '</g>').join('') +
      '<circle r="1.2" fill="#FFFFFF"/>';
    case 'butterflies': return fill('M-.5 -1 Q-5 -6 -5 -1 Q-5 1 -.5 0Z M.5 -1 Q5 -6 5 -1 Q5 1 .5 0Z M-.5 .3 Q-4 2 -3 4 Q-1 5 -.5 1Z M.5 .3 Q4 2 3 4 Q1 5 .5 1Z') + path('M0 -2 V2', 1.3);
    case 'little-clouds': return path('M-4 2.4 A2.6 2.6 0 0 1 -3.2 -2.3 A3.4 3.4 0 0 1 3 -2.1 A2.6 2.6 0 0 1 4 2.4Z', 2.2);
    case 'mini-anchors': return path('M0 -4.6 V3 M-3.6 .4 Q-3.6 4.5 0 4.5 Q3.6 4.5 3.6 .4 M-2.2 -2.9 H2.2', 1.9) + circle(0, -4.6, .9);
    case 'tiny-flames': return fill('M0 -5 Q3 -2 2 .1 Q5 -1 4 2 Q3 5 0 5 Q-3 5 -4 2 Q-5 -1 -1 -3 Q-1 0 0 -5Z');
    case 'hexagon-badges': return path('M-2.8 -4.1 H2.8 L5 0 L2.8 4.1 H-2.8 L-5 0Z', 2);
    case 'mountain-peaks': return path('M-5 3 L-1 -4 L1 0 L2.9 -2.3 L5 3Z M-2 -1 L-1 -2.4 L0 .2', 2.05);
    default: return null;
  }
}
