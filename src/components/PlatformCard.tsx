import { safeUrl } from "../lib/utils";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Platform, Profile, Purchase, PurchaseStatus, Tag as TagType, Status } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { AvatarFrame } from './AvatarFrame';
import {
  ChevronDown,
  ChevronUp,
  User,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Trash2,
  Calendar,
  Tag,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Lock,
  FileText,
  Globe,
  CreditCard,
  ShoppingBag,
  Mail,
  Square,
  CheckSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FullScreenCarousel } from './FullScreenCarousel';
import { getInitials, getPlatformColor, getDomainFromInput, getLogoUrl } from '../utils/logoHelper';
import { SmartImage, preloadImages } from './SmartImage';

const formatImageUrl = (url: string) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (trimmed.startsWith('/api/proxy-image?url=')) {
    return trimmed;
  }

  if (trimmed.startsWith('https://corsproxy.io/?')) {
    const extracted = decodeURIComponent(trimmed.replace('https://corsproxy.io/?', ''));
    if (extracted && (extracted.includes('amazon') || extracted.includes('media-amazon') || extracted.includes('ssl-images-amazon') || extracted.includes('unsplash'))) {
      return extracted;
    }
    return trimmed;
  }

  let rawUrl = trimmed;
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    if (rawUrl.startsWith('//')) {
      rawUrl = `https:${rawUrl}`;
    } else {
      const cleanHash = rawUrl.replace(/^\/?(file\/)?/, '');
      rawUrl = `https://down-br.img.susercontent.com/file/${cleanHash}`;
    }
  }

  // Direct URLs for Amazon, Unsplash, and standard images
  if (
    rawUrl.includes('amazon') ||
    rawUrl.includes('media-amazon') ||
    rawUrl.includes('ssl-images-amazon') ||
    rawUrl.includes('unsplash.com')
  ) {
    return rawUrl;
  }

  // Proxy for Shopee CDN images
  if (rawUrl.includes('susercontent.com') || rawUrl.includes('shopee')) {
    return `/api/proxy-image?url=${encodeURIComponent(rawUrl)}`;
  }

  return rawUrl;
};

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  const currentSrc = target.src || '';

  if (currentSrc.includes('/api/proxy-image?url=')) {
    const raw = decodeURIComponent(currentSrc.split('/api/proxy-image?url=')[1] || '');
    if (raw) {
      target.src = `https://corsproxy.io/?${encodeURIComponent(raw)}`;
      return;
    }
  } else if (currentSrc.includes('corsproxy.io/?')) {
    const raw = decodeURIComponent(currentSrc.split('corsproxy.io/?')[1] || '');
    if (raw) {
      target.src = `https://wsrv.nl/?url=${encodeURIComponent(raw)}`;
      return;
    }
  } else if (currentSrc.includes('wsrv.nl/?url=')) {
    const raw = decodeURIComponent(currentSrc.split('wsrv.nl/?url=')[1] || '');
    if (raw) {
      target.src = raw;
      return;
    }
  } else if (currentSrc.startsWith('http') && !currentSrc.startsWith('data:')) {
    target.src = `/api/proxy-image?url=${encodeURIComponent(currentSrc)}`;
    return;
  }

  target.style.opacity = '0.3';
};

interface PlatformCardProps {
  platform: Platform;
  categoryName: string;
  categoryIcon: string;
  tags: TagType[]; // Use TagType
  availableStatuses: Status[];
  onAddProfile: (platformId: string) => void;
  onEditProfile: (platformId: string, profile: Profile, startInEditMode?: boolean, openFrameCustomizer?: boolean) => void;
  onDeletePlatform: (platformId: string) => void;
  onDeleteProfile: (platformId: string, profileId: string) => void;
  onAddPurchase: (platformId: string) => void;
  onViewPurchase: (platformId: string, purchase: Purchase) => void;
  onEditPurchase: (platformId: string, purchase: Purchase) => void;
  onGoToPurchaseInPanel?: (purchase: Purchase) => void;
  searchQuery?: string;
  activeMatchProfileId?: string;
  currentUserUid?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const highlightText = (text: string, highlight?: string) => {
  if (!highlight || !highlight.trim()) return <span>{text}</span>;
  const cleanHighlight = highlight.trim().toLowerCase();
  const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === cleanHighlight ? (
          <mark key={`hl-${i}`} className="bg-yellow-200 text-neutral-900 font-bold px-0.5 rounded dark:bg-amber-500/35 dark:text-amber-200">
            {part}
          </mark>
        ) : (
          <span key={`txt-${i}`}>{part}</span>
        )
      )}
    </>
  );
};

