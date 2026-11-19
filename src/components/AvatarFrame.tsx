import React from 'react';
import type { ReactNode } from 'react';
import { EXTRA_FRAME_MODELS, EXTRA_FRAME_LABELS, extraFrameCount, extraFrameMotif } from './avatarFrameExtras';
import { THEME_FRAME_MODELS, THEME_FRAME_LABELS, themeFrameCount, themeFrameMotif } from './avatarFrameThemes';
import { MORE_THEME_FRAME_MODELS, MORE_THEME_FRAME_LABELS, moreThemeFrameCount, moreThemeFrameMotif } from './avatarFrameThemesMore';

export type AvatarFrameModel =
  | 'none' | 'micro-hearts' | 'open-hearts' | 'petals' | 'petal-outline' | 'droplets'
  | 'pearls' | 'pearls-alternating' | 'mini-links' | 'open-links' | 'moons'
  | 'tiny-stars' | 'sparkles' | 'diamonds' | 'diamond-outline' | 'mini-arches'
  | 'arches-alternating' | 'tiny-waves' | 'seeds' | 'clovers' | 'tiny-flowers'
  | 'flower-outline' | 'tiny-bows' | 'light-dots' | 'micro-dashes' | 'tiny-leaves'
  | 'tiny-crescents' | 'double-dots' | 'star-outline' | 'mini-daisies' | 'scallops'
  | 'tiny-triangles' | 'leaf-pairs' | 'mini-swirls' | 'tiny-circles' | 'mini-squares'
  | 'star-dots' | 'tiny-fans' | 'tiny-comets' | 'mini-ribbons' | 'mini-shells'
  | 'tiny-branches' | 'mini-snowflakes' | 'tiny-crosses' | 'tiny-rings' | 'diamond-dots'
  | 'double-petals' | 'tiny-spirals' | 'mini-crowns' | 'tiny-sunbursts' | 'mini-feathers'
  | 'soft-braid' | 'woven-ribbon' | 'double-waves' | 'fine-chevron' | 'corner-marks' | 'tiny-sprigs' | 'delicate-crosses' | 'soft-x' | 'tiny-pluses' | 'fine-triangles' | 'hollow-rings' | 'hollow-stars' | 'outlined-stars' | 'tiny-squares' | 'rounded-dashes' | 'three-petals' | 'four-petal-flowers' | 'droplet-rays' | 'fine-spirals' | 'curved-waves' | 'starry-flower' | 'double-seeds' | 'infinity-links' | 'hollow-clovers' | 'soft-heartbeat'
  | import('./avatarFrameExtras').ExtraFrameModel
  | import('./avatarFrameThemes').ThemeFrameModel
  | import('./avatarFrameThemesMore').MoreThemeFrameModel;

export type AvatarFrameFinish = 'solid' | 'gradient' | 'pastel-rainbow' | 'soft-neon' | 'pearl' | 'metallic' | 'matte' | 'satin' | 'crystal';
export type AvatarFrameMotion = 'none' | 'soft-pulse' | 'soft-glow' | 'color-shift' | 'soft-shimmer' | 'color-wave' | 'twinkle' | 'soft-breathe' | 'glint' | 'rainbow-wave' | 'sparkle-wave' | 'soft-blink' | 'slow-twinkle' | 'light-ripple' | 'gentle-glimmer' | 'color-breathe' | 'soft-sway' | 'petal-dance' | 'fireflies' | 'comet-tail' | 'double-beat' | 'bloom';

// Uma só referência para o limite aplicado no editor e no renderizador.
export const MAX_AVATAR_FRAME_COLORS = 12;

export interface AvatarFrameSettings {
  model: AvatarFrameModel;
  finish: AvatarFrameFinish;
  colors: string[];
  motion: AvatarFrameMotion;
}

