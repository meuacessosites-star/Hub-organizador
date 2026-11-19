/**
 * Complemento de 48 motivos originais: quatro desenhos novos por categoria
 * temática, sem modificar nenhum modelo já salvo em perfis antigos.
 * Cada motivo tem geometria e espaçamento próprios para o avatar pequeno.
 */
export const MORE_THEME_FRAME_MODELS = [
  'royal-scepters', 'royal-shields', 'royal-crests', 'royal-jewels',
  'shooting-meteors', 'crescent-companions', 'galaxy-spirals', 'solar-halos',
  'emerald-cuts', 'hanging-pendants', 'ruby-hearts', 'crystal-clusters',
  'cat-faces', 'bunny-ears', 'bird-wings', 'tiny-foxes',
  'shell-fans', 'little-fish', 'wave-crests', 'coral-branches',
  'party-balloons', 'party-hats', 'star-garlands', 'firework-bursts',
  'twin-bows', 'ribbon-tails', 'heart-bows', 'knotted-ribbons',
  'chevron-tiles', 'honeycomb-hexes', 'circular-tiles', 'triangle-mosaic',
  'rose-sprays', 'cupid-arrows', 'rose-vines', 'love-letters',
  'tiny-cupcakes', 'lollipops', 'smile-clouds', 'lucky-clovers',
  'cardinal-arcs', 'wide-spaced-dashes', 'single-dot-pairs', 'square-brackets',
  'microchips', 'binary-blocks', 'wifi-arcs', 'gear-teeth'
] as const;
export type MoreThemeFrameModel = typeof MORE_THEME_FRAME_MODELS[number];

export const MORE_THEME_FRAME_LABELS: Record<MoreThemeFrameModel, string> = {
  'royal-scepters': 'Cetros reais', 'royal-shields': 'Escudos reais',
  'royal-crests': 'Brasões', 'royal-jewels': 'Pedras da coroa',
  'shooting-meteors': 'Estrelas cadentes', 'crescent-companions': 'Luas e estrelas',
  'galaxy-spirals': 'Galáxias', 'solar-halos': 'Halos solares',
  'emerald-cuts': 'Esmeraldas', 'hanging-pendants': 'Pingentes',
  'ruby-hearts': 'Rubis de coração', 'crystal-clusters': 'Cristais agrupados',
  'cat-faces': 'Rostinhos de gato', 'bunny-ears': 'Orelhinhas de coelho',
  'bird-wings': 'Asas delicadas', 'tiny-foxes': 'Raposinhas',
  'shell-fans': 'Conchas em leque', 'little-fish': 'Peixinhos',
  'wave-crests': 'Cristas do mar', 'coral-branches': 'Ramos de coral',
  'party-balloons': 'Balões de festa', 'party-hats': 'Chapéus de festa',
  'star-garlands': 'Guirlandas', 'firework-bursts': 'Fogos festivos',
  'twin-bows': 'Laços duplos', 'ribbon-tails': 'Fitas penduradas',
  'heart-bows': 'Laços de coração', 'knotted-ribbons': 'Nós de fita',
  'chevron-tiles': 'Azulejos em V', 'honeycomb-hexes': 'Colmeias',
  'circular-tiles': 'Mosaico circular', 'triangle-mosaic': 'Mosaico triangular',
  'rose-sprays': 'Ramalhetes de rosas', 'cupid-arrows': 'Flechas do amor',
  'rose-vines': 'Rosas e ramos', 'love-letters': 'Cartinhas de amor',
  'tiny-cupcakes': 'Bolinhos', 'lollipops': 'Pirulitos',
  'smile-clouds': 'Nuvens sorridentes', 'lucky-clovers': 'Trevos da sorte',
  'cardinal-arcs': 'Arcos cardeais', 'wide-spaced-dashes': 'Barras largas',
  'single-dot-pairs': 'Pontos espaçados', 'square-brackets': 'Cantoneiras',
  'microchips': 'Microchips', 'binary-blocks': 'Blocos binários',
  'wifi-arcs': 'Arcos de sinal', 'gear-teeth': 'Engrenagens'
};

