import React from 'react';
import type { ReactNode } from 'react';

export type AvatarFrameModel =
  | 'micro-hearts' | 'open-hearts' | 'petals' | 'petal-outline' | 'droplets'
  | 'pearls' | 'pearls-alternating' | 'mini-links' | 'open-links' | 'moons'
  | 'tiny-stars' | 'sparkles' | 'diamonds' | 'diamond-outline' | 'mini-arches'
  | 'arches-alternating' | 'tiny-waves' | 'seeds' | 'clovers' | 'tiny-flowers'
  | 'flower-outline' | 'tiny-bows' | 'light-dots' | 'micro-dashes' | 'tiny-leaves'
  | 'tiny-crescents' | 'double-dots' | 'star-outline' | 'mini-daisies' | 'scallops'
  | 'tiny-triangles' | 'leaf-pairs' | 'mini-swirls' | 'tiny-circles' | 'mini-squares'
  | 'star-dots' | 'tiny-fans' | 'tiny-comets' | 'mini-ribbons' | 'mini-shells'
  | 'tiny-branches' | 'mini-snowflakes' | 'tiny-crosses' | 'tiny-rings' | 'diamond-dots'
  | 'double-petals' | 'tiny-spirals' | 'mini-crowns' | 'tiny-sunbursts' | 'mini-feathers'
  | 'soft-braid' | 'woven-ribbon' | 'double-waves' | 'fine-chevron' | 'corner-marks' | 'tiny-sprigs' | 'delicate-crosses' | 'soft-x' | 'tiny-pluses' | 'fine-triangles' | 'hollow-rings' | 'hollow-stars' | 'outlined-stars' | 'tiny-squares' | 'rounded-dashes' | 'three-petals' | 'four-petal-flowers' | 'droplet-rays' | 'fine-spirals' | 'curved-waves' | 'starry-flower' | 'double-seeds' | 'infinity-links' | 'hollow-clovers' | 'soft-heartbeat';

export type AvatarFrameFinish = 'solid' | 'gradient' | 'pastel-rainbow' | 'soft-neon' | 'pearl' | 'metallic';
export type AvatarFrameMotion = 'none' | 'soft-pulse' | 'soft-glow' | 'color-shift' | 'soft-shimmer' | 'color-wave' | 'twinkle' | 'soft-breathe' | 'glint' | 'rainbow-wave' | 'sparkle-wave';

export interface AvatarFrameSettings {
  model: AvatarFrameModel;
  finish: AvatarFrameFinish;
  colors: string[];
  motion: AvatarFrameMotion;
}

export const AVATAR_FRAME_MODEL_LABELS: Record<AvatarFrameModel, string> = {
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
  'micro-hearts','open-hearts','petals','petal-outline','droplets','pearls','pearls-alternating',
  'mini-links','open-links','moons','tiny-stars','sparkles','diamonds','diamond-outline',
  'mini-arches','arches-alternating','tiny-waves','seeds','clovers','tiny-flowers',
  'flower-outline','tiny-bows','light-dots','micro-dashes','tiny-leaves',
  'tiny-crescents','double-dots','star-outline','mini-daisies','scallops',
  'tiny-triangles','leaf-pairs','mini-swirls','tiny-circles','mini-squares',
  'star-dots','tiny-fans','tiny-comets','mini-ribbons','mini-shells',
  'tiny-branches','mini-snowflakes','tiny-crosses','tiny-rings','diamond-dots',
  'double-petals','tiny-spirals','mini-crowns','tiny-sunbursts','mini-feathers',
  'soft-braid','woven-ribbon','double-waves','fine-chevron','corner-marks','tiny-sprigs','delicate-crosses','soft-x','tiny-pluses','fine-triangles','hollow-rings','hollow-stars','outlined-stars','tiny-squares','rounded-dashes','three-petals','four-petal-flowers','droplet-rays','fine-spirals','curved-waves','starry-flower','double-seeds','infinity-links','hollow-clovers','soft-heartbeat'
];
const PALETTES = [
  ['#E7A2BD'], ['#A99AE8'], ['#80B9E9'], ['#79C9AD'], ['#D9B77E'],
  ['#E9A4A4'], ['#8ECBCB'], ['#C7A4E5'], ['#E6B4D1'], ['#A8B8D8']
];

export function defaultAvatarFrame(profileId: string): AvatarFrameSettings {
  let hash = 0;
  for (let i = 0; i < profileId.length; i++) hash = (hash * 31 + profileId.charCodeAt(i)) >>> 0;
  return {
    model: AVATAR_FRAME_MODELS[hash % AVATAR_FRAME_MODELS.length],
    finish: 'solid',
    colors: PALETTES[Math.floor(hash / AVATAR_FRAME_MODELS.length) % PALETTES.length],
    motion: 'none'
  };
}