export const AVATAR_FRAME_MODEL_LABELS: Record<AvatarFrameModel, string> = {
  ...EXTRA_FRAME_LABELS,
  ...THEME_FRAME_LABELS,
  ...MORE_THEME_FRAME_LABELS,
  'none': 'Sem moldura',
  "micro-hearts": "Coraçõezinhos",
  "open-hearts": "Corações vazados",
  "petals": "Pétalas",
  "petal-outline": "Pétalas contornadas",
  "droplets": "Gotinhas",
  "pearls": "Pérolas",
  "pearls-alternating": "Pérolas alternadas",
  "mini-links": "Elos delicados",
  "open-links": "Elos vazados",
  "moons": "Luas",
  "tiny-stars": "Estrelinhas",
  "sparkles": "Brilhinhos",
  "diamonds": "Diamantes",
  "diamond-outline": "Diamantes vazados",
  "mini-arches": "Arcos pequenos",
  "arches-alternating": "Arcos alternados",
  "tiny-waves": "Ondinhas",
  "seeds": "Sementinhas",
  "clovers": "Trevinhos",
  "tiny-flowers": "Florezinhas",
  "flower-outline": "Flores contornadas",
  "tiny-bows": "Lacinhos",
  "light-dots": "Pontinhos",
  "micro-dashes": "Traços curtos",
  "tiny-leaves": "Folhinhas",
  "tiny-crescents": "Meias-luas",
  "double-dots": "Pontos duplos",
  "star-outline": "Estrelas contornadas",
  "mini-daisies": "Margaridinhas",
  "scallops": "Ondas delicadas",
  "tiny-triangles": "Triângulos pequenos",
  "leaf-pairs": "Folhas em pares",
  "mini-swirls": "Espirais pequenas",
  "tiny-circles": "Círculos pequenos",
  "mini-squares": "Quadradinhos",
  "star-dots": "Estrelas com pontos",
  "tiny-fans": "Leques pequenos",
  "tiny-comets": "Cometinhas",
  "mini-ribbons": "Fitas pequenas",
  "mini-shells": "Conchinhas",
  "tiny-branches": "Raminhos",
  "mini-snowflakes": "Flocos delicados",
  "tiny-crosses": "Cruzadinhas",
  "tiny-rings": "Anéis pequenos",
  "diamond-dots": "Diamantes pontilhados",
  "double-petals": "Pétalas duplas",
  "tiny-spirals": "Espirais finas",
  "mini-crowns": "Coroazinhas",
  "tiny-sunbursts": "Sóis delicados",
  "mini-feathers": "Penazinhas",
  "soft-braid": "Trançado suave",
  "woven-ribbon": "Fita entrelaçada",
  "double-waves": "Ondas duplas",
  "fine-chevron": "Chevron fino",
  "corner-marks": "Cantinhos",
  "tiny-sprigs": "Raminhos delicados",
  "delicate-crosses": "Cruzinhas delicadas",
  "soft-x": "Xis suaves",
  "tiny-pluses": "Pluzinhos",
  "fine-triangles": "Triângulos finos",
  "hollow-rings": "Argolinhas",
  "hollow-stars": "Estrelas vazadas",
  "outlined-stars": "Estrelinhas vazadas",
  "tiny-squares": "Quadradinhos",
  "rounded-dashes": "Traços arredondados",
  "three-petals": "Trio de pétalas",
  "four-petal-flowers": "Flores de quatro pétalas",
  "droplet-rays": "Raios de gotas",
  "fine-spirals": "Espirais finas",
  "curved-waves": "Ondas curvas",
  "starry-flower": "Flor estrelada",
  "double-seeds": "Sementes duplas",
  "infinity-links": "Elos infinitos",
  "hollow-clovers": "Trevos vazados",
  "soft-heartbeat": "Batimento suave"
};

export const AVATAR_FRAME_MODELS: AvatarFrameModel[] = [
  'none',
  'micro-hearts','open-hearts','petals','petal-outline','droplets','pearls','pearls-alternating',
  'mini-links','open-links','moons','tiny-stars','sparkles','diamonds','diamond-outline',
  'mini-arches','arches-alternating','tiny-waves','seeds','clovers','tiny-flowers',
  'flower-outline','tiny-bows','light-dots','micro-dashes','tiny-leaves',
  'tiny-crescents','double-dots','star-outline','mini-daisies','scallops',
  'tiny-triangles','leaf-pairs','mini-swirls','tiny-circles','mini-squares',
  'star-dots','tiny-fans','tiny-comets','mini-ribbons','mini-shells',
  'tiny-branches','mini-snowflakes','tiny-crosses','tiny-rings','diamond-dots',
  'double-petals','tiny-spirals','mini-crowns','tiny-sunbursts','mini-feathers',
  'soft-braid','woven-ribbon','double-waves','fine-chevron','corner-marks','tiny-sprigs','delicate-crosses','soft-x','tiny-pluses','fine-triangles','hollow-rings','hollow-stars','outlined-stars','tiny-squares','rounded-dashes','three-petals','four-petal-flowers','droplet-rays','fine-spirals','curved-waves','starry-flower','double-seeds','infinity-links','hollow-clovers','soft-heartbeat',
  ...EXTRA_FRAME_MODELS,
  ...THEME_FRAME_MODELS,
  ...MORE_THEME_FRAME_MODELS
];
const PALETTES = [
  ['#E7A2BD'], ['#A99AE8'], ['#80B9E9'], ['#79C9AD'], ['#D9B77E'],
  ['#E9A4A4'], ['#8ECBCB'], ['#C7A4E5'], ['#E6B4D1'], ['#A8B8D8']
];

export function defaultAvatarFrame(profileId: string): AvatarFrameSettings {
  let hash = 0;
  for (let i = 0; i < profileId.length; i++) hash = (hash * 31 + profileId.charCodeAt(i)) >>> 0;
  return {
    model: AVATAR_FRAME_MODELS[1 + (hash % (AVATAR_FRAME_MODELS.length - 1))],
    finish: 'solid',
    colors: PALETTES[Math.floor(hash / AVATAR_FRAME_MODELS.length) % PALETTES.length],
    motion: 'none'
  };
}