const COUNTS: Record<MoreThemeFrameModel, number> = {
  'royal-scepters': 10, 'royal-shields': 9, 'royal-crests': 8, 'royal-jewels': 12,
  'shooting-meteors': 10, 'crescent-companions': 10, 'galaxy-spirals': 9, 'solar-halos': 8,
  'emerald-cuts': 12, 'hanging-pendants': 10, 'ruby-hearts': 11, 'crystal-clusters': 9,
  'cat-faces': 9, 'bunny-ears': 11, 'bird-wings': 10, 'tiny-foxes': 9,
  'shell-fans': 10, 'little-fish': 10, 'wave-crests': 12, 'coral-branches': 10,
  'party-balloons': 9, 'party-hats': 10, 'star-garlands': 8, 'firework-bursts': 9,
  'twin-bows': 10, 'ribbon-tails': 10, 'heart-bows': 10, 'knotted-ribbons': 10,
  'chevron-tiles': 12, 'honeycomb-hexes': 10, 'circular-tiles': 12, 'triangle-mosaic': 12,
  'rose-sprays': 10, 'cupid-arrows': 10, 'rose-vines': 12, 'love-letters': 9,
  'tiny-cupcakes': 10, 'lollipops': 10, 'smile-clouds': 9, 'lucky-clovers': 11,
  'cardinal-arcs': 4, 'wide-spaced-dashes': 8, 'single-dot-pairs': 8, 'square-brackets': 4,
  'microchips': 10, 'binary-blocks': 12, 'wifi-arcs': 10, 'gear-teeth': 10
};
export function moreThemeFrameCount(model: string): number | null {
  return (COUNTS as Record<string,number>)[model] ?? null;
}