export const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  categoryName,
  categoryIcon,
  tags,
  availableStatuses,
  onAddProfile,
  onEditProfile,
  onDeletePlatform,
  onDeleteProfile,
  onAddPurchase,
  onViewPurchase,
  onEditPurchase,
  onGoToPurchaseInPanel,
  searchQuery = '',
  activeMatchProfileId = '',
  currentUserUid,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  // SECURE RESOURCE AUTHORIZATION CHECK: Return 403 Permissão Negada with NO sensitive fields if ownership is breached
  if (!currentUserUid || (platform.ownerId && platform.ownerId !== currentUserUid)) {
    return (
      <div className="bg-red-50 dark:bg-red-950/10 border border-red-200/60 dark:border-red-900/30 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
        <Lock className="w-8 h-8 text-red-500" />
        <h3 className="font-bold text-red-700 dark:text-red-400 text-sm">403 - Permissão Negada</h3>
        <p className="text-xs text-red-650 dark:text-red-400/80 max-w-xs">
          Você não possui autorização para visualizar os detalhes desta plataforma. Os dados sensíveis foram protegidos.
        </p>
      </div>
    );
  }

  const [isExpanded, setIsExpanded] = useState(() => platform.id.startsWith('demo-'));

  const cycleStatus = (e: React.MouseEvent, purchase: Purchase) => {
    e.stopPropagation();
    const sequence = availableStatuses.map(s => s.id);
    const currentIndex = sequence.indexOf(purchase.status as any);
    
    const nextIndex = (currentIndex + 1) % sequence.length;
    const nextStatus = sequence[nextIndex];

    const updatedPurchase = { 
      ...purchase, 
      status: nextStatus,
      deliveryDate: nextIndex === sequence.length - 1 && !purchase.deliveryDate 
        ? new Date().toISOString().substring(0, 10) 
        : purchase.deliveryDate
    };
    
    onEditPurchase(platform.id, updatedPurchase);
  };

  const cycleBundleItemStatus = (e: React.MouseEvent, purchase: Purchase, itemIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!purchase.bundleItems) return;
    const sequence = availableStatuses.map(s => s.id);
    const item = purchase.bundleItems[itemIndex];
    const currentIndex = sequence.indexOf((item.status || 'pedido_feito') as any);
    const nextIndex = (currentIndex + 1) % sequence.length;
    const nextStatus = sequence[nextIndex];

    const updatedBundleItems = [...purchase.bundleItems];
    updatedBundleItems[itemIndex] = {
      ...item,
      status: nextStatus
    };

    const updatedPurchase = {
      ...purchase,
      bundleItems: updatedBundleItems
    };
    
    onEditPurchase(platform.id, updatedPurchase);
  };
  const [activeTab, setActiveTab] = useState<'contas' | 'compras'>('contas');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [useGoogleFallback, setUseGoogleFallback] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [collapsedProfiles, setCollapsedProfiles] = useState<Record<string, boolean>>({});
  const [fullScreenCarousel, setFullScreenCarousel] = useState<{images: string[]; initialIndex: number} | null>(null);

  const openFullScreen = (images: string[], index: number) => {
    setFullScreenCarousel({ images, initialIndex: index });
  };

  const isAllCollapsed = platform.profiles.length > 0 && platform.profiles.every((p) => collapsedProfiles[p.id]);

  const handleToggleAllProfiles = () => {
    if (isAllCollapsed) {
      setCollapsedProfiles({});
    } else {
      const newCollapsed: Record<string, boolean> = {};
      platform.profiles.forEach((p) => {
        newCollapsed[p.id] = true;
      });
      setCollapsedProfiles(newCollapsed);
    }
  };

  const toggleProfileCollapse = (profileId: string) => {
    setCollapsedProfiles((prev) => ({
      ...prev,
      [profileId]: !prev[profileId],
    }));
  };

  React.useEffect(() => {
    setImageError(false);
    setUseGoogleFallback(false);
    setShowDeleteConfirm(false);
    setDeletingProfileId(null);

    // Preload logo, profile avatars, and purchase images
    const imagesToPreload: string[] = [];
    if (platform.logoUrl) imagesToPreload.push(platform.logoUrl);
    (platform.profiles || []).forEach((p) => {
      if (p.avatar?.type === 'image' && p.avatar.value) {
        imagesToPreload.push(p.avatar.value);
      }
    });
    (platform.purchases || []).forEach((p) => {
      if (p.image) imagesToPreload.push(p.image);
      if (p.images && Array.isArray(p.images)) {
        p.images.forEach((img) => {
          if (img) imagesToPreload.push(img);
        });
      }
    });
    preloadImages(imagesToPreload);
  }, [platform.logoUrl, platform.name, platform.url, platform.profiles, platform.purchases]);

  // Auto-expand any profiles matching the search query
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchingProfileIds = platform.profiles.filter((prof) => {
        const platNameMatch = platform.name.toLowerCase().includes(q);
        const profNameMatch = prof.name.toLowerCase().includes(q);
        const usernameMatch = prof.username?.toLowerCase().includes(q) || false;
        const emailMatch = prof.email?.toLowerCase().includes(q) || false;
        const descMatch = prof.description?.toLowerCase().includes(q) || false;
        const linkMatch = prof.accessLink?.toLowerCase().includes(q) || false;
        return platNameMatch || profNameMatch || usernameMatch || emailMatch || descMatch || linkMatch;
      }).map((p) => p.id);

      if (matchingProfileIds.length > 0) {
        setIsExpanded(true);
        setCollapsedProfiles((prev) => {
          const updated = { ...prev };
          matchingProfileIds.forEach((id) => {
            updated[id] = false; // Expand profile
          });
          return updated;
        });
      }
    }
  }, [searchQuery, platform.name, platform.profiles]);

  // Ensure active match profile is expanded and platform card is open
  React.useEffect(() => {
    if (activeMatchProfileId) {
      const hasActiveMatch = platform.profiles.some((p) => p.id === activeMatchProfileId);
      if (hasActiveMatch) {
        setIsExpanded(true);
        setCollapsedProfiles((prev) => ({
          ...prev,
          [activeMatchProfileId]: false, // Expand active profile
        }));
      }
    }
  }, [activeMatchProfileId, platform.profiles]);

  const isSystemGeneratedLogo = (url?: string | null): boolean => {
    if (!url) return true;
    return (
      url.includes('logo.clearbit.com') ||
      url.includes('t3.gstatic.com/favicon') ||
      url.includes('s2/favicons') ||
      url.includes('simpleicons.org') ||
      url.includes('unavatar.io') ||
      url.includes('vectorlogo.zone') ||
      url.includes('iconfinder.com')
    );
  };

  const currentLogoUrl = !platform.logoUrl || isSystemGeneratedLogo(platform.logoUrl)
    ? getLogoUrl(platform.name, platform.url, useGoogleFallback ? 1 : 0)
    : platform.logoUrl;

  const handleLogoError = () => {
    if (!useGoogleFallback && !currentLogoUrl.startsWith('data:')) {
      setUseGoogleFallback(true);
    } else {
      setImageError(true);
    }
  };

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getStatusLabel = (statusId: string) => {
    return availableStatuses.find(s => s.id === statusId)?.label || statusId;
  };

  const getStatusColor = (statusId: string) => {
    return availableStatuses.find(s => s.id === statusId)?.color || '#94a3b8';
  };

  return (
    <div
      id={`platform-card-${platform.id}`}
      data-testid={`platform-card-${platform.id}`}
      className={`bg-white dark:bg-[#121212] border rounded-2xl overflow-hidden transition-all duration-500 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-md dark:hover:shadow-[0_12px_48px_rgba(0,0,0,0.7)] hover:border-neutral-300 dark:hover:border-white/[0.12] group ${
        isSelectionMode && isSelected
          ? 'ring-2 ring-indigo-500/50 border-indigo-500 dark:border-indigo-500/70'
          : 'border-neutral-200 dark:border-white/[0.06]'
      }`}
    >
      {/* Card Header (always visible) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-6 flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-neutral-50 dark:hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-4">
          {isSelectionMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect?.();
              }}
              className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
              title={isSelected ? "Desmarcar" : "Selecionar"}
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Square className="w-5 h-5 text-neutral-305 dark:text-neutral-600" />
              )}
            </button>
          )}

          {/* Logo container - Standardized App Icon Style (Squircle) */}
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#141414] flex items-center justify-center overflow-hidden shrink-0 shadow-xs dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] border border-neutral-200 dark:border-white/10 group-hover:scale-105 transition-all duration-500">
            {currentLogoUrl && !imageError ? (
              <SmartImage
                src={currentLogoUrl}
                alt={platform.name}
                className="w-full h-full object-contain p-1.5 pointer-events-none transition-transform duration-700 group-hover:scale-110"
                onError={handleLogoError}
                fallbackIcon={
                  <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-100 font-extrabold text-[14px] tracking-tight">
                    {getInitials(platform.name)}
                  </div>
                }
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-100 font-extrabold text-[14px] tracking-tight">
                {getInitials(platform.name)}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-0.5">
            <h3 className="font-sans font-bold text-base text-neutral-900 dark:text-white tracking-tight leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {highlightText(platform.name, searchQuery)}
            </h3>
            <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 font-medium">
              <span className="text-[11px] tracking-wide">
                {platform.profiles.length} {platform.profiles.length === 1 ? 'conta' : 'contas'}
              </span>
              {platform.purchases.length > 0 && (
                <>
                  <span className="text-neutral-300 dark:text-neutral-700 text-[10px]">•</span>
                  <span className="text-[11px] tracking-wide">
                    {platform.purchases.length} {platform.purchases.length === 1 ? 'compra' : 'compras'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button className="text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-400 transition-colors p-1 cursor-pointer">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Card Bottom Panel (always visible when collapsed) */}
      <AnimatePresence initial={false}>
        {!isExpanded && (
          <div className="px-5 pb-5 pt-4 flex items-center justify-between border-t border-neutral-100/50 dark:border-white/[0.04] mt-1 select-none">
            {/* Category badge - Pill style */}
            <div
              id={`platform-card-category-badge-${platform.id}`}
              data-testid={`platform-card-category-badge-${platform.id}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200/50 dark:bg-white/[0.05] dark:text-neutral-400 dark:border-white/[0.05] hover:bg-neutral-200 dark:hover:bg-white/[0.08] transition-colors"
            >
              <CategoryIcon icon={categoryIcon} className="w-3.5 h-3.5" />
              <span data-testid={`platform-card-category-name-${platform.id}`}>{categoryName}</span>
            </div>

            {/* Profile Avatars indicators */}
            <div className="flex items-center -space-x-2 overflow-hidden">
              {platform.profiles.map((profile, prIdx) => (
                <AvatarFrame
                  key={`p-avatar-${platform.id}-${profile.id}-${prIdx}`}
                  profileId={profile.id}
                  settings={profile.avatarFrame}
                  size={30}
                  className="cursor-pointer hover:z-10 transition-transform hover:scale-110"
                >
                <div
                  title={`${profile.name} (${profile.email || profile.username || ''})`}
                  className="w-full h-full rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 uppercase overflow-hidden"
                  style={{
                    backgroundColor:
                      (profile.avatar.type === 'image' || (profile.avatar.value && (profile.avatar.value.startsWith('http') || profile.avatar.value.startsWith('data:') || profile.avatar.value.startsWith('blob:') || profile.avatar.value.startsWith('/')))) && profile.avatar.value
                        ? 'transparent'
                        : profile.avatar.bgColor || (profile.avatar.type === 'color' ? profile.avatar.value : '#3b82f6'),
                  }}
                >
                  {(() => {
                    const av = profile.avatar;
                    const isImg = av?.type === 'image' || (av?.value && (
                      av.value.startsWith('http') ||
                      av.value.startsWith('data:') ||
                      av.value.startsWith('blob:') ||
                      av.value.startsWith('/')
                    ));
                    const isEmoji = av?.type === 'emoji' || (!isImg && !av?.value?.startsWith('#') && av?.value && av.value.length <= 8);
                    if (isImg && av?.value) {
                      return (
                        <SmartImage
                          src={av.value}
                          alt={profile.name}
                          className="w-full h-full object-cover rounded-full"
                          style={{ transform: `scale(${av.zoom || 1})` }}
                        />
                      );
                    }
                    if (isEmoji && av?.value) {
                      return av.value;
                    }
                    return profile.name.slice(0, 2).toUpperCase();
                  })()}
                </div>
                </AvatarFrame>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Expanded Actions/Tabs Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-neutral-200 dark:border-[#232534]"
          >
            {/* TAB SELECTOR */}
            <div className="flex border-b border-neutral-200 bg-neutral-50 px-5 select-none dark:border-white/[0.04] dark:bg-[#1c1c1c]">
              <button
                id={`platform-contas-tab-${platform.id}`}
                data-testid={`platform-contas-tab-${platform.id}`}
                role="tab"
                aria-selected={activeTab === 'contas'}
                aria-label={`Contas ${(platform.profiles || []).length}`}
                onClick={() => setActiveTab('contas')}
                className={`py-3 px-5 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all relative cursor-pointer ${
                  activeTab === 'contas'
                    ? 'border-indigo-500 text-indigo-500 dark:text-indigo-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300'
                }`}
              >
                Contas ({(platform.profiles || []).length})
              </button>
              <button
                id={`platform-compras-tab-${platform.id}`}
                data-testid={`platform-compras-tab-${platform.id}`}
                role="tab"
                aria-selected={activeTab === 'compras'}
                aria-label={`Compras ${(platform.purchases || []).length}`}
                onClick={() => setActiveTab('compras')}
                className={`py-3 px-5 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all relative cursor-pointer ${
                  activeTab === 'compras'
                    ? 'border-indigo-500 text-indigo-500 dark:text-indigo-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300'
                }`}
              >
                Compras ({(platform.purchases || []).length})
              </button>
            </div>

            {/* TAB CONTENT: CONTAS */}
            {activeTab === 'contas' && (
              <div className="p-4 flex flex-col gap-3.5">
                {platform.profiles.length === 0 ? (
                  <div className="text-center py-6 text-xs text-neutral-500 select-none dark:text-neutral-300">
                    Nenhum perfil cadastrado.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {/* Header bar with toggle all button */}
                    <div className="flex items-center justify-between px-1 pb-1 select-none border-b border-neutral-100/30 dark:border-neutral-800/20">
                      <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-300 uppercase tracking-wider">
                        Contas Cadastradas
                      </span>
                      <button
                        onClick={handleToggleAllProfiles}
                        className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-all cursor-pointer bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30 hover:shadow-sm"
                      >
                        {isAllCollapsed ? (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            <span>Expandir Tudo</span>
                          </>
                        ) : (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            <span>Recolher Tudo</span>
                          </>
                        )}
                      </button>
                    </div>

                    {platform.profiles.map((profile, prIdx) => {
                      const isCollapsed = !!collapsedProfiles[profile.id];
                      const isActiveMatch = profile.id === activeMatchProfileId;
                      return (
                        <div
                          key={`p-card-${platform.id}-${profile.id}-${prIdx}`}
                          id={`profile-card-${profile.id}`}
                          className={`relative overflow-hidden rounded-xl bg-neutral-100/50 dark:bg-[#141414] group/profile shadow-inner transition-all duration-200 ${
                            isActiveMatch
                              ? 'ring-2 ring-indigo-500/40 dark:ring-indigo-500/60 shadow-md shadow-indigo-500/10'
                              : ''
                          }`}
                        >
                          {/* Background Reveal Actions */}
                          <div className="absolute inset-y-0 right-0 flex items-stretch py-1.5 pr-2 gap-1.5 z-0 select-none">
                            {deletingProfileId === profile.id ? (
                              <div className="flex items-center bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-lg px-2.5 gap-1.5 animate-fade-in">
                                <span className="text-[10px] font-semibold text-rose-500 px-0.5 leading-none">Excluir?</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteProfile(platform.id, profile.id);
                                    setDeletingProfileId(null);
                                  }}
                                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-bold cursor-pointer transition-all shadow-sm"
                                >
                                  Sim
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingProfileId(null);
                                  }}
                                  className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[9px] font-bold cursor-pointer hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  id={`edit-profile-btn-${profile.id}`}
                                  data-testid={`edit-profile-btn-${profile.id}`}
                                  onClick={() => onEditProfile(platform.id, profile, true)}
                                  className="px-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer shadow-md shadow-indigo-500/10 w-16"
                                  title={`Editar conta ${profile.name}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-center">Editar Conta</span>
                                </button>

                                <button
                                  id={`delete-profile-trigger-${profile.id}`}
                                  data-testid={`delete-profile-trigger-${profile.id}`}
                                  onClick={() => setDeletingProfileId(profile.id)}
                                  className="px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer shadow-md shadow-rose-600/10 w-16"
                                  title={`Excluir conta ${profile.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-center">Excluir Conta</span>
                                </button>
                              </>
                            )}
                          </div>

                          {/* Draggable Front Card */}
                          <motion.div
                            drag="x"
                            dragConstraints={{ left: -140, right: 0 }}
                            dragElastic={{ left: 0.1, right: 0.1 }}
                            dragMomentum={false}
                            className={`z-10 relative flex flex-col p-3.5 rounded-xl bg-white border transition-colors duration-150 cursor-grab active:cursor-grabbing select-none shadow-sm ${
                              isActiveMatch
                                ? 'border-indigo-500 dark:border-indigo-400 dark:bg-[#1a1a1a]'
                                : 'border-neutral-100 dark:border-transparent dark:bg-[#0d0d0d] hover:border-neutral-200 dark:hover:border-white/10'
                            } ${
                              isCollapsed ? 'gap-0' : 'gap-3'
                            }`}
                          >
                            {/* CARD HEADER: Avatar & Name & Swipe indicator */}
                            <div
                              onClick={(e) => {
                                if ((e.target as HTMLElement).closest('button')) return;
                                toggleProfileCollapse(profile.id);
                              }}
                              className={`flex items-center justify-between w-full cursor-pointer select-none transition-all ${
                                isCollapsed ? '' : 'border-b border-neutral-50 dark:border-neutral-800/20 pb-2'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                {/* Avatar: toque abre edição/personalização sem recolher o cartão */}
                                <button
                                  type="button"
                                  aria-label={`Personalizar foto e moldura de ${profile.name}`}
                                  title="Toque para personalizar foto e moldura"
                                  onPointerDownCapture={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEditProfile(platform.id, profile, false, true);
                                  }}
                                  className="shrink-0 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                >
                                  <AvatarFrame profileId={profile.id} settings={profile.avatarFrame} size={40}>
                                    <div
                                      className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold text-white uppercase shadow-inner overflow-hidden"
                                      style={{
                                        backgroundColor:
                                          (profile.avatar.type === 'image' || (profile.avatar.value && (profile.avatar.value.startsWith('http') || profile.avatar.value.startsWith('data:') || profile.avatar.value.startsWith('blob:')))) && profile.avatar.value
                                            ? 'transparent'
                                            : profile.avatar.bgColor || (profile.avatar.type === 'color' ? profile.avatar.value : '#4f46e5'),
                                      }}
                                    >
                                      {profile.avatar.type === 'emoji' && profile.avatar.value ? (
                                        profile.avatar.value
                                      ) : (profile.avatar.type === 'image' || (profile.avatar.value && (profile.avatar.value.startsWith('http') || profile.avatar.value.startsWith('data:') || profile.avatar.value.startsWith('blob:')))) && profile.avatar.value ? (
                                        <SmartImage
                                          src={profile.avatar.value}
                                          alt={profile.name}
                                          className="w-full h-full object-cover rounded-full"
                                          style={{ transform: `scale(${profile.avatar.zoom || 1})` }}
                                          fallbackIcon={
                                            <div
                                              className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold text-white uppercase"
                                              style={{ backgroundColor: profile.avatar.bgColor || '#4f46e5' }}
                                            >
                                              {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'PF'}
                                            </div>
                                          }
                                        />
                                      ) : (
                                        profile.name ? profile.name.slice(0, 2).toUpperCase() : 'PF'
                                      )}
                                    </div>
                                  </AvatarFrame>
                                </button>

                                <div>
                                  <span className="font-bold text-neutral-800 dark:text-neutral-100 text-xs tracking-wide flex items-center gap-1.5 flex-wrap">
                                    {highlightText(profile.name, searchQuery)}
                                    {isActiveMatch && (
                                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-[8px] font-extrabold uppercase tracking-wider animate-pulse select-none">
                                        Foco
                                      </span>
                                    )}
                                  </span>
                                  {platform.url && (
                                    <div className="flex items-center gap-1 mt-0.5 text-neutral-400 dark:text-neutral-300">
                                      <Globe className="w-2.5 h-2.5 shrink-0" />
                                      <span className="text-[9px] truncate max-w-[150px] font-medium leading-none italic">
                                        {platform.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Swipe Indicator */}
                                <div className="flex items-center gap-0.5 text-[10px] text-neutral-400 dark:text-neutral-300 font-medium animate-pulse shrink-0">
                                  <span>arrastar</span>
                                  <ChevronLeft className="w-3 h-3" />
                                </div>
                                <div className="h-4 w-[1px] bg-neutral-100 dark:bg-neutral-800" />
                                {/* Collapse state icon */}
                                {isCollapsed ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-300 hover:text-indigo-500 transition-colors" />
                                ) : (
                                  <ChevronUp className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-300 hover:text-indigo-500 transition-colors" />
                                )}
                              </div>
                            </div>

                            {/* CARD BODY: Structured information blocks with custom highlights */}
                            {!isCollapsed && (
                              <div className="flex flex-col gap-2 w-full">
                                {/* E-MAIL BLOCK */}
                                {profile.email && (
                                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100/70 dark:border-sky-900/30 text-sky-900 dark:text-sky-300">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <Mail className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[9px] text-sky-600 dark:text-sky-300 block font-bold uppercase tracking-wider leading-none">E-mail</span>
                                        <span className="text-xs font-semibold block truncate mt-0.5 select-all">{highlightText(profile.email, searchQuery)}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(profile.id + '-email', profile.email || '', e);
                                      }}
                                      className="p-1 rounded bg-white dark:bg-[#1a1b26] border border-sky-200/40 dark:border-sky-900/40 hover:bg-sky-100/50 dark:hover:bg-sky-900/30 text-sky-600 dark:text-sky-400 transition-all shadow-sm shrink-0 cursor-pointer"
                                      title="Copiar e-mail"
                                    >
                                      {copiedId === profile.id + '-email' ? (
                                        <Check className="w-3 h-3 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                )}

                                {/* USERNAME BLOCK */}
                                {profile.username && (
                                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100/70 dark:border-sky-900/30 text-sky-900 dark:text-sky-300">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <User className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[9px] text-sky-600 dark:text-sky-300 block font-bold uppercase tracking-wider leading-none">Usuário</span>
                                        <span className="text-xs font-semibold block truncate mt-0.5 select-all">{highlightText(profile.username, searchQuery)}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(profile.id + '-username', profile.username || '', e);
                                      }}
                                      className="p-1 rounded bg-white dark:bg-[#1a1b26] border border-sky-200/40 dark:border-sky-900/40 hover:bg-sky-100/50 dark:hover:bg-sky-900/30 text-sky-600 dark:text-sky-400 transition-all shadow-sm shrink-0 cursor-pointer"
                                      title="Copiar usuário"
                                    >
                                      {copiedId === profile.id + '-username' ? (
                                        <Check className="w-3 h-3 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                )}

                                {/* PASSWORD BLOCK */}
                                {profile.password && (
                                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/70 dark:border-amber-900/30 text-amber-950 dark:text-amber-300">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[9px] text-amber-600 dark:text-amber-300 block font-bold uppercase tracking-wider leading-none">Senha</span>
                                        <span className="text-xs font-mono font-bold block mt-0.5 truncate tracking-wider">
                                          {visiblePasswords[profile.id] ? profile.password : '••••••••'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {/* Toggle Visibility (Eye) */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setVisiblePasswords((prev) => ({
                                            ...prev,
                                            [profile.id]: !prev[profile.id],
                                          }));
                                        }}
                                        className="p-1 rounded bg-white dark:bg-[#1a1b26] border border-amber-200/40 dark:border-amber-900/40 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 transition-all shadow-sm cursor-pointer"
                                        title={visiblePasswords[profile.id] ? "Ocultar senha" : "Ver senha"}
                                      >
                                        {visiblePasswords[profile.id] ? (
                                          <EyeOff className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                                        ) : (
                                          <Eye className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                                        )}
                                      </button>
                                      {/* Copy Password */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopy(profile.id + '-password', profile.password || '', e);
                                        }}
                                        className="p-1 rounded bg-white dark:bg-[#1a1b26] border border-amber-200/40 dark:border-amber-900/40 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 transition-all shadow-sm cursor-pointer"
                                        title="Copiar senha"
                                      >
                                        {copiedId === profile.id + '-password' ? (
                                          <Check className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}


                                {profile.accessLink && (
                                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/70 dark:border-indigo-900/30 text-indigo-900 dark:text-indigo-300">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <Globe className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[9px] text-indigo-600 dark:text-indigo-300 block font-bold uppercase tracking-wider leading-none">Link de Acesso</span>
                                        <span className="text-xs font-semibold block truncate mt-0.5 select-all">{highlightText(profile.accessLink, searchQuery)}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopy(profile.id + '-access-link', profile.accessLink || '', e);
                                        }}
                                        className="p-1 rounded bg-white dark:bg-[#1a1b26] border border-indigo-200/40 dark:border-indigo-900/40 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-all shadow-sm shrink-0 cursor-pointer"
                                        title="Copiar link"
                                      >
                                        {copiedId === profile.id + '-access-link' ? (
                                          <Check className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                      <a
                                        href={safeUrl(profile.accessLink)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1 rounded bg-white dark:bg-[#1a1b26] border border-indigo-200/40 dark:border-indigo-900/40 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-all shadow-sm shrink-0 cursor-pointer"
                                        title="Abrir link"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                )}

                                {/* DESCRIPTION / NOTES BLOCK */}
                                {profile.description && (
                                  <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-white/10 text-neutral-600 dark:text-neutral-200 border-l-2 border-l-indigo-500 dark:border-l-indigo-400">
                                    <div className="flex gap-1.5">
                                      <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                                      <div>
                                        <span className="text-[9px] text-neutral-400 dark:text-neutral-300 block uppercase tracking-wider font-semibold leading-none">Rascunho / Notas</span>
                                        <p className="text-[11px] italic leading-relaxed mt-1">{highlightText(profile.description, searchQuery)}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Account card bottom footer actions */}
                <div className="flex items-center justify-between border-t border-neutral-200 dark:border-[#232534] pt-3 select-none">
                  <button
                    id={`add-profile-btn-${platform.id}`}
                    data-testid={`add-profile-btn-${platform.id}`}
                    aria-label={`Adicionar conta na plataforma ${platform.name}`}
                    onClick={() => onAddProfile(platform.id)}
                    className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar conta</span>
                  </button>

                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2 animate-fade-in bg-rose-500/5 dark:bg-rose-500/10 p-1 rounded-lg border border-rose-500/20">
                      <span className="text-[10px] font-semibold text-rose-500 px-1">Excluir?</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePlatform(platform.id);
                          setShowDeleteConfirm(false);
                        }}
                        className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-bold transition-all cursor-pointer"
                      >
                        Sim
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(false);
                        }}
                        className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[9px] font-semibold hover:bg-neutral-300 transition-all cursor-pointer"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      id={`delete-platform-btn-${platform.id}`}
                      data-testid={`delete-platform-btn-${platform.id}`}
                      aria-label={`Remover plataforma ${platform.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                      }}
                      className="flex items-center gap-1.5 text-rose-500 hover:text-rose-400 dark:text-rose-500 dark:hover:text-rose-400 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Excluir plataforma</span>
                    </button>
                  )}
                </div>
              </div>
            )}

              {/* TAB CONTENT: COMPRAS */}
              {activeTab === 'compras' && (
              <div className="p-4 flex flex-col gap-3.5">
                {platform.purchases.length === 0 ? (
                  <div className="p-5 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/30 text-center select-none flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-xs tracking-tight">
                        Nenhuma compra registrada
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-[240px] leading-relaxed mx-auto">
                        Organize suas compras, assinaturas e rastreios vinculados às suas contas da {platform.name}.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddPurchase(platform.id)}
                      className="mt-3.5 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer select-none transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Registrar Primeira Compra</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Informative Header Indicator */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-200/50 dark:border-neutral-800/40 text-[10px] text-neutral-500 dark:text-neutral-400 select-none">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">💡 Dica de Controle:</span> Clique em uma compra para gerenciar fotos de produtos, notas detalhadas e pacotes (bundles), ou clique diretamente no botão de status colorido para avançar a etapa da entrega!
                    </div>

                    {platform.purchases.map((purchase, purIdx) => {
                      const buyerProfile = platform.profiles.find(
                        (p) => p.id === purchase.profileId
                      );

                      // Calculate progress timeline index
                      const sequence = availableStatuses.map(s => s.id);
                      const currentStatusIndex = sequence.indexOf(purchase.status);

                      return (
                        <div
                          key={`plat-pur-${platform.id}-${purchase.id}-${purIdx}`}
                          onClick={() => onViewPurchase(platform.id, purchase)}
                          className="flex flex-col p-3.5 rounded-xl bg-neutral-50/60 border border-neutral-200/40 hover:border-neutral-300 dark:border-transparent dark:hover:border-neutral-800/40 transition-all duration-150 cursor-pointer dark:bg-[#111219] dark:hover:bg-[#151622] group/p shadow-xs"
                        >
                          <div className="flex gap-3">
                            {/* Product Image Thumbnail */}
                            {purchase.productImages && purchase.productImages.length > 0 ? (
                              <div 
                                className="w-11 h-11 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-900 flex items-center justify-center relative cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openFullScreen(purchase.productImages!, 0);
                                }}
                              >
                                <SmartImage
                                  src={purchase.productImages[0]}
                                  alt={purchase.productName}
                                  className="w-full h-full object-cover"
                                />
                                {purchase.productImages.length > 1 && (
                                  <div className="absolute bottom-0 right-0 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-tl leading-none">
                                    +{purchase.productImages.length - 1}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-neutral-100 dark:bg-[#1c1d29] border border-neutral-200/50 dark:border-transparent flex items-center justify-center shrink-0">
                                <Tag className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                              </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs truncate group-hover/p:text-indigo-600 dark:group-hover/p:text-indigo-400 transition-colors">
                                    {purchase.productName}
                                  </span>
                                  {purchase.purchaseType === 'subscription' && (
                                    <span className="text-[8px] font-black uppercase tracking-widest px-1 py-0.5 bg-purple-100 text-purple-700 border border-purple-200/50 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-850/50 rounded shrink-0">
                                      Assinatura
                                    </span>
                                  )}
                                  {purchase.productLink && (
                                    <a
                                      href={safeUrl(purchase.productLink)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1c1d29] dark:hover:bg-[#252838] text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 transition-all shrink-0 cursor-pointer"
                                      title="Ir para o produto"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    cycleStatus(e, purchase);
                                  }}
                                  className="text-[9px] px-2.5 py-1 rounded-full font-extrabold font-sans shrink-0 transition-all active:scale-90 cursor-pointer hover:brightness-110 relative z-30 shadow-md border"
                                  style={{
                                    backgroundColor: `${getStatusColor(purchase.status)}15`,
                                    borderColor: `${getStatusColor(purchase.status)}40`,
                                    color: getStatusColor(purchase.status)
                                  }}
                                  title="Clique para mudar o status da entrega"
                                >
                                  {getStatusLabel(purchase.status)}
                                </button>
                              </div>
                              
                              {/* Tracking Code / Notes */}
                              {purchase.notes && (
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-300 italic line-clamp-1 truncate mt-1">
                                  {purchase.notes}
                                </p>
                              )}

                              {/* Bundle Preview */}
                              {purchase.isBundle && purchase.bundleItems && purchase.bundleItems.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {purchase.bundleItems.slice(0, 3).map((item, idx) => {
                                    const itemStatus = item.status || 'pedido_feito';
                                    return (
                                      <span key={item.id ? `${item.id}-${idx}` : `bi-${purchase.id}-${idx}`} className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded">
                                        <button
                                          type="button"
                                          onClick={(e) => cycleBundleItemStatus(e, purchase, idx)}
                                          className="w-1.5 h-1.5 rounded-full border transition-transform hover:scale-125 cursor-pointer"
                                          style={{ backgroundColor: `${getStatusColor(itemStatus)}40`, borderColor: getStatusColor(itemStatus) }}
                                          title={`${getStatusLabel(itemStatus)} - Clique para mudar`}
                                        />
                                        {item.name || `Item ${idx + 1}`}
                                        {item.link && (
                                          <a href={safeUrl(item.link)} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-800 dark:hover:text-indigo-300" title="Ver produto">
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        )}
                                      </span>
                                    );
                                  })}
                                  {purchase.bundleItems.length > 3 && (
                                    <span className="text-[9px] px-1.5 py-0.5 text-neutral-400">+{purchase.bundleItems.length - 3}</span>
                                  )}
                                </div>
                              )}

                              {/* Tiny photos strip if more than 1 image */}
                              {purchase.productImages && purchase.productImages.length > 1 && (
                                <div className="flex gap-1 mt-1.5">
                                  {purchase.productImages.slice(1, 5).map((img, idx) => (
                                    <div 
                                      key={`p-img-strip-${purchase.id}-${idx}`} 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openFullScreen(purchase.productImages!, idx + 1);
                                      }}
                                      className="w-5 h-5 rounded border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                                      title="Ver em tela cheia"
                                    >
                                      <SmartImage
                                        src={img}
                                        alt=""
                                        className="w-full h-full object-cover pointer-events-none"
                                      />
                                    </div>
                                  ))}
                                  {purchase.productImages.length > 5 && (
                                    <div className="text-[8px] font-bold text-neutral-400 self-center pl-0.5">
                                      +{purchase.productImages.length - 5}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Tags pill list */}
                              {purchase.tags && purchase.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {purchase.tags.map((tId, idx) => {
                                    const tag = tags.find(t => t.id === tId);
                                    if (!tag) return null;
                                    return (
                                      <span 
                                        key={`tag-pill-${purchase.id}-${tId}-${idx}`} 
                                        className="text-[8px] px-1.5 py-0.5 rounded border font-medium leading-none flex items-center gap-0.5"
                                        style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}30`, color: tag.color }}
                                      >
                                        <span>{tag.emoji}</span>
                                        <span className="truncate max-w-[40px]">{tag.name}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Interactive Delivery Progress Bar/Timeline */}
                          <div className="mt-3.5 mb-2 px-1 select-none border-t border-dashed border-neutral-200/40 dark:border-neutral-800/40 pt-2.5">
                            <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5">
                              <span>Progresso de Envio</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-black">{getStatusLabel(purchase.status)}</span>
                            </div>
                            <div className="relative h-1 w-full bg-neutral-200/60 dark:bg-neutral-800/60 rounded-full overflow-hidden flex">
                              {availableStatuses.map((st, idx) => {
                                const isActive = idx <= currentStatusIndex;
                                return (
                                  <div 
                                    key={`bar-${st.id}-${idx}`}
                                    className="h-full flex-1 transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                    style={{
                                      backgroundColor: isActive ? getStatusColor(purchase.status) : 'transparent',
                                      opacity: isActive ? 1 - (currentStatusIndex - idx) * 0.18 : 0,
                                      borderRight: idx < availableStatuses.length - 1 ? '1px solid rgba(255,255,255,0.25)' : 'none'
                                    }}
                                  />
                                );
                              })}
                            </div>
                            {/* Stage labels dots */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 mt-3" aria-label="Etapas da entrega">
                              {availableStatuses.map((st, idx) => {
                                const isActive = idx <= currentStatusIndex;
                                const isCurrent = idx === currentStatusIndex;
                                return (
                                  <div
                                    key={`dot-label-${st.id}-${idx}`}
                                    className={`min-w-0 flex items-start gap-1.5 text-[9px] leading-tight font-semibold ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : isActive ? 'text-neutral-500' : 'text-neutral-400'}`}
                                  >
                                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${isCurrent ? 'bg-indigo-500' : isActive ? 'bg-neutral-400' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                                    <span className="min-w-0 break-words">{st.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
  
                          {/* Purchase detail metadata */}
                          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-neutral-200/50 dark:border-[#2a2d40]/40 text-[10px] font-medium text-neutral-500 dark:text-neutral-400 select-none">
                            <div>
                              <span className="text-[9px] text-neutral-500 block">Comprador</span>
                              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                {buyerProfile ? buyerProfile.name : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-neutral-500 block">Preço Final</span>
                              <span className="font-semibold font-mono text-indigo-600 dark:text-indigo-400 flex items-center gap-1 flex-wrap">
                                <span>R$ {purchase.finalPrice.toFixed(2)}</span>
                                {purchase.quantity && purchase.quantity > 1 && (
                                  <span className="text-[8px] font-sans text-neutral-400 dark:text-neutral-300 font-bold bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded shrink-0 leading-none">
                                    {purchase.quantity} un.
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-neutral-500 block">Data</span>
                              <span className="font-mono text-neutral-600 dark:text-neutral-300 flex items-center justify-end gap-1">
                                <Calendar className="w-2.5 h-2.5 shrink-0" />
                                {new Date(purchase.date).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                })}
                              </span>
                            </div>

                            {/* Payment and Delivery info row */}
                            {(purchase.paymentMethod || purchase.deliveryDate) && (
                              <div className="col-span-3 mt-2 pt-2 border-t border-neutral-200/40 dark:border-[#2a2d40]/40 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                {purchase.paymentMethod && (
                                  <div className="flex items-center gap-1.5">
                                    <CreditCard className="w-2.5 h-2.5 text-neutral-400" />
                                    <div className="flex flex-col leading-none">
                                      <span className="text-[8px] uppercase tracking-wider text-neutral-400 font-bold">Meio de Pagamento</span>
                                      <span className="text-[10px] text-neutral-700 dark:text-neutral-200 font-semibold">
                                        {purchase.paymentMethod === 'cartao' ? 'Cartão de Crédito' : 
                                         purchase.paymentMethod === 'parcelada' ? 'Parcelado' : 
                                         purchase.paymentMethod === 'conta' ? 'Conta Bancária' : purchase.paymentMethod}
                                        {purchase.bankName && <span className="text-neutral-400 font-medium"> ({purchase.bankName})</span>}
                                        {purchase.cardName && <span className="text-indigo-400 font-medium ml-1">[{purchase.cardName}]</span>}
                                        {purchase.installments && purchase.installments > 1 && (
                                          <span className="bg-indigo-500/10 text-indigo-500 px-1 rounded ml-1 text-[8px] font-black">{purchase.installments}x</span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {purchase.deliveryDate && (
                                  <div className="flex items-center gap-1.5">
                                    <ShoppingBag className="w-2.5 h-2.5 text-emerald-500" />
                                    <div className="flex flex-col leading-none">
                                      <span className="text-[8px] uppercase tracking-wider text-emerald-500/60 font-bold">Entregue em</span>
                                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                                        {new Date(purchase.deliveryDate).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Navigation link to details panel */}
                          <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/40 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onGoToPurchaseInPanel) {
                                  onGoToPurchaseInPanel(purchase);
                                }
                              }}
                              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer select-none group/btn"
                            >
                              <span>Mais detalhes</span>
                              <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* FullScreen Carousel */}
                {fullScreenCarousel && (
                  <FullScreenCarousel
                    images={fullScreenCarousel.images}
                    initialIndex={fullScreenCarousel.initialIndex}
                    onClose={() => setFullScreenCarousel(null)}
                  />
                )}
                
                {/* Purchase tab bottom action */}
                {platform.purchases.length > 0 && (
                  <div className="flex items-center border-t border-neutral-200 dark:border-[#232534] pt-3 select-none">
                    <button
                      id={`platform-register-purchase-btn-${platform.id}`}
                      data-testid={`platform-register-purchase-btn-${platform.id}`}
                      onClick={() => onAddPurchase(platform.id)}
                      className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Registrar nova compra</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