function motif(model: AvatarFrameModel, color: string, index: number) {
  const extra = extraFrameMotif(model, color, index);
  if (extra !== null) return extra;
  const theme = themeFrameMotif(model, color, index);
  if (theme !== null) return theme;
  const more = moreThemeFrameMotif(model, color, index);
  if (more !== null) return more;
  const thin = 'fill="none" stroke="' + color + '" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"';
  switch (model) {
    case 'micro-hearts': return '<path d="M0 3 C-5 0 -4 -4 0 -1 C4 -4 5 0 0 3Z" fill="' + color + '"/>';
    case 'open-hearts': return '<path d="M0 3 C-5 0 -4 -4 0 -1 C4 -4 5 0 0 3Z" ' + thin + '/>';
    case 'petals': return '<path d="M0 -3 Q3 0 0 3 Q-3 0 0 -3Z" fill="' + color + '"/>';
    case 'petal-outline': return '<path d="M0 -3 Q3 0 0 3 Q-3 0 0 -3Z" ' + thin + '/>';
    case 'droplets': return '<path d="M0 -3 Q4 2 0 3 Q-4 2 0 -3Z" fill="' + color + '"/>';
    case 'pearls': return '<circle r="1.65" fill="' + color + '"/>';
    case 'pearls-alternating': return '<circle r="' + (index % 2 ? '1.2' : '2') + '" fill="' + color + '"/>';
    case 'mini-links': return '<ellipse rx="2.7" ry="1.7" ' + thin + '/>';
    case 'open-links': return '<path d="M-2.5 0 Q-2.5 -2.8 0 -2.8 Q2.5 -2.8 2.5 0 Q2.5 2.8 0 2.8" ' + thin + '/>';
    case 'moons': return '<path d="M1 -3 A3 3 0 1 0 1 3 A2.2 2.2 0 1 1 1 -3Z" fill="' + color + '"/>';
    case 'tiny-stars': return '<path d="M0 -3 L.8 -.8 L3 0 L.8 .8 L0 3 L-.8 .8 L-3 0 L-.8 -.8Z" fill="' + color + '"/>';
    case 'sparkles': return '<path d="M0 -2.8 V2.8 M-2.8 0 H2.8" ' + thin + '/>';
    case 'diamonds': return '<path d="M0 -2.7 L2.2 0 L0 2.7 L-2.2 0Z" fill="' + color + '"/>';
    case 'diamond-outline': return '<path d="M0 -2.7 L2.2 0 L0 2.7 L-2.2 0Z" ' + thin + '/>';
    case 'mini-arches': return '<path d="M-2.5 2 V0 A2.5 2.5 0 0 1 2.5 0 V2" ' + thin + '/>';
    case 'arches-alternating': return '<path d="M-2.5 1 A2.5 2.5 0 0 1 2.5 1" ' + thin + '/>';
    case 'tiny-waves': return '<path d="M-3 0 Q-1.5 -2 0 0 T3 0" ' + thin + '/>';
    case 'seeds': return '<ellipse rx="1.2" ry="2.8" transform="rotate(25)" fill="' + color + '"/>';
    case 'clovers': return '<circle cx="-1.3" cy="-1" r="1.4" fill="' + color + '"/><circle cx="1.3" cy="-1" r="1.4" fill="' + color + '"/><circle cy="1.3" r="1.4" fill="' + color + '"/>';
    case 'tiny-flowers': return '<circle cy="-1.8" r="1.3" fill="' + color + '"/><circle cx="1.8" r="1.3" fill="' + color + '"/><circle cy="1.8" r="1.3" fill="' + color + '"/><circle cx="-1.8" r="1.3" fill="' + color + '"/>';
    case 'flower-outline': return '<circle r="2.4" ' + thin + '/><circle r=".7" fill="' + color + '"/>';
    case 'tiny-bows': return '<path d="M0 0 Q-3 -3 -2.8 1 L0 0 Q3 -3 2.8 1Z" ' + thin + '/>';
    case 'light-dots': return '<circle r="1" fill="' + color + '"/>';
    case 'micro-dashes': return '<path d="M-1.8 0 H1.8" ' + thin + '/>';
    case 'tiny-leaves': return '<path d="M0 2 Q-3 0 -1.8 -2.5 Q1 -2 0 2Z" fill="' + color + '"/>';
    case 'tiny-crescents': return '<path d="M1 -3 A3.2 3.2 0 1 0 1 3 A2.2 2.2 0 1 1 1 -3Z" ' + thin + '/>';
    case 'double-dots': return '<circle cx="-1.5" r="1.1" fill="' + color + '"/><circle cx="1.5" r="1.1" fill="' + color + '"/>';
    case 'star-outline': return '<path d="M0 -3 L.8 -1 .8 -1 3 0 .8 1 0 3 -.8 1 -3 0 -.8 -1Z" ' + thin + '/>';
    case 'mini-daisies': return '<circle cy="-2" r="1.1" fill="' + color + '"/><circle cx="2" r="1.1" fill="' + color + '"/><circle cy="2" r="1.1" fill="' + color + '"/><circle cx="-2" r="1.1" fill="' + color + '"/><circle r=".8" fill="#FFF"/>';
    case 'scallops': return '<path d="M-3 1 Q-3 -2 0 -2 Q3 -2 3 1" ' + thin + '/>';
    case 'tiny-triangles': return '<path d="M0 -2.8 L2.5 2 H-2.5Z" ' + thin + '/>';
    case 'leaf-pairs': return '<path d="M0 0 Q-3 -3 -2 -1 Q-1 1 0 0 Q3 -3 2 -1 Q1 1 0 0Z" ' + thin + '/>';
    case 'mini-swirls': return '<path d="M-2 1 C-3 -2 2 -3 2 0 C2 2 0 2 0 1" ' + thin + '/>';
    case 'tiny-circles': return '<circle r="2.3" ' + thin + '/>';
    case 'mini-squares': return '<rect x="-1.8" y="-1.8" width="3.6" height="3.6" rx=".6" ' + thin + '/>';
    case 'star-dots': return '<path d="M0 -2.6 L.7 -.7 2.6 0 .7 .7 0 2.6 -.7 .7 -2.6 0 -.7 -.7Z" fill="' + color + '"/><circle r=".65" fill="#FFF"/>';
    case 'tiny-fans': return '<path d="M0 2 L-2.6 -1 Q-1.5 -2.5 0 -1.2 Q1.5 -2.5 2.6 -1Z" ' + thin + '/>';
    case 'tiny-comets': return '<circle r="1.5" fill="' + color + '"/><path d="M-2 2 L-3.2 3.2 M-1 2.5 L-1.8 3.8" ' + thin + '/>';
    case 'mini-ribbons': return '<path d="M-2.5 -2 L0 0 L2.5 -2 M-2.5 2 L0 0 L2.5 2" ' + thin + '/>';
    case 'mini-shells': return '<path d="M-3 2 A3 3 0 0 1 3 2 M-1.5 2 L-1 0 M0 2 V-1 M1.5 2 L1 0" ' + thin + '/>';
    case 'tiny-branches': return '<path d="M0 3 V-2 M0 0 L-2 -2 M0 1 L2 -1" ' + thin + '/>';
    case 'mini-snowflakes': return '<path d="M0 -3 V3 M-2.6 -1.5 L2.6 1.5 M-2.6 1.5 L2.6 -1.5" ' + thin + '/>';
    case 'tiny-crosses': return '<path d="M0 -2.5 V2.5 M-2.5 0 H2.5" ' + thin + '/>';
    case 'tiny-rings': return '<circle r="2.2" fill="none" stroke="' + color + '" stroke-width="1.1"/><circle r=".7" fill="' + color + '"/>';
    case 'diamond-dots': return '<path d="M0 -2.5 L2 0 L0 2.5 L-2 0Z" ' + thin + '/><circle r=".7" fill="' + color + '"/>';
    case 'double-petals': return '<path d="M0 0 Q-3 -3 0 -3 Q3 -3 0 0 Q3 3 0 3 Q-3 3 0 0Z" ' + thin + '/>';
    case 'tiny-spirals': return '<path d="M1.8 0 C1.8 -2.5 -2 -2.5 -2 0 C-2 2 1 2 1 0 C1  -.8 0 -.8 0 0" ' + thin + '/>';
    case 'mini-crowns': return '<path d="M-3 1 L-2 -2 L0 0 L2 -2 L3 1 V2 H-3Z" ' + thin + '/>';
    case 'tiny-sunbursts': return '<circle r="1.1" fill="' + color + '"/><path d="M0 -3 V-2 M0 2 V3 M-3 0 H-2 M2 0 H3 M-2 -2 L-1.5 -1.5 M2 2 L1.5 1.5 M2 -2 L1.5 -1.5 M-2 2 L-1.5 1.5" ' + thin + '/>';
    case 'mini-feathers': return '<path d="M-2 2 Q-2 -3 2 -3 Q2 1 -2 2Z M-1 1 L1 -1" ' + thin + '/>';
    case 'soft-braid': return '<path d="M-3 -2 Q0 -5 3 -2 Q0 1 -3 2 Q0 5 3 2" ' + thin + '/>';
    case 'woven-ribbon': return '<path d="M-3 -2 L3 2 M-3 2 L3 -2" ' + thin + '/>';
    case 'double-waves': return '<path d="M-3 -1 Q-1 -3 1 -1 T3 -1 M-3 2 Q-1 0 1 2 T3 2" ' + thin + '/>';
    case 'fine-chevron': return '<path d="M-2 -2 L0 0 L2 -2 M-2 1 L0 3 L2 1" ' + thin + '/>';
    case 'corner-marks': return '<path d="M-2 -2 H0 M-2 -2 V0 M2 -2 H0 M2 -2 V0 M-2 2 H0 M-2 2 V0 M2 2 H0 M2 2 V0" ' + thin + '/>';
    case 'tiny-sprigs': return '<path d="M0 3 V-2 M0 0 L-2 -2 M0 1 L2 -1" ' + thin + '/>';
    case 'delicate-crosses': return '<path d="M0 -2.5 V2.5 M-2.5 0 H2.5" ' + thin + '/>';
    case 'soft-x': return '<path d="M-2 -2 L2 2 M-2 2 L2 -2" ' + thin + '/>';
    case 'tiny-pluses': return '<path d="M0 -2.2 V2.2 M-2.2 0 H2.2" ' + thin + '/>';
    case 'fine-triangles': return '<path d="M0 -2.8 L2.5 2 H-2.5Z" ' + thin + '/>';
    case 'hollow-rings': return '<circle r="2.4" ' + thin + '/>';
    case 'hollow-stars': return '<path d="M0 -3 L.8 -.8 L3 0 .8 .8 0 3 -.8 .8 -3 0 -.8 -.8Z" ' + thin + '/>';
    case 'outlined-stars': return '<path d="M0 -3 L.7 -1 2.8 -.8 1.1 .5 1.7 2.7 0 1.5 -1.7 2.7 -1.1 .5 -2.8 -.8 -.7 -1Z" ' + thin + '/>';
    case 'tiny-squares': return '<rect x="-2" y="-2" width="4" height="4" rx=".7" ' + thin + '/>';
    case 'rounded-dashes': return '<path d="M-2.2 0 H2.2" stroke="' + color + '" stroke-width="2" stroke-linecap="round"/>';
    case 'three-petals': return '<path d="M0 0 Q-3 -3 -1 -3 Q1 -3 0 0 Q3 -3 3 -1 Q3 1 0 0 Q2 3 0 3 Q-2 3 0 0Z" ' + thin + '/>';
    case 'four-petal-flowers': return '<path d="M0 0 Q-2 -3 0 -3 Q2 -3 0 0 Q3 -2 3 0 Q3 2 0 0 Q2 3 0 3 Q-2 3 0 0 Q-3 2 -3 0 Q-3 -2 0 0Z" ' + thin + '/>';
    case 'droplet-rays': return '<path d="M0 -3 Q3 0 0 3 Q-3 0 0 -3Z" fill="' + color + '"/>';
    case 'fine-spirals': return '<path d="M2 0 C2 -2.5 -2 -2.5 -2 0 C-2 2 1 2 1 0 C1 -.8 0 -.8 0 0" ' + thin + '/>';
    case 'curved-waves': return '<path d="M-3 1 Q-1 -3 1 -1 Q3 1 3 -1" ' + thin + '/>';
    case 'starry-flower': return '<path d="M0 -3 L.7 -.8 3 0 .7 .8 0 3 -.7 .8 -3 0 -.7 -.8Z" ' + thin + '/><circle r=".7" fill="' + color + '"/>';
    case 'double-seeds': return '<ellipse cx="-1.4" cy="0" rx="1.2" ry="2.2" transform="rotate(-25 -1.4 0)" fill="' + color + '"/><ellipse cx="1.4" cy="0" rx="1.2" ry="2.2" transform="rotate(25 1.4 0)" fill="' + color + '"/>';
    case 'infinity-links': return '<path d="M0 0 C-3 -3 -4 1 -2 2 C0 3 1 -2 3 -2 C5 -1 3 3 0 0Z" ' + thin + '/>';
    case 'hollow-clovers': return '<circle cx="-1.3" cy="-1" r="1.3" ' + thin + '/><circle cx="1.3" cy="-1" r="1.3" ' + thin + '/><circle cy="1.3" r="1.3" ' + thin + '/>';
    case 'soft-heartbeat': return '<path d="M-3 0 H-1 L0 -2 L1 2 L2 0 H3" ' + thin + '/>';
  }
}