function motif(model: AvatarFrameModel, color: string, index: number) {
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

export function AvatarFrame({ profileId, settings, children, className = '', size = 48 }: {
  profileId: string; settings?: AvatarFrameSettings; children: ReactNode; className?: string; size?: number;
}) {
  const frame = settings || defaultAvatarFrame(profileId);
  const color = frame.colors?.[0] || '#A99AE8';
  const second = frame.colors?.[1] || color;
  const third = frame.colors?.[2] || second;
  const palette = frame.finish === 'pastel-rainbow'
    ? ['#E9A9C4','#E9D49B','#9BD4B7','#9EC7EB','#C3A9E8','#E9A9C4']
    : frame.finish === 'pearl'
      ? [mixHex(color,'#FFFFFF',.58),mixHex(color,'#D9D2E8',.32),mixHex(color,'#FFFFFF',.78)]
      : frame.finish === 'metallic'
        ? [mixHex(color,'#FFFFFF',.42),mixHex(color,'#8A806F',.18),mixHex(color,'#FFFFFF',.62)]
        : [color,second,third,color];
  const count = 24;
  const radius = 46;
  const svg = Array.from({length: count}, (_, i) => {
    const angle = (360 / count) * i - 90;
    const position = i / (count - 1);
    const motifColor = frame.finish === 'gradient' || frame.finish === 'pastel-rainbow'
      ? colorAt(palette, position)
      : frame.finish === 'pearl' || frame.finish === 'metallic'
        ? palette[i % palette.length]
        : frame.finish === 'soft-neon' ? color : palette[i % palette.length];
    const delay = (i * 0.16).toFixed(2);
    const animated = frame.motion !== 'none'
      ? ' class="avatar-frame-motif" style="animation-delay:-' + delay + 's"'
      : '';
    return '<g' + animated + ' transform="translate(50 50) rotate(' + angle + ') translate(0 -' + radius + ')">' + motif(frame.model, motifColor, i) + '</g>';
  }).join('');
  const motionCss = '@keyframes avatar-motif-wave{0%,100%{opacity:.58;filter:brightness(.96)}50%{opacity:1;filter:brightness(1.18)}}' +
    '@keyframes avatar-motif-twinkle{0%,100%{opacity:.72;filter:brightness(.96)}50%{opacity:1;filter:brightness(1.2)}}' +
    '@keyframes avatar-motif-breathe{0%,100%{opacity:.62}50%{opacity:1}}' +
    '@keyframes avatar-motif-glint{0%,100%{filter:brightness(1) drop-shadow(0 0 0 transparent)}50%{filter:brightness(1.35) drop-shadow(0 0 2px currentColor)}}' +
    '@keyframes avatar-motif-rainbow{0%{filter:hue-rotate(0deg)}50%{filter:hue-rotate(35deg)}100%{filter:hue-rotate(0deg)}}' +
    '@keyframes avatar-motif-sparkle{0%,100%{opacity:.66}35%{opacity:1;filter:brightness(1.35)}55%{opacity:.78}72%{opacity:1;filter:brightness(1.2)}}';
  const motion = frame.motion === 'soft-pulse' || frame.motion === 'soft-breathe' ? 'avatar-motif-breathe 3.8s ease-in-out infinite' :
    frame.motion === 'soft-glow' ? 'avatar-motif-glint 4.6s ease-in-out infinite' :
    frame.motion === 'color-shift' || frame.motion === 'rainbow-wave' ? 'avatar-motif-rainbow 8s ease-in-out infinite' :
    frame.motion === 'soft-shimmer' || frame.motion === 'glint' ? 'avatar-motif-glint 5.5s ease-in-out infinite' :
    frame.motion === 'color-wave' ? 'avatar-motif-wave 3.6s ease-in-out infinite' :
    frame.motion === 'twinkle' ? 'avatar-motif-twinkle 3.2s ease-in-out infinite' :
    frame.motion === 'sparkle-wave' ? 'avatar-motif-sparkle 4.2s ease-in-out infinite' : undefined;
  const stroke = frame.finish === 'soft-neon' ? 'drop-shadow(0 0 2px ' + color + ') drop-shadow(0 0 4px ' + color + ')' :
    frame.finish === 'pearl' ? 'drop-shadow(0 0 1px #fff)' :
    frame.finish === 'metallic' ? 'drop-shadow(0 0 1px #D8C29A)' : undefined;
  return <span className={'relative inline-flex items-center justify-center rounded-full ' + className} style={{width:size,height:size,flex:'0 0 auto'}}>
    <style>{motionCss + '.avatar-frame-motif{' + (motion ? 'animation:' + motion + ';' : '') + '}@media(prefers-reduced-motion:reduce){.avatar-frame-motif{animation:none!important}}'}</style>
    <span className="absolute inset-0 rounded-full overflow-hidden" style={{filter:stroke}} dangerouslySetInnerHTML={{__html:'<svg class="avatar-frame-svg" viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">' + svg + '</svg>'}} />
    <span className="relative z-10 rounded-full overflow-hidden" style={{width:'76%',height:'76%'}}>{children}</span>
  </span>;
}