/** Símbolos vetoriais distintos. Seus desenhos não são apenas pontos com cores diferentes. */
export function moreThemeFrameMotif(model: string, c: string, index: number): string | null {
  const f = (d: string) => '<path d="' + d + '" fill="' + c + '"/>';
  const p = (d: string, sw = 1.85) => '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"/>';
  const dot = (x: number, y: number, r: number) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '"/>';
  const circle = (x: number,y:number,r:number,sw=1.75) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="none" stroke="' + c + '" stroke-width="' + sw + '"/>';
  const r = (x:number,y:number,w:number,h:number) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '" rx=".5"/>';
  const star = 'M0 -4.8 L1.2 -1.5 L4.4 -1.3 L1.9 .9 L2.7 4 L0 2.2 L-2.7 4 L-1.9 .9 L-4.4 -1.3 L-1.2 -1.5Z';
  switch(model) {
    // REALEZA — cetro, escudo, brasão e joia são formas bem diferentes.
    case 'royal-scepters': return p('M0 -3.5 V4.6 M-2 4.6 H2',2.1) + f('M0 -5 L1.6 -3.5 L0 -2 L-1.6 -3.5Z');
    case 'royal-shields': return p('M-4 -4 H4 V.8 Q3.5 3.7 0 5 Q-3.5 3.7 -4 .8Z M-2 -1 H2 M0 -3 V3',1.8);
    case 'royal-crests': return f('M-4 3.6 L-4 -.5 L-2 -3 L0 -1 L2 -4 L4 -1 V3.6Z') + dot(0,1.6,1);
    case 'royal-jewels': return f('M0 -5 L3.6 -2 L2.7 2.7 L0 5 L-2.7 2.7 L-3.6 -2Z') + p('M-3.3 -2 H3.3 M0 -4.2 L0 4.2',.9);
    // CELESTIAIS
    case 'shooting-meteors': return f(star) + p('M-4 3 L-6 5 M-3 4 L-4 5',1.8);
    case 'crescent-companions': return f('M1 -4.6 A4 4 0 1 0 4 2 A3.1 3.1 0 0 1 1 -4.6Z') + dot(3.8,-3.3,1.3);
    case 'galaxy-spirals': return p('M0 0 C5 -4 5 3 1 4 C-5 5 -5 -3 -1 -4 C1 -4 2 -1 0 0',1.75) + dot(-3,-3,1);
    case 'solar-halos': return circle(0,0,2.7,2.1) + p('M0 -5 V-3.5 M0 3.5 V5 M-5 0 H-3.5 M3.5 0 H5',2.3);
    // JOIAS
    case 'emerald-cuts': return p('M-2.8 -4.7 H2.8 L4.8 -2.5 V2.5 L2.8 4.7 H-2.8 L-4.8 2.5 V-2.5Z M-2 -2.5 H2 V2.5 H-2Z',1.7);
    case 'hanging-pendants': return p('M-2 -5 H2 M0 -5 V-3 M0 -3 Q-5 -.5 -2 3 Q0 5 2 3 Q5 -.5 0 -3Z',1.85) + dot(0,1.3,.9);
    case 'ruby-hearts': return f('M0 4.5 C-5.5 1.7 -5 -4 -1.5 -3 C-.5 -2.8 0 -1.5 0 -1.5 C1.8 -4.5 5 -3.6 5 -.8 Q5 1.7 0 4.5Z') + p('M-2 -1.8 L0 0 L2 -1.8',.9);
    case 'crystal-clusters': return f('M-5 3.7 L-3.6 -3.8 L-1.3 -.8 L0 -5 L2.5 -1.8 L4 -3.5 L5 3.7Z') + p('M0 -5 V3.7 M-3.6 -3.8 L-2 3.7 M4 -3.5 L2.1 3.7',1);
    // ANIMAIS
    case 'cat-faces': return p('M-4 -1 V-4 L-1.8 -2 L1.8 -2 L4 -4 V-1 Q4.6 4 0 4 Q-4.6 4 -4 -1Z',1.8) + dot(-1.6,0,.65) + dot(1.6,0,.65) + p('M-1 2 L0 2.7 L1 2',.9);
    case 'bunny-ears': return p('M-2 2 C-5 -5 -2.4 -6 -1 -2 L0 1 M2 2 C5 -5 2.4 -6 1 -2 L0 1',2.15) + dot(0,3.4,1.45);
    case 'bird-wings': return f('M-5 2.5 Q-3 -5 0 -1 Q3 -5 5 2.5 Q2 .9 0 3.2 Q-2 .9 -5 2.5Z') + p('M-3 0 L0 2 L3 0',1);
    case 'tiny-foxes': return f('M-4 -3 L-1.5 -1 L1.5 -1 L4 -3 L4 1 Q0 5 -4 1Z') + dot(-1.3,0,.6) + dot(1.3,0,.6) + dot(0,2,.9);
    // AQUÁTICAS
    case 'shell-fans': return p('M-5 3 Q-5 -4 0 -4 Q5 -4 5 3Z M-3 2 L-1 -2 M0 3 V-3 M3 2 L1 -2',1.8);
    case 'little-fish': return f('M-3 -3 L-5 0 L-3 3 L-2 1 Q2 5 5 0 Q2 -5 -2 -1Z') + dot(2.2,-.5,.55);
    case 'wave-crests': return p('M-5 2 C-3 -4 0 -3 1 1 C3 -3 5 -2 5 1',2.6);
    case 'coral-branches': return p('M0 5 V-4 M0 1 L-3 -2 M0 3 L3 -1 M-3 -2 V-4 M3 -1 L4 -3',2.2);
    // FESTIVAS
    case 'party-balloons': return '<ellipse cy="-1" rx="3.4" ry="4" fill="' + c + '"/>' + p('M0 3 V5',1.3);
    case 'party-hats': return f('M-4 3 L0 -5 L4 3Z') + p('M-5 3 H5',2) + dot(0,-5,1.25);
    case 'star-garlands': return p('M-5 -1 Q0 4 5 -1',1.5) + '<g transform="translate(-3.4 .4) scale(.48)">' + f(star) + '</g>' + '<g transform="translate(0 2) scale(.48)">' + f(star) + '</g>' + '<g transform="translate(3.4 .4) scale(.48)">' + f(star) + '</g>';
    case 'firework-bursts': return dot(0,0,1.4) + p('M0 -5 V-3 M0 3 V5 M-5 0 H-3 M3 0 H5 M-3.6 -3.6 L-2.4 -2.4 M3.6 -3.6 L2.4 -2.4 M-3.6 3.6 L-2.4 2.4 M3.6 3.6 L2.4 2.4',1.65);
    // LAÇOS E FITAS
    case 'twin-bows': return p('M0 -1 Q-3 -5 -4 -2 Q-5 0 0 0 Q3 -5 4 -2 Q5 0 0 0 M0 0 Q-3 3 -4 1 Q-5 4 0 3 Q3 5 4 1 Q5 4 0 3',1.8);
    case 'ribbon-tails': return f('M-3 -5 Q0 -3 3 -5 V4 L0 2 L-3 4Z') + p('M-3 -2 H3',1);
    case 'heart-bows': return p('M0 0 Q-5 -5 -5 -1 Q-5 2 0 0 Q5 -5 5 -1 Q5 2 0 0',2) + f('M0 .7 L2 4.5 L0 3 L-2 4.5Z');
    case 'knotted-ribbons': return p('M-4 -2 Q0 -5 0 0 Q0 4 4 2 Q5 -2 0 0 M-3 4 L0 0 L3 4',2.1);
    // MOSAICOS
    case 'chevron-tiles': return f('M-5 -3 L0 1 L5 -3 V0 L0 4 L-5 0Z');
    case 'honeycomb-hexes': return p('M-4 -2 L-2 -4 L0 -2 V1 L-2 3 L-4 1Z M0 -2 L2 -4 L4 -2 V1 L2 3 L0 1Z',1.8);
    case 'circular-tiles': return circle(0,0,4.2,1.8) + circle(0,0,1.6,1.5) + dot(0,-4.2,.75);
    case 'triangle-mosaic': return f('M0 -5 L4 0 H-4Z') + p('M-4 1 H4 L0 5Z',1.5);
    // ROMÂNTICAS
    case 'rose-sprays': return f('M0 -4 C-4 -5 -4 0 0 1 C4 0 4 -5 0 -4Z') + p('M0 1 V5 M0 3 L-3 1 M0 4 L3 2',1.6);
    case 'cupid-arrows': return p('M-5 4 L4 -4 M0 -4 L4 -4 L4 0',1.9) + f('M-4 3 L-5 1 L-2 2Z');
    case 'rose-vines': return p('M-4 4 Q0 0 4 -4 M-2 2 Q-5 -1 -3 -2 Q-1 -2 -2 2Z M2 -2 Q5 -2 5 0 Q3 1 2 -2Z',1.65);
    case 'love-letters': return p('M-5 -3 H5 V3 H-5Z M-5 -3 L0 1 L5 -3',1.85) + dot(0,1,1.15);
    // DIVERTIDAS
    case 'tiny-cupcakes': return f('M-4 0 H4 L3 5 H-3Z') + p('M-4 0 Q-5 -3 -2 -3 Q-1 -6 1 -4 Q4 -4 4 0',1.65) + dot(0,-4.5,.9);
    case 'lollipops': return circle(0,-1.3,3.2,2) + p('M0 2 V5 M-2 -1.8 Q1 -3.5 2 -.8 Q3 2 0 1',1.5);
    case 'smile-clouds': return p('M-5 1 Q-5 -2 -2 -2 Q-1 -5 2 -3 Q5 -3 5 1 Q5 4 0 4 Q-5 4 -5 1Z',1.6) + dot(-1.6,.3,.55) + dot(1.6,.3,.55) + p('M-1 1.4 Q0 2.4 1 1.4',.8);
    case 'lucky-clovers': return '<g>' + circle(-1.7,-1.7,1.6,1.7) + circle(1.7,-1.7,1.6,1.7) + circle(-1.7,1.7,1.6,1.7) + circle(1.7,1.7,1.6,1.7) + '</g>' + p('M0 3 V5',1.4);
    // MINIMALISTAS
    case 'cardinal-arcs': return p('M-5 1 Q0 -4 5 1',2.5);
    case 'wide-spaced-dashes': return p('M-4 0 H4',3.1);
    case 'single-dot-pairs': return dot(-2.7,0,1.65) + dot(2.7,0,1.65);
    case 'square-brackets': return p('M-4 -4 H-1 M-4 -4 V4 M-4 4 H-1 M4 -4 H1 M4 -4 V4 M4 4 H1',2);
    // TECNOLÓGICAS
    case 'microchips': return p('M-3 -3 H3 V3 H-3Z M-1 -5 V-3 M2 -5 V-3 M-1 3 V5 M2 3 V5 M-5 -1 H-3 M3 -1 H5',1.7) + dot(0,0,1.2);
    case 'binary-blocks': return index % 2 ? r(-4,-4,3,8) + dot(2,0,2) : circle(-2,0,2,1.6) + r(1,-4,3,8);
    case 'wifi-arcs': return p('M-5 -1 Q0 -5 5 -1 M-3 1 Q0 -1.3 3 1',2.0) + dot(0,3.5,1.5);
    case 'gear-teeth': return circle(0,0,2.6,2) + p('M0 -5 V-3 M0 3 V5 M-5 0 H-3 M3 0 H5 M-3.6 -3.6 L-2.5 -2.5 M3.6 3.6 L2.5 2.5 M3.6 -3.6 L2.5 -2.5 M-3.6 3.6 L-2.5 2.5',2.35);
    default: return null;
  }
}