function mixHex(a: string, b: string, amount: number) {
  const parse = (v: string) => {
    const h = v.replace('#','');
    return [0,2,4].map(i => parseInt(h.slice(i,i+2),16) || 0);
  };
  const aa=parse(a), bb=parse(b);
  return '#' + aa.map((v,i)=>Math.round(v+(bb[i]-v)*amount).toString(16).padStart(2,'0')).join('');
}

function colorAt(colors: string[], position: number) {
  const stops = colors.length > 1 ? colors : [colors[0], colors[0]];
  const scaled = position * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  return mixHex(stops[index], stops[index+1], scaled-index);
}

// Cada efeito tem uma animação e um padrão temporal próprios. O seletor
// mostra várias miniaturas simultaneamente: não use uma classe CSS global
// para definir animation, pois a última miniatura substituiria as demais.
type FrameMotionPattern = 'together' | 'around' | 'reverse' | 'random' | 'alternate' | 'pairs' | 'quarters';
const FRAME_MOTION_EFFECTS: Record<AvatarFrameMotion, { name: string; seconds: number; pattern: FrameMotionPattern } | null> = {
  'none': null,
  'soft-pulse': { name: 'avatarfx-pulse', seconds: 3.6, pattern: 'together' },
  'soft-glow': { name: 'avatarfx-glow', seconds: 4.6, pattern: 'together' },
  'color-shift': { name: 'avatarfx-color', seconds: 6.4, pattern: 'together' },
  'soft-shimmer': { name: 'avatarfx-shimmer', seconds: 4.2, pattern: 'around' },
  'color-wave': { name: 'avatarfx-wave', seconds: 3.2, pattern: 'around' },
  'twinkle': { name: 'avatarfx-twinkle', seconds: 3.8, pattern: 'random' },
  'soft-breathe': { name: 'avatarfx-breathe', seconds: 4.8, pattern: 'together' },
  'glint': { name: 'avatarfx-glint', seconds: 4.5, pattern: 'reverse' },
  'rainbow-wave': { name: 'avatarfx-rainbow', seconds: 5.6, pattern: 'around' },
  'sparkle-wave': { name: 'avatarfx-sparkles', seconds: 4.0, pattern: 'pairs' },
  'soft-blink': { name: 'avatarfx-blink', seconds: 3.2, pattern: 'alternate' },
  'slow-twinkle': { name: 'avatarfx-slowtwinkle', seconds: 6.2, pattern: 'random' },
  'light-ripple': { name: 'avatarfx-ripple', seconds: 3.8, pattern: 'around' },
  'gentle-glimmer': { name: 'avatarfx-glimmer', seconds: 5.0, pattern: 'random' },
  'color-breathe': { name: 'avatarfx-colorbreathe', seconds: 5.2, pattern: 'together' },
  'soft-sway': { name: 'avatarfx-sway', seconds: 3.8, pattern: 'quarters' },
  'petal-dance': { name: 'avatarfx-petaldance', seconds: 4.2, pattern: 'alternate' },
  'fireflies': { name: 'avatarfx-still', seconds: 5.4, pattern: 'together' },
  'comet-tail': { name: 'avatarfx-still', seconds: 5, pattern: 'together' },
  'double-beat': { name: 'avatarfx-doublebeat', seconds: 4.2, pattern: 'together' },
  'bloom': { name: 'avatarfx-bloom', seconds: 4.5, pattern: 'pairs' }
};

