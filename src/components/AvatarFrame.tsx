import React from 'react';
import type { ReactNode } from 'react';

export type AvatarFrameModel =
  | 'micro-hearts' | 'open-hearts' | 'petals' | 'petal-outline' | 'droplets'
  | 'pearls' | 'pearls-alternating' | 'mini-links' | 'open-links' | 'moons'
  | 'tiny-stars' | 'sparkles' | 'diamonds' | 'diamond-outline' | 'mini-arches'
  | 'arches-alternating' | 'tiny-waves' | 'seeds' | 'clovers' | 'tiny-flowers'
  | 'flower-outline' | 'tiny-bows' | 'light-dots' | 'micro-dashes' | 'tiny-leaves';

export type AvatarFrameFinish = 'solid' | 'gradient' | 'pastel-rainbow' | 'soft-neon' | 'pearl' | 'metallic';
export type AvatarFrameMotion = 'none' | 'soft-pulse' | 'soft-glow' | 'color-shift' | 'soft-shimmer';

export interface AvatarFrameSettings {
  model: AvatarFrameModel;
  finish: AvatarFrameFinish;
  colors: string[];
  motion: AvatarFrameMotion;
}

const MODELS: AvatarFrameModel[] = [
  'micro-hearts','open-hearts','petals','petal-outline','droplets','pearls','pearls-alternating',
  'mini-links','open-links','moons','tiny-stars','sparkles','diamonds','diamond-outline',
  'mini-arches','arches-alternating','tiny-waves','seeds','clovers','tiny-flowers',
  'flower-outline','tiny-bows','light-dots','micro-dashes','tiny-leaves'
];
const PALETTES = [
  ['#E7A2BD'], ['#A99AE8'], ['#80B9E9'], ['#79C9AD'], ['#D9B77E'],
  ['#E9A4A4'], ['#8ECBCB'], ['#C7A4E5'], ['#E6B4D1'], ['#A8B8D8']
];

export function defaultAvatarFrame(profileId: string): AvatarFrameSettings {
  let hash = 0;
  for (let i = 0; i < profileId.length; i++) hash = (hash * 31 + profileId.charCodeAt(i)) >>> 0;
  return {
    model: MODELS[hash % MODELS.length],
    finish: 'solid',
    colors: PALETTES[Math.floor(hash / MODELS.length) % PALETTES.length],
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
  }
}

export function AvatarFrame({ profileId, settings, children, className = '', size = 48 }: {
  profileId: string; settings?: AvatarFrameSettings; children: ReactNode; className?: string; size?: number;
}) {
  const frame = settings || defaultAvatarFrame(profileId);
  const color = frame.colors?.[0] || '#A99AE8';
  const second = frame.colors?.[1] || color;
  const gradient = frame.finish === 'gradient' || frame.finish === 'pastel-rainbow' || frame.finish === 'color-shift';
  const colors = frame.finish === 'pastel-rainbow'
    ? ['#E9A9C4','#E9D49B','#9BD4B7','#9EC7EB','#C3A9E8']
    : [color, second, frame.colors?.[2] || second];
  const count = 24;
  const radius = 46;
  const svg = Array.from({length: count}, (_, i) => {
    const angle = (360 / count) * i - 90;
    const c = colors[i % colors.length];
    return '<g transform="translate(50 50) rotate(' + angle + ') translate(0 -' + radius + ')">' + motif(frame.model, c, i) + '</g>';
  }).join('');
  const style: React.CSSProperties = {
    width: size, height: size, flex: '0 0 auto',
    animation: frame.motion === 'soft-pulse' ? 'avatar-frame-pulse 4s ease-in-out infinite' :
      frame.motion === 'soft-glow' ? 'avatar-frame-glow 4.5s ease-in-out infinite' :
      frame.motion === 'color-shift' ? 'avatar-frame-colors 12s ease-in-out infinite' :
      frame.motion === 'soft-shimmer' ? 'avatar-frame-shimmer 6s ease-in-out infinite' : undefined
  };
  const stroke = frame.finish === 'soft-neon' ? 'drop-shadow(0 0 2px ' + color + ')' :
    frame.finish === 'pearl' ? 'drop-shadow(0 0 1px #fff)' :
    frame.finish === 'metallic' ? 'drop-shadow(0 0 1px #D8C29A)' : undefined;
  return <span className={'relative inline-flex items-center justify-center rounded-full ' + className} style={style}>
    <style>{'@keyframes avatar-frame-pulse{0%,100%{opacity:.78}50%{opacity:1}}@keyframes avatar-frame-glow{0%,100%{filter:drop-shadow(0 0 1px currentColor)}50%{filter:drop-shadow(0 0 4px currentColor)}}@keyframes avatar-frame-colors{0%,100%{filter:hue-rotate(0deg)}50%{filter:hue-rotate(35deg)}}@keyframes avatar-frame-shimmer{0%,100%{opacity:.78}50%{opacity:1}}@media(prefers-reduced-motion:reduce){.avatar-frame-svg{animation:none!important}}'}</style>
    <span className="absolute inset-0 rounded-full overflow-hidden" style={{filter: stroke}} dangerouslySetInnerHTML={{__html:'<svg class="avatar-frame-svg" viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="avatar-frame-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="' + colors[0] + '"/><stop offset="50%" stop-color="' + colors[1] + '"/><stop offset="100%" stop-color="' + colors[2] + '"/></linearGradient></defs>' + (gradient ? '<circle cx="50" cy="50" r="47.5" fill="none" stroke="url(#avatar-frame-gradient)" stroke-width="1"/>' : '') + svg + '</svg>'}} />
    <span className="relative z-10 rounded-full overflow-hidden" style={{width:'76%',height:'76%'}}>{children}</span>
  </span>;
}
