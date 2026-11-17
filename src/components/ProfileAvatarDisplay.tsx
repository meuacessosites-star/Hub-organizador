import React from 'react';
import type { Profile } from '../types';
import { AvatarFrame } from './AvatarFrame';
import { SmartImage } from './SmartImage';

/** Mesma moldura da conta salva, identificada pelo ID, inclusive quando nomes coincidem. */
export function ProfileAvatarDisplay({ profile, size = 40 }: { profile: Profile; size?: number }) {
  const avatar = profile.avatar;
  const isImage = avatar.type === 'image' || !!(avatar.value && /^(https?:|data:|blob:|\/)/i.test(avatar.value));
  const background = isImage ? 'transparent' : avatar.bgColor || (avatar.type === 'color' && avatar.value.startsWith('#') ? avatar.value : '#4f46e5');
  const initials = profile.name ? profile.name.slice(0, 2).toUpperCase() : 'PF';

  return (
    <AvatarFrame profileId={profile.id} settings={profile.avatarFrame} size={size} className="shrink-0">
      <span className="w-full h-full rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden"
        style={{ backgroundColor: background }}>
        {avatar.type === 'emoji' && avatar.value ? avatar.value : isImage && avatar.value ? (
          <SmartImage src={avatar.value} alt={profile.name} className="w-full h-full object-cover rounded-full"
            style={{ transform: `scale(${avatar.zoom || 1})` }}
            fallbackIcon={<span>{initials}</span>} />
        ) : initials}
      </span>
    </AvatarFrame>
  );
}