// Só os desenhos brilham/movem: nenhum segundo aro e nenhuma rotação.
// Animar o grupo INTERNO preserva o posicionamento radial do grupo SVG externo.
const AVATAR_FRAME_MOTION_CSS = [
  '@keyframes avatarfx-pulse{0%,100%{transform:scale(.92);opacity:.9}50%{transform:scale(1.3);opacity:1}}',
  '@keyframes avatarfx-glow{0%,100%{filter:drop-shadow(0 0 0 transparent);opacity:1}50%{filter:drop-shadow(0 0 3.5px currentColor);opacity:1}}',
  '@keyframes avatarfx-color{0%,100%{opacity:1}50%{opacity:1}}',
  '@keyframes avatarfx-shimmer{0%,75%,100%{opacity:.84;filter:brightness(1)}11%,26%{opacity:1;filter:brightness(2.1) drop-shadow(0 0 1.7px currentColor)}}',
  '@keyframes avatarfx-wave{0%,75%,100%{transform:translateY(0) scale(1)}19%,36%{transform:translateY(-3px) scale(1.24)}}',
  '@keyframes avatarfx-twinkle{0%,48%,100%{transform:scale(.85);opacity:.73}13%,30%{transform:scale(1.5);opacity:1;filter:drop-shadow(0 0 1.9px currentColor)}}',
  '@keyframes avatarfx-breathe{0%,100%{transform:translateY(2.4px);opacity:.95}50%{transform:translateY(-2.4px);opacity:1}}',
  '@keyframes avatarfx-glint{0%,75%,100%{filter:brightness(1);transform:scaleX(1)}15%,29%{filter:brightness(2.3) drop-shadow(0 0 2px currentColor);transform:scaleX(1.38)}}',
  '@keyframes avatarfx-rainbow{0%,100%{filter:hue-rotate(0deg) saturate(1.2)}33%{filter:hue-rotate(110deg) saturate(1.9)}67%{filter:hue-rotate(235deg) saturate(1.5)}}',
  '@keyframes avatarfx-sparkles{0%,68%,100%{transform:scale(.87);opacity:.75}12%,28%{transform:scale(1.46);opacity:1}}',
  '@keyframes avatarfx-blink{0%,14%,100%{opacity:1;filter:brightness(1.5)}34%,66%{opacity:.26;filter:brightness(.9)}}',
  '@keyframes avatarfx-slowtwinkle{0%,65%,100%{transform:scale(.95);opacity:.88}20%,39%{transform:scale(1.4);opacity:1;filter:drop-shadow(0 0 1.8px currentColor)}}',
  '@keyframes avatarfx-ripple{0%,77%,100%{transform:translateY(2px) scale(.95)}20%,37%{transform:translateY(-3.2px) scale(1.25)}}',
  '@keyframes avatarfx-glimmer{0%,62%,100%{opacity:1;filter:brightness(1)}16%,31%{opacity:1;filter:brightness(1.8)}}',
  '@keyframes avatarfx-colorbreathe{0%,100%{filter:brightness(.88)}50%{filter:brightness(1.23)}}',
  '@keyframes avatarfx-still{0%,100%{opacity:1}50%{opacity:.98}}',
  '@keyframes avatarfx-sway{0%,100%{transform:translateX(-2.4px)}50%{transform:translateX(2.4px)}}',
  '@keyframes avatarfx-petaldance{0%,100%{transform:rotate(-18deg) translateY(.6px)}50%{transform:rotate(18deg) translateY(-1.4px)}}',
  '@keyframes avatarfx-doublebeat{0%,13%,31%,100%{transform:scale(.94)}19%{transform:scale(1.44)}37%{transform:scale(1.27)}48%,85%{transform:scale(.94)}}',
  '@keyframes avatarfx-bloom{0%,75%,100%{transform:scale(.84)}30%,55%{transform:scale(1.34)}}',
  '@keyframes avatarfx-fairy{0%,14%,100%{transform:translate(-2px,2px) scale(.5);opacity:0}34%,57%{transform:translate(1px,-2.6px) scale(1.18);opacity:1}75%{opacity:0}}',
  '@keyframes avatarfx-comet{0%,10%,100%{transform:translate(-3px,2.5px);opacity:0}31%,46%{opacity:1}65%{transform:translate(3px,-2.8px);opacity:0}}',
  '@keyframes avatarfx-petals{0%,15%,100%{opacity:0;transform:scale(.35)}35%,58%{opacity:1;transform:scale(1.4)}}',
  '@keyframes avatarfx-flickerstar{0%,65%,100%{opacity:0;transform:scale(.3)}16%,34%{opacity:1;transform:scale(1.1)}}',
  '@media(prefers-reduced-motion:reduce){.avatar-frame-ink,.avatar-frame-accent{animation:none!important;opacity:1!important;transform:none!important;filter:none!important}}'
].join('');

function frameMotionDelay(pattern: FrameMotionPattern, index: number, total: number, seconds: number): number {
  if (pattern === 'together') return 0;
  if (pattern === 'alternate') return (index % 2) * seconds / 2;
  if (pattern === 'pairs') return (Math.floor(index / 3) % 5) * seconds / 5;
  if (pattern === 'quarters') return (Math.floor(index / 6) % 2) * seconds / 2;
  if (pattern === 'random') return ((index * 7 + 3) % total) * seconds / total;
  if (pattern === 'reverse') return ((total - index) % total) * seconds / total;
  return index * seconds / total;
}

function frameMotionAccent(motion: AvatarFrameMotion, color: string, index: number, seconds: number): string {
  const center = 'transform-box:fill-box;transform-origin:center;';
  const delay = (((index * 11 + 4) % 24) / 24 * seconds).toFixed(2);
  if (motion === 'fireflies' && index % 3 === 0) {
    return '<g class="avatar-frame-accent" style="' + center + 'animation:avatarfx-fairy ' + seconds + 's ease-in-out infinite;animation-delay:-' + delay + 's">' +
      '<circle cy="-1.8" r="2.1" fill="' + color + '" opacity=".65"/><circle cy="-1.8" r="1" fill="#FFFFFF"/></g>';
  }
  if (motion === 'comet-tail' && index % 4 === 0) {
    return '<g class="avatar-frame-accent" style="' + center + 'animation:avatarfx-comet ' + seconds + 's ease-in-out infinite;animation-delay:-' + delay + 's">' +
      '<path d="M-4 2 L0 -1.5" stroke="' + color + '" stroke-width="1.35" stroke-linecap="round"/><circle cx=".8" cy="-2" r="1.2" fill="#FFFFFF"/></g>';
  }
  if (motion === 'bloom' && index % 3 === 0) {
    return '<g class="avatar-frame-accent" style="' + center + 'animation:avatarfx-petals ' + seconds + 's ease-in-out infinite;animation-delay:-' + delay + 's">' +
      '<path d="M0 -4 Q2 -2 0 0 Q-2 -2 0 -4 M4 0 Q2 2 0 0 Q2 -2 4 0 M0 4 Q-2 2 0 0 Q2 2 0 4 M-4 0 Q-2 -2 0 0 Q-2 2 -4 0" fill="' + color + '" stroke="' + color + '" stroke-width=".6"/></g>';
  }
  if ((motion === 'twinkle' || motion === 'sparkle-wave' || motion === 'slow-twinkle' || motion === 'gentle-glimmer') && index % (motion === 'slow-twinkle' ? 4 : 3) === 0) {
    return '<g class="avatar-frame-accent" style="' + center + 'animation:avatarfx-flickerstar ' + seconds + 's ease-in-out infinite;animation-delay:-' + delay + 's">' +
      '<path d="M0 -4 V4 M-4 0 H4" fill="none" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"/></g>';
  }
  return '';
}

/** Transições passam apenas pelas cores escolhidas, na ordem do seletor. */
function selectedColorKeyframes(colors: string[], breathing: boolean): { name: string; css: string } | null {
  if (colors.length < 2) return null;
  // Validated hex colors double as a stable, instance-safe animation name.
  const name = 'avatarfx-' + (breathing ? 'breathing-' : 'chosen-') + colors.map(c => c.slice(1).toLowerCase()).join('-');
  const stops = [...colors, colors[0]];
  const css = '@keyframes ' + name + '{' + stops.map((color, index) => {
    const position = Math.round(index * 100 / colors.length);
    const brightness = breathing ? 'filter:brightness(' + (index % 2 ? '1.15' : '.94') + ');' : '';
    return position + '%{color:' + color + ';' + brightness + '}';
  }).join('') + '}';
  return { name, css };
}

export function AvatarFrame({ profileId, settings, children, className = '', size = 48 }: {
  profileId: string; settings?: AvatarFrameSettings; children: ReactNode; className?: string; size?: number;
}) {
  const frame = settings || defaultAvatarFrame(profileId);
  if (frame.model === 'none') return <span className={'relative inline-flex items-center justify-center rounded-full ' + className} style={{width:size,height:size,flex:'0 0 auto'}}><span className="relative rounded-full overflow-hidden w-full h-full">{children}</span></span>;
  const color = frame.colors?.[0] || '#A99AE8';
  const chosenColors = (frame.colors || []).filter(c => /^#[0-9a-fA-F]{6}$/.test(c)).slice(0, MAX_AVATAR_FRAME_COLORS);
  if (chosenColors.length === 0) chosenColors.push('#A99AE8');
  const isSelectedColorEffect = frame.motion === 'color-shift' || frame.motion === 'color-breathe';
  const colorAnimation = isSelectedColorEffect
    ? selectedColorKeyframes(chosenColors, frame.motion === 'color-breathe')
    : null;
  // Todas as cores selecionadas precisam aparecer nos ornamentos — também
  // quando o usuário escolhe mais de três cores. Os acabamentos preservam
  // suas variações de brilho e são aplicados a cada tonalidade escolhida.
  const finishPalette = (light: string, middle: string, high: string, a: number, b: number, c: number) =>
    chosenColors.length === 1
      ? [mixHex(color,light,a),mixHex(color,middle,b),mixHex(color,high,c)]
      : chosenColors.map((base,i) => mixHex(base, i % 3 === 1 ? middle : (i % 3 === 2 ? high : light), [a,b,c][i % 3]));
  const palette = frame.finish === 'pastel-rainbow'
    ? ['#E9A9C4','#E9D49B','#9BD4B7','#9EC7EB','#C3A9E8','#E9A9C4']
    : frame.finish === 'pearl'
      ? finishPalette('#FFFFFF','#D9D2E8','#FFFFFF',.58,.32,.78)
      : frame.finish === 'metallic'
        ? finishPalette('#FFFFFF','#8A806F','#FFFFFF',.42,.18,.62)
        : frame.finish === 'satin'
          ? finishPalette('#FFFFFF','#777777','#FFFFFF',.24,.08,.38)
          : frame.finish === 'crystal'
            ? finishPalette('#FFFFFF','#B9DDF5','#FFFFFF',.72,.48,.88)
            : chosenColors.length === 1 ? [color,color] : [...chosenColors,color];
  const count = extraFrameCount(frame.model) ?? themeFrameCount(frame.model) ?? moreThemeFrameCount(frame.model) ?? 24;
  const radius = 46;
  // "Cores em transição": com uma única cor não existe animação, nem variação de tom.
  const effect = frame.motion === 'color-shift' && chosenColors.length < 2
    ? null : FRAME_MOTION_EFFECTS[frame.motion] ?? null;
  const svg = Array.from({length: count}, (_, i) => {
    const angle = (360 / count) * i - 90;
    const position = i / (count - 1);
    const motifColor = frame.finish === 'gradient' || frame.finish === 'pastel-rainbow'
      ? colorAt(palette, position)
      : frame.finish === 'pearl' || frame.finish === 'metallic'
        ? palette[i % palette.length]
        : frame.finish === 'soft-neon' ? palette[i % palette.length] : frame.finish === 'matte' ? mixHex(palette[i % palette.length],'#777777',.12) : palette[i % palette.length];
    const inkColor = isSelectedColorEffect ? chosenColors[0] : motifColor;
    const inkPaint = colorAnimation ? 'currentColor' : inkColor;
    const delay = effect ? frameMotionDelay(effect.pattern, i, count, effect.seconds) : 0;
    const animationName = colorAnimation?.name || effect?.name;
    const animStyle = effect && animationName
      ? 'animation:' + animationName + ' ' + effect.seconds + 's ease-in-out infinite;animation-delay:-' + delay.toFixed(2) + 's;'
      : '';
    const accent = effect ? frameMotionAccent(frame.motion, inkColor, i, effect.seconds) : '';
    // Desenhos novos têm poucos elementos maiores, evitando que todos
    // pareçam pontinhos iguais quando a foto do perfil é pequena.
    const ornamentScale = (extraFrameCount(frame.model) !== null || themeFrameCount(frame.model) !== null || moreThemeFrameCount(frame.model) !== null)
      ? (size < 76 ? 1.14 : 1.06) : (size < 76 ? 1.16 : 1);
    return '<g transform="translate(50 50) rotate(' + angle + ') translate(0 -' + radius + ') scale(' + ornamentScale + ')">' +
      '<g class="avatar-frame-ink" style="color:' + inkColor + ';transform-box:fill-box;transform-origin:center;' + animStyle + '">' +
      motif(frame.model, inkPaint, i) + '</g>' + accent + '</g>';
  }).join('');
  const stroke = frame.finish === 'soft-neon' ? 'drop-shadow(0 0 2px ' + color + ') drop-shadow(0 0 4px ' + color + ')' :
    frame.finish === 'pearl' || frame.finish === 'crystal' ? 'drop-shadow(0 0 1px #fff)' :
    frame.finish === 'metallic' ? 'drop-shadow(0 0 1px #D8C29A)' :
    frame.finish === 'satin' ? 'drop-shadow(0 0 1px rgba(255,255,255,.45))' : undefined;
  return <span className={'relative inline-flex items-center justify-center rounded-full ' + className} style={{width:size,height:size,flex:'0 0 auto'}}>
    <style>{AVATAR_FRAME_MOTION_CSS + (colorAnimation?.css || '')}</style>
    <span className="absolute inset-0 rounded-full overflow-hidden" style={{filter:stroke}} dangerouslySetInnerHTML={{__html:'<svg class="avatar-frame-svg" viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">' + svg + '</svg>'}} />
    <span className="relative z-10 rounded-full overflow-hidden" style={{width:'76%',height:'76%'}}>{children}</span>
  </span>;
}
