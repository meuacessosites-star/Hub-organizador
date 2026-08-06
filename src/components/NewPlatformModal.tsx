import { resizeImage } from "../utils/imageHelper";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Category, ProfileAvatar, Platform, Profile, ProfilePreset } from '../types';
import { X, Globe, Link, Eye, EyeOff, Shield, Image as ImageIcon, Smile, Palette, Upload, Check, Trash2, Search, User, Mail, Bookmark, Pencil, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLogoUrl, getDomainFromInput, getInitials, getPlatformColor, getPlatformNameFromUrl } from '../utils/logoHelper';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CategoryIcon } from './CategoryIcon';
import { SmartImage } from './SmartImage';
import { safeParse, safeSetItem } from '../lib/utils';
import { useStorage } from '../hooks/useStorage';

interface CustomPreset {
  name: string;
  url: string;
  logoUrl: string;
}

interface NewPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSubmit: (platformData: {
    name: string;
    url: string;
    logoUrl?: string;
    categoryId: string;
    firstProfile: Omit<Profile, 'id'>;
  }) => void;
}


const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#84cc16', // Lime
  '#a855f7', // Purple
];

const PRESET_EMOJIS = [
  '👤', '💼', '🏠', '🎓', '🛠️', '🏢', '💰', '🎬', '🛍️', '📁',
  '💻', '📱', '🎮', '❤️', '🌟', '🚀', '🔒', '🔑', '🎨', '✈️'
];

// Helper to convert HEX to HSV for exact indicator position
const hexToHsv = (hex: string): { h: number; s: number; v: number } => {
  let r = 0, g = 0, b = 0;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else {
    return { h: 0, s: 0, v: 1 };
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s, v };
};

const getIndicatorCoords = (color: string, radius: number = 64) => {
  const { h, s } = hexToHsv(color);
  const angle = (h / 360) * (Math.PI * 2) - Math.PI;
  const dist = s * radius;
  return {
    x: radius + Math.cos(angle) * dist,
    y: radius + Math.sin(angle) * dist,
  };
};

const POPULAR_PRESETS = [
  { name: 'Netflix', domain: 'netflix.com' },
  { name: 'Spotify', domain: 'spotify.com' },
  { name: 'Disney+', domain: 'disneyplus.com' },
  { name: 'HBO Max', domain: 'max.com' },
  { name: 'Prime Video', domain: 'primevideo.com' },
  { name: 'YouTube', domain: 'youtube.com' },
  { name: 'Nubank', domain: 'nubank.com.br' },
  { name: 'Mercado Livre', domain: 'mercadolivre.com.br' },
  { name: 'Amazon', domain: 'amazon.com.br' },
  { name: 'Shopee', domain: 'shopee.com.br' },
  { name: 'GitHub', domain: 'github.com' },
  { name: 'Notion', domain: 'notion.so' },
  { name: 'Figma', domain: 'figma.com' },
  { name: 'Canva', domain: 'canva.com' },
  { name: 'Google', domain: 'google.com' },
  { name: 'Steam', domain: 'steampowered.com' },
  { name: 'Playstation', domain: 'playstation.com' },
  { name: 'Xbox', domain: 'xbox.com' },
];

export const NewPlatformModal: React.FC<NewPlatformModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSubmit,
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { profilePresets, addProfilePreset, deleteProfilePreset, updateProfilePreset } = useStorage();
  
  const getCustomPresetsKey = () => user ? `hub_user_${user.uid}_custom_presets` : 'hub_custom_presets';
  const getProfileNamesKey = () => user ? `hub_user_${user.uid}_profile_names` : 'hub_profile_names';

  const [step, setStep] = useState(1);

  // Step 1: Platform Data
  const [platformName, setPlatformName] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || 'outros');
  const [urlError, setUrlError] = useState('');

  // Platform logo states
  const [logoMode, setLogoMode] = useState<'auto' | 'presets' | 'url' | 'upload'>('auto');
  const [selectedPresetDomain, setSelectedPresetDomain] = useState('');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [logoUploadBase64, setLogoUploadBase64] = useState('');

  // Custom presets states
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(() => {
    let saved = localStorage.getItem(getCustomPresetsKey());
    if (!saved && user) saved = localStorage.getItem('hub_custom_presets');
    return safeParse(saved, []);
  });
  
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const [logoPreviewErrorCount, setLogoPreviewErrorCount] = useState(0);

  const handleDeleteCustomPreset = (name: string) => {
    setCustomPresets((prev) => {
      const updated = prev.filter(p => p.name.toLowerCase() !== name.toLowerCase());
      safeSetItem(getCustomPresetsKey(), JSON.stringify(updated));
      return updated;
    });
  };

  // Step 2: First Profile Data
  const [isEditingNamesList, setIsEditingNamesList] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

  const [profileName, setProfileName] = useState(() => {
    if (profilePresets && profilePresets.length > 0) return profilePresets[0].name;
    return 'Pessoal';
  });
  const [customProfileName, setCustomProfileName] = useState('');
  const customNameInputRef = useRef<HTMLInputElement>(null);
  const [isCustomProfile, setIsCustomProfile] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accessLink, setAccessLink] = useState('');
  const [description, setDescription] = useState('');

  // Avatar states
  const [avatarTab, setAvatarTab] = useState<'color' | 'emoji' | 'image'>('color');
  const [selectedColor, setSelectedColor] = useState('#7c5cfc');
  const [brightness, setBrightness] = useState(1.0);
  const [selectedEmoji, setSelectedEmoji] = useState('👤');
  const [imageUrl, setImageUrl] = useState('');
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [showColorWheel, setShowColorWheel] = useState(false);
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showAvatarZoomControl, setShowAvatarZoomControl] = useState(false);

  const colorWheelRef = useRef<HTMLDivElement>(null);

  const [isAccessLinkEdited, setIsAccessLinkEdited] = useState(false);

  // Auto-fill access link in Step 2 when platform URL is filled
  useEffect(() => {
    if (!isAccessLinkEdited && platformUrl) {
      setAccessLink(platformUrl);
    }
  }, [platformUrl, isAccessLinkEdited]);



  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleColorSelection(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && e.touches[0]) {
        e.preventDefault();
        handleColorSelection(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleGlobalTouchEnd = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, []);

  const handleColorSelection = (clientX: number, clientY: number) => {
    const container = colorWheelRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const width = rect.width;
    const height = rect.height;
    const cx = width / 2;
    const cy = height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = width / 2;

    const angle = Math.atan2(dy, dx) + Math.PI;
    const hue = (angle / (Math.PI * 2)) * 360;
    const sat = Math.min(1, dist / radius);
    
    const rgb = hsvToRgb(hue, sat, brightness);
    const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
    setSelectedColor(hex);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    handleColorSelection(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    if (e.touches[0]) {
      handleColorSelection(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255),
    ];
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('A imagem deve ter no máximo 5MB.', 'error');
        return;
      }
      try {
        const resized = await resizeImage(file);
        setImageUrl(resized);
      } catch (error) {
        addToast('Erro ao processar imagem.', 'error');
      }
    }
  };

  const handlePlatformLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('A imagem deve ter no máximo 5MB.', 'error');
        return;
      }
      try {
        const resized = await resizeImage(file);
        setLogoUploadBase64(resized);
      } catch (error) {
        addToast('Erro ao processar imagem.', 'error');
      }
    }
  };

  const handleSelectPreset = (preset: { name: string; domain?: string; url?: string; logoUrl?: string }) => {
    if (preset.domain) {
      setSelectedPresetDomain(preset.domain);
      setPlatformName(preset.name);
      setPlatformUrl(`https://${preset.domain}`);
      setLogoMode('auto');
    } else {
      setSelectedPresetDomain('');
      setPlatformName(preset.name);
      setPlatformUrl(preset.url || '');
      if (preset.logoUrl) {
        if (preset.logoUrl.startsWith('data:')) {
          setLogoUploadBase64(preset.logoUrl);
          setLogoMode('upload');
        } else {
          setLogoUrlInput(preset.logoUrl);
          setLogoMode('url');
        }
      } else {
        setLogoMode('auto');
      }
    }
  };

  useEffect(() => {
    setLogoPreviewErrorCount(0);
  }, [platformName, platformUrl, logoMode, logoUrlInput, logoUploadBase64, selectedPresetDomain]);

  // Reset logo error count when input changes to try better services again
  useEffect(() => {
    setLogoPreviewErrorCount(0);
  }, [platformName, platformUrl, logoUrlInput, logoMode, selectedPresetDomain]);

  const finalLogoUrlPreview = (() => {
    if (logoMode === 'auto') {
      if (!platformName.trim() && !platformUrl.trim()) return '';
      return getLogoUrl(platformName, platformUrl, logoPreviewErrorCount);
    }
    if (logoMode === 'presets') {
      if (!selectedPresetDomain) return '';
      return getLogoUrl('', selectedPresetDomain, logoPreviewErrorCount);
    }
    if (logoMode === 'url') {
      if (!logoUrlInput.trim()) return '';
      const isDirectImage = (url: string) => {
        const clean = url.trim().toLowerCase();
        if (clean.startsWith('data:image/')) return true;
        const noQuery = clean.split('?')[0].split('#')[0];
        return (
          noQuery.endsWith('.png') ||
          noQuery.endsWith('.jpg') ||
          noQuery.endsWith('.jpeg') ||
          noQuery.endsWith('.gif') ||
          noQuery.endsWith('.svg') ||
          noQuery.endsWith('.webp') ||
          noQuery.endsWith('.bmp') ||
          noQuery.endsWith('.ico')
        );
      };

      if (isDirectImage(logoUrlInput)) {
        return logoUrlInput;
      } else {
        return getLogoUrl('', logoUrlInput, logoPreviewErrorCount);
      }
    }
    if (logoMode === 'upload') {
      return logoUploadBase64;
    }
    return '';
  })();

  const computedLogoUrl = finalLogoUrlPreview;

  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      const cleanUrl = url.trim().toLowerCase();
      // Basic check: must contain at least one dot and some characters around it
      if (!cleanUrl.includes('.') || cleanUrl.length < 3) return false;
      const withHttp = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
      const parsed = new URL(withHttp);
      return parsed.hostname.includes('.') && parsed.hostname.length > 3;
    } catch {
      return false;
    }
  };

  const handleNext = () => {
    if (!platformName.trim()) return;
    
    if (platformUrl && !isValidUrl(platformUrl)) {
      setUrlError('Domínio ou URL inválido. Use algo como "exemplo.com"');
      return;
    }

    if (accessLink && !isValidUrl(accessLink)) {
      setStep(2); // Ensure we are on step 2 to show error if possible
      // Actually, handleCreatePlatform is called from Step 2
    }
    
    setUrlError('');
    setStep(2);
  };

  const handlePrev = () => {
    setStep(1);
  };

  const handleProfileNameChip = (name: string) => {
    setIsCustomProfile(false);
    setProfileName(name);
  };

  const handleCustomProfileToggle = () => {
    setIsCustomProfile(true);
    setProfileName('');
  };

  const handleCreate = () => {
    const finalProfileName = isCustomProfile ? customProfileName : profileName;
    if (!finalProfileName.trim()) return;

    let avatarValue = '';
    if (avatarTab === 'color') {
      avatarValue = selectedColor;
    } else if (avatarTab === 'emoji') {
      avatarValue = selectedEmoji;
    } else {
      avatarValue = imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    }

    const firstProfile: Omit<Profile, 'id'> = {
      name: finalProfileName,
      username: username,
      email: email,
      password: password,
      accessLink: accessLink,
      description: description,
      avatar: {
        type: avatarTab,
        value: avatarValue,
        bgColor: selectedColor,
        zoom: avatarTab === 'image' ? avatarZoom : undefined,
      },
    };

    const finalLogoUrl = computedLogoUrl || '';

    if (saveAsPreset) {
      const newPreset: CustomPreset = {
        name: platformName,
        url: platformUrl,
        logoUrl: finalLogoUrl,
      };
      setCustomPresets((prev) => {
        const filtered = prev.filter(p => p.name.toLowerCase() !== platformName.toLowerCase());
        const updated = [newPreset, ...filtered];
        safeSetItem(getCustomPresetsKey(), JSON.stringify(updated));
        return updated;
      });
    }

    onSubmit({
      name: platformName,
      url: platformUrl,
      logoUrl: finalLogoUrl,
      categoryId: selectedCategory,
      firstProfile,
    });

    // Reset states
    setStep(1);
    setPlatformName('');
    setPlatformUrl('');
    setSelectedCategory(categories[0]?.id || 'outros');
    setLogoMode('auto');
    setSelectedPresetDomain('');
    setLogoUrlInput('');
    setLogoUploadBase64('');
    setSaveAsPreset(false);
    setLogoPreviewErrorCount(0);
    setProfileName('Pessoal');
    setCustomProfileName('');
    setIsCustomProfile(false);
    setUsername('');
    setEmail('');
    setPassword('');
    setAccessLink('');
    setDescription('');
    setAvatarTab('color');
    setSelectedColor('#7c5cfc');
    setSelectedEmoji('👤');
    setImageUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 overflow-y-auto backdrop-blur-sm scrollbar-hide">
      <div className="min-h-full flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-white dark:bg-[#0a0a0a] rounded-2xl border border-neutral-200 dark:border-white/[0.08] overflow-hidden shadow-2xl text-neutral-800 dark:text-neutral-200 flex flex-col"
        >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-white/[0.08] flex items-center justify-between bg-neutral-50 dark:bg-[#0d0d0d]">
          <div>
            <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-white">
              {step === 1 ? 'Nova plataforma' : `Primeiro perfil — ${platformName}`}
            </h2>
            <p className="text-neutral-500 text-[10px] font-medium mt-1">
              Passo {step} de 2
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Panel */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              {/* Nome da plataforma */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Nome da plataforma
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                    <Globe className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    placeholder="Ex: GitHub, Nubank, Netflix..."
                    className="w-full h-11 pl-10 pr-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#0d0d0d] dark:border-white/[0.08] dark:text-neutral-200 dark:placeholder-neutral-500"
                  />
                </div>
                <p className="text-[10px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                  🔍 Digite um nome para ver a logo ser sugerida automaticamente abaixo.
                </p>
              </div>

              {/* URL da plataforma */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  URL da plataforma (opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                    <Link className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={platformUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlatformUrl(val);
                      if (urlError) setUrlError('');
                      
                      // Auto-fill platform name if empty OR if it matches a generic name
                      if ((!platformName.trim() || platformName === 'Plataforma') && val.includes('.')) {
                        const inferredName = getPlatformNameFromUrl(val);
                        if (inferredName) setPlatformName(inferredName);
                      }
                    }}
                    placeholder="https://exemplo.com (preenche automaticamente)"
                    className={`w-full h-11 pl-10 pr-4 rounded-lg text-sm bg-neutral-50 border text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#0d0d0d] dark:text-neutral-200 dark:placeholder-neutral-500 ${
                      urlError ? 'border-rose-500 dark:border-rose-500' : 'border-neutral-200 dark:border-white/[0.08]'
                    }`}
                  />
                </div>
                {urlError && (
                  <p className="text-[10px] text-rose-500 font-medium mt-1">
                    ⚠️ {urlError}
                  </p>
                )}
              </div>

              {/* Logotipo da plataforma */}
              <div className="flex flex-col gap-3 border-t border-neutral-200 dark:border-[#25283a]/60 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Logotipo da plataforma
                  </label>
                  <span className="text-[10px] text-neutral-500">Selecione ou adicione uma imagem</span>
                </div>

                {/* Active Logo Preview & Tabs */}
                <div className="flex gap-4 items-start">
                  {/* Large Logo Preview */}
                  <div className="w-16 h-16 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative dark:bg-[#0d0d0d] dark:border-white/[0.08]">
                    {finalLogoUrlPreview && logoPreviewErrorCount < 2 ? (
                       <SmartImage
                         src={finalLogoUrlPreview}
                         alt="Logo Preview"
                         className="w-full h-full object-cover p-0"
                       />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-2xl font-extrabold text-white uppercase select-none tracking-tighter"
                        style={{ backgroundColor: getPlatformColor(platformName || 'Plataforma') }}
                      >
                        {getInitials(platformName || 'P')}
                      </div>
                    )}
                  </div>

                  {/* Selection tabs */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1 border border-neutral-200/80 text-[10px] sm:text-[11px] font-medium dark:bg-[#0a0a0a] dark:border-[#25283a]">
                      <button
                        type="button"
                        id="new-platform-logo-auto-btn"
                        data-testid="new-platform-logo-auto-btn"
                        onClick={() => setLogoMode('auto')}
                        className={`py-1.5 rounded-md transition-all cursor-pointer text-center ${
                          logoMode === 'auto'
                            ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                      >
                        Automático
                      </button>
                      <button
                        type="button"
                        id="new-platform-logo-presets-btn"
                        data-testid="new-platform-logo-presets-btn"
                        onClick={() => setLogoMode('presets')}
                        className={`py-1.5 rounded-md transition-all cursor-pointer text-center ${
                          logoMode === 'presets'
                            ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                      >
                        Padrões
                      </button>
                      <button
                        type="button"
                        id="new-platform-logo-url-btn"
                        data-testid="new-platform-logo-url-btn"
                        onClick={() => setLogoMode('url')}
                        className={`py-1.5 rounded-md transition-all cursor-pointer text-center ${
                          logoMode === 'url'
                            ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                      >
                        Link URL
                      </button>
                      <button
                        type="button"
                        id="new-platform-logo-upload-btn"
                        data-testid="new-platform-logo-upload-btn"
                        onClick={() => setLogoMode('upload')}
                        className={`py-1.5 rounded-md transition-all cursor-pointer text-center ${
                          logoMode === 'upload'
                            ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                      >
                        Upload
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="pt-1">
                  {/* AUTO MODE */}
                  {logoMode === 'auto' && (
                    <div className="flex flex-col gap-2">
                      <div className="text-[11px] leading-relaxed text-neutral-500 bg-neutral-50 p-3 rounded-xl border border-neutral-200 dark:bg-[#000000]/55 dark:border-[#2a2d40]/40">
                        💡 O sistema busca a logo oficial automaticamente. Se o ícone não aparecer ou estiver incorreto, você pode <strong>prosseguir normalmente</strong> ou usar as abas acima para escolher uma imagem manualmente.
                      </div>
                      {platformName.trim() !== '' && logoPreviewErrorCount >= 2 && (
                        <div className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
                          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[9px]">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-[10px]">⚠️</span>
                            Logo não encontrada
                          </div>
                          <div className="leading-relaxed">
                            Esse link do site inserido não tem logo, se quiser personalizar a logo utilize uma dessas funções padrões ou upload.
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PRESETS MODE */}
                  {logoMode === 'presets' && (
                    <div className="flex flex-col gap-3">
                      {/* My Presets Section */}
                      {customPresets.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                            Meus Padrões Salvos
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 max-h-[110px] overflow-y-auto p-1.5 rounded-lg border border-neutral-200 bg-neutral-50 dark:border-[#2a2d40]/70 dark:bg-[#000000]/50">
                            {customPresets.map((preset, idx) => {
                              const isSelected = platformName === preset.name && platformUrl === preset.url;
                              return (
                                <div key={`cp-${idx}-${preset.name}`} className="relative group">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectPreset(preset)}
                                    className={`w-full flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all cursor-pointer hover:border-indigo-500/50 ${
                                      isSelected
                                        ? 'border-indigo-500 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                                        : 'border-neutral-200 bg-white text-neutral-700 dark:border-[#2a2d40] dark:bg-[#13141c]/40 dark:text-neutral-400'
                                    }`}
                                  >
                                    {preset.logoUrl ? (
                                      <SmartImage
                                        src={preset.logoUrl}
                                        alt={preset.name}
                                        className="w-5 h-5 object-contain rounded"
                                      />
                                    ) : (
                                      <div
                                        className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white uppercase"
                                        style={{ backgroundColor: getPlatformColor(preset.name) }}
                                      >
                                        {getInitials(preset.name)}
                                      </div>
                                    )}
                                    <span className="text-[8px] mt-1 font-medium truncate w-full">{preset.name}</span>
                                  </button>
                                  {/* Delete Custom Preset Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCustomPreset(preset.name);
                                    }}
                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 cursor-pointer shadow-sm text-[10px] font-bold z-10"
                                    title="Excluir padrão"
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Popular Presets Section */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                          Padrões Populares
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 max-h-[135px] overflow-y-auto p-1.5 rounded-lg border border-neutral-200 bg-neutral-50 dark:border-[#2a2d40]/70 dark:bg-[#111219]/50">
                          {POPULAR_PRESETS.map((preset) => {
                            const presetLogoUrl = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${preset.domain}&size=256`;
                            const isSelected = selectedPresetDomain === preset.domain;
                            return (
                              <button
                                key={preset.domain}
                                type="button"
                                onClick={() => handleSelectPreset(preset)}
                                className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all cursor-pointer hover:border-indigo-500/50 ${
                                  isSelected
                                    ? 'border-indigo-500 bg-indigo-600/10 text-white font-semibold'
                                    : 'border-neutral-200 bg-white text-neutral-700 dark:border-[#2a2d40] dark:bg-[#13141c]/40 dark:text-neutral-400'
                                }`}
                              >
                                <SmartImage
                                  src={presetLogoUrl}
                                  alt={preset.name}
                                  className="w-5 h-5 object-contain rounded"
                                />
                                <span className="text-[8px] mt-1 font-medium truncate w-full">{preset.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* URL MODE */}
                  {logoMode === 'url' && (
                    <div className="flex flex-col gap-2">
                      <input
                        type="url"
                        value={logoUrlInput}
                        onChange={(e) => setLogoUrlInput(e.target.value)}
                        placeholder="https://exemplo.com/logo-netflix.png"
                        className="w-full h-10 px-3 rounded-lg text-xs bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 dark:placeholder-neutral-500"
                      />
                      <p className="text-[10px] text-neutral-500">Cole qualquer link de imagem para usá-lo como logo da plataforma.</p>
                      {logoUrlInput.trim() !== '' && logoPreviewErrorCount >= 2 && (
                        <div className="text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 p-3 rounded-lg border border-rose-200 dark:border-rose-900/30 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1">
                          <div className="flex items-center gap-2 font-semibold">
                            <span>❌ Erro ao carregar imagem</span>
                          </div>
                          <span>Não foi possível carregar a imagem desta URL.</span>
                          <div className="flex flex-col gap-1 text-[9px] opacity-80 mt-1">
                            <p>• Verifique se o link termina em .png, .jpg ou .webp</p>
                            <p>• Algumas URLs podem estar bloqueadas por segurança</p>
                            <p>• Tente usar o <strong>Upload</strong> direto se tiver o arquivo</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* UPLOAD MODE */}
                  {logoMode === 'upload' && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex flex-col items-center justify-center h-16 border border-dashed border-neutral-200 hover:border-indigo-500/60 rounded-lg cursor-pointer bg-[#fcfcfd] transition-colors dark:border-[#2a2d40] dark:bg-[#111219]/40">
                          <div className="flex flex-col items-center justify-center text-center px-3">
                            <Upload className="w-4 h-4 text-neutral-500 mb-1" />
                            <span className="text-[10px] text-neutral-400 font-medium">Escolher imagem local...</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePlatformLogoUpload}
                          />
                        </label>
                        {logoUploadBase64 && (
                          <button
                            type="button"
                            onClick={() => setLogoUploadBase64('')}
                            className="px-2.5 h-10 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-[10px] font-semibold cursor-pointer transition-colors"
                          >
                            Remover Foto
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Categoria Selection pills */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Categoria
                  </label>
                  <div className="relative group max-w-[180px]">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors group-focus-within:text-indigo-500">
                      <Search className="w-3 h-3" />
                    </span>
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Filtrar categorias..."
                      className="w-full h-7 pl-8 pr-2 rounded-md bg-neutral-100 border border-neutral-200 text-[10px] text-neutral-700 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 transition-all duration-200 dark:bg-[#000000] dark:border-[#2a2d40] dark:text-neutral-300"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {categories
                    .filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                    .map((cat) => {
                      const isSel = selectedCategory === cat.id;
                      const slugName = cat.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          id={`modal-category-btn-${cat.id}`}
                          data-testid={`modal-category-btn-${slugName}`}
                          aria-label={cat.name}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                            isSel
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-600 dark:bg-indigo-600/15 dark:border-indigo-500 dark:text-indigo-400'
                              : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:bg-[#000000] dark:border-[#2a2d40] dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
                          }`}
                        >
                          <CategoryIcon icon={cat.icon} className="w-3.5 h-3.5" />
                          <span data-testid={`modal-category-name-${cat.id}`}>{cat.name}</span>
                        </button>
                      );
                    })}
                  {categories.filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                    <p className="text-[10px] text-neutral-500 italic py-1">Nenhuma categoria encontrada.</p>
                  )}
                </div>
              </div>

              {/* SAVE AS PRESET CHECKBOX */}
              <div className="flex items-center gap-2 mt-2 bg-neutral-50 dark:bg-[#000000]/50 border border-neutral-200/60 dark:border-[#2a2d40]/40 rounded-xl p-3">
                <input
                  type="checkbox"
                  id="saveAsPreset"
                  checked={saveAsPreset}
                  onChange={(e) => setSaveAsPreset(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-neutral-300 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                />
                <label htmlFor="saveAsPreset" className="text-xs font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
                  Salvar esta plataforma nos meus padrões (Salvar nome, link e logo para uso futuro)
                </label>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-4.5">
              {/* Nome do perfil (Chips) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Perfis padrão (Presets)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsEditingNamesList(!isEditingNamesList)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isEditingNamesList ? '✓ Concluir' : '⚙️ Gerenciar'}
                  </button>
                </div>

                {isEditingNamesList ? (
                  <div className="flex flex-col gap-2 p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 dark:border-[#2a2d40]/60 dark:bg-[#111219]/50 max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
                    <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      Gerenciar perfis salvos
                    </span>
                    {profilePresets.map((preset) => (
                      <div key={`preset-edit-${preset.id}`} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-[#13141c] border border-neutral-100 dark:border-[#2a2d40]/40 shadow-sm">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0 overflow-hidden"
                          style={{ backgroundColor: preset.avatar.bgColor || (preset.avatar.type === 'color' ? preset.avatar.value : undefined) }}
                        >
                          {preset.avatar.type === 'emoji' ? (
                            preset.avatar.value
                          ) : preset.avatar.type === 'image' ? (
                            <SmartImage src={preset.avatar.value} alt="" className="w-full h-full object-cover" style={{ transform: `scale(${preset.avatar.zoom || 1})` }} />
                          ) : (
                            preset.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <span className="flex-1 text-xs font-medium truncate">{preset.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPresetId(preset.id);
                              setProfileName(preset.name);
                              setIsCustomProfile(true);
                              setCustomProfileName(preset.name);
                              setAvatarTab(preset.avatar.type);
                              if (preset.avatar.bgColor) setSelectedColor(preset.avatar.bgColor);
                              else if (preset.avatar.type === 'color') setSelectedColor(preset.avatar.value);
                              
                              if (preset.avatar.type === 'emoji') setSelectedEmoji(preset.avatar.value);
                              else if (preset.avatar.type === 'image') {
                                setImageUrl(preset.avatar.value);
                                setAvatarZoom(preset.avatar.zoom || 1);
                              }
                              
                              setEmail(preset.email || '');
                              setUsername(preset.username || '');
                              setPassword(preset.password || '');
                              setAccessLink(preset.accessLink || '');
                              setDescription(preset.description || '');
                              
                              addToast(`Editando preset: ${preset.name}`, 'info');
                              setTimeout(() => {
                                customNameInputRef.current?.focus();
                                customNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }}
                            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
                            title="Editar preset"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteProfilePreset(preset.id);
                              if (profileName === preset.name) {
                                setProfileName(profilePresets[0]?.name || '');
                              }
                              if (editingPresetId === preset.id) {
                                setEditingPresetId(null);
                                setIsCustomProfile(false);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                            title="Excluir preset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {!isCustomProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPresetId(null);
                          setProfileName('');
                          setIsCustomProfile(true);
                          setCustomProfileName('');
                          setEmail('');
                          setUsername('');
                          setPassword('');
                          setAccessLink('');
                          setDescription('');
                          setAvatarTab('emoji');
                          setSelectedEmoji('👤');
                          setImageUrl('');
                          setAvatarZoom(1);
                          addToast('Preencha os dados e salve como novo padrão!', 'info');
                          setTimeout(() => {
                            customNameInputRef.current?.focus();
                            customNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 100);
                        }}
                        className="w-full py-2.5 rounded-lg border border-dashed border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Adicionar novo</span>
                      </button>
                    )}
                    
                    {/* New/Edit Preset Form Integrated */}
                    {isCustomProfile && (
                      <div className="mt-2 p-3 rounded-xl border-2 border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-500/5 flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            {editingPresetId ? 'Nome do Preset (Editando)' : 'Nome do Novo Preset'}
                          </label>
                          <input
                            ref={customNameInputRef}
                            type="text"
                            value={customProfileName}
                            onChange={(e) => setCustomProfileName(e.target.value)}
                            placeholder="Ex: Minha Empresa"
                            className="w-full h-10 px-3 rounded-lg text-xs bg-white border border-indigo-200 text-neutral-800 focus:outline-none focus:border-indigo-500 dark:bg-[#13141c] dark:border-[#2a2d40] dark:text-neutral-200 shadow-sm"
                          />
                        </div>

                        {/* Save Action for Presets */}
                        <button
                          type="button"
                          onClick={() => {
                            const nameToSave = customProfileName.trim();
                            if (!nameToSave) {
                              addToast('O preset precisa de um nome.', 'error');
                              customNameInputRef.current?.focus();
                              return;
                            }

                            let avatarValue = '';
                            if (avatarTab === 'color') avatarValue = selectedColor;
                            else if (avatarTab === 'emoji') avatarValue = selectedEmoji;
                            else avatarValue = imageUrl || '';

                            const presetData = {
                              name: nameToSave,
                              avatar: { 
                                type: avatarTab, 
                                value: avatarValue, 
                                bgColor: selectedColor, 
                                zoom: avatarTab === 'image' ? avatarZoom : undefined 
                              },
                              email, 
                              username, 
                              password, 
                              accessLink, 
                              description
                            };

                            if (editingPresetId) {
                              updateProfilePreset(editingPresetId, presetData);
                              addToast(`Preset "${nameToSave}" atualizado!`, 'success');
                            } else {
                              addProfilePreset(presetData);
                              addToast(`Novo preset "${nameToSave}" criado!`, 'success');
                            }
                            setEditingPresetId(null);
                            setIsCustomProfile(false);
                          }}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer border flex items-center justify-center gap-2 ${
                            editingPresetId 
                              ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500' 
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                          }`}
                        >
                          {editingPresetId ? <RefreshCw className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5 fill-current" />}
                          {editingPresetId ? 'Atualizar' : 'Salvar'}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomProfile(false);
                            setEditingPresetId(null);
                            setCustomProfileName('');
                          }}
                          className="text-[10px] font-bold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 uppercase tracking-wider text-center"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                    {profilePresets.length === 0 && !isCustomProfile && (
                      <p className="text-[10px] text-neutral-500 text-center py-4">
                        Nenhum perfil salvo como padrão.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-0.5 transition-all duration-300">
                    {(showAllPresets ? profilePresets : profilePresets.slice(0, 8)).map((preset) => {
                      const isSel = profileName === preset.name && !isCustomProfile;
                      return (
                        <button
                          key={`preset-chip-${preset.id}`}
                          type="button"
                          onClick={() => {
                            setIsCustomProfile(false);
                            setProfileName(preset.name);
                            // Apply preset avatar
                            setAvatarTab(preset.avatar.type);
                            if (preset.avatar.bgColor) setSelectedColor(preset.avatar.bgColor);
                            else if (preset.avatar.type === 'color') setSelectedColor(preset.avatar.value);
                            
                            if (preset.avatar.type === 'emoji') setSelectedEmoji(preset.avatar.value);
                            else if (preset.avatar.type === 'image') {
                              setImageUrl(preset.avatar.value);
                              setAvatarZoom(preset.avatar.zoom || 1);
                            }

                            // Apply extra fields
                            if (preset.email) setEmail(preset.email);
                            if (preset.username) setUsername(preset.username);
                            if (preset.password) setPassword(preset.password);
                            if (preset.accessLink) {
                              setAccessLink(preset.accessLink);
                              setIsAccessLinkEdited(true);
                            }
                            if (preset.description) setDescription(preset.description);
                            
                            addToast(`Preset "${preset.name}" aplicado!`, 'info');
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                            isSel
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-transparent dark:bg-[#111219] dark:text-neutral-400 dark:hover:bg-neutral-800/80'
                          }`}
                        >
                          <div 
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm overflow-hidden ${isSel ? 'bg-white/20' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                            style={{ backgroundColor: isSel ? 'rgba(255,255,255,0.2)' : (preset.avatar.bgColor || (preset.avatar.type === 'color' ? preset.avatar.value : undefined)) }}
                          >
                            {preset.avatar.type === 'emoji' ? (
                              preset.avatar.value
                            ) : preset.avatar.type === 'image' ? (
                              <SmartImage src={preset.avatar.value} alt="" className="w-full h-full object-contain" style={{ transform: `scale(${preset.avatar.zoom || 1})` }} />
                            ) : (
                              preset.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          {preset.name}
                        </button>
                      );
                    })}
                    
                    {profilePresets.length > 8 && (
                      <button
                        type="button"
                        onClick={() => setShowAllPresets(!showAllPresets)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors uppercase tracking-wider cursor-pointer bg-indigo-500/5 hover:bg-indigo-500/10"
                      >
                        {showAllPresets ? 'Ver menos' : `+${profilePresets.length - 8} outros`}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleCustomProfileToggle}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isCustomProfile
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-[#111219] dark:text-neutral-400 dark:hover:bg-neutral-800/80'
                      }`}
                    >
                      ✏️ Personalizado
                    </button>
                  </div>
                )}

                {isCustomProfile && !isEditingNamesList && (
                  <div className="flex flex-col gap-2 mt-1.5">
                    <div className="flex gap-2">
                      <input
                        ref={customNameInputRef}
                        type="text"
                        value={customProfileName}
                        onChange={(e) => setCustomProfileName(e.target.value)}
                        placeholder="Nome do perfil personalizado (para este uso)"
                        className="flex-1 h-11 px-4 rounded-xl text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                      />
                    </div>
                  </div>
                )}

                {/* Save/Update as Preset Button removed from here as per user request */}
              </div>

              {/* E-mail Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  E-mail <span className="text-[10px] font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full h-11 px-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 dark:placeholder-neutral-500"
                />
              </div>

              {/* Usuário Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Usuário <span className="text-[10px] font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nome de usuário"
                  className="w-full h-11 px-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 dark:placeholder-neutral-500"
                />
              </div>

              {/* Senha */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Senha (opcional)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Salvar senha..."
                    className="w-full h-11 pl-4 pr-11 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 dark:placeholder-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 cursor-pointer dark:text-neutral-500 dark:hover:text-neutral-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Link de acesso */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                  Link de acesso
                  <span className="text-[10px] text-neutral-500">(opcional)</span>
                </label>
                <input
                  type="url"
                  value={accessLink}
                  onChange={(e) => {
                    setAccessLink(e.target.value);
                    setIsAccessLinkEdited(true);
                    if (urlError) setUrlError('');
                  }}
                  placeholder="https://exemplo.com/login"
                  className={`w-full h-11 px-4 rounded-lg text-sm bg-neutral-50 border transition-colors text-neutral-800 placeholder-neutral-400 focus:outline-none dark:bg-[#111219] dark:text-neutral-200 dark:placeholder-neutral-500 ${
                    accessLink && !isValidUrl(accessLink)
                      ? 'border-rose-500 focus:border-rose-600'
                      : 'border-neutral-200 focus:border-indigo-500 dark:border-[#2a2d40]'
                  }`}
                />
                {accessLink && !isValidUrl(accessLink) && (
                  <p className="text-[10px] text-rose-500 font-medium mt-1 animate-pulse">
                    ⚠️ Domínio ou URL inválido
                  </p>
                )}
              </div>

              {/* Rascunho / Descrição */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Rascunho / Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Anotações, observações, informações extras... sem limite de caracteres."
                  className="w-full h-20 p-3 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 dark:placeholder-neutral-500 resize-none"
                />
              </div>

              {/* Avatar do perfil (MÚLTIPLAS TABS) */}
              <div className="flex flex-col gap-2 pt-1">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Avatar do perfil
                </label>
                
                {/* Tabs selection header */}
                <div className="flex rounded-lg bg-neutral-100 p-1 border border-neutral-200/80 max-w-xs dark:bg-[#111219] dark:border-[#25283a]">
                  <button
                    type="button"
                    onClick={() => setAvatarTab('color')}
                    className={`flex-1 py-1 px-3 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 cursor-pointer ${
                      avatarTab === 'color'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Cor</span>
                  </button>
                  <button
                    type="button"
                    id="new-platform-emoji-tab-btn"
                    data-testid="new-platform-emoji-tab-btn"
                    aria-label="Emoji"
                    onClick={() => setAvatarTab('emoji')}
                    className={`flex-1 py-1 px-3 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 cursor-pointer ${
                      avatarTab === 'emoji'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                    }`}
                  >
                    <Smile className="w-3.5 h-3.5" />
                    <span>Emoji</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarTab('image')}
                    className={`flex-1 py-1 px-3 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 cursor-pointer ${
                      avatarTab === 'image'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Imagem</span>
                  </button>
                </div>

                {/* Sub panels */}
                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col items-center dark:border-[#25283a] dark:bg-[#14151f]">
                  
                  {/* COLOR WHEEL AND COLORS */}
                  {avatarTab === 'color' && (
                    <div className="flex flex-col items-center gap-4 w-full">
                      {/* Circle wheel + Preview */}
                      <div className="relative w-36 h-36 flex items-center justify-center touch-none">
                        <div
                          ref={colorWheelRef}
                          id="color-wheel-selector"
                          data-testid="color-wheel-selector"
                          onMouseDown={handleMouseDown}
                          onTouchStart={handleTouchStart}
                          className="w-full h-full rounded-full cursor-crosshair border border-neutral-300 shadow-lg dark:border-neutral-700 z-10 overflow-hidden"
                          style={{
                            background: `
                              radial-gradient(circle, #fff 0%, transparent 100%),
                              conic-gradient(from 180deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)
                            `,
                            filter: `brightness(${brightness})`
                          }}
                        />
                        {/* Middle color preview dot */}
                        <div
                          className="absolute w-10 h-10 rounded-full border-2 border-white shadow-md pointer-events-none flex items-center justify-center text-[10px] font-bold text-white uppercase z-20"
                          style={{ backgroundColor: selectedColor }}
                        >
                          {profileName ? profileName.slice(0, 2).toUpperCase() : 'PE'}
                        </div>

                        {/* Indicator svg for line and circle */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                          {(() => {
                            const coords = getIndicatorCoords(selectedColor, 72);
                            return (
                              <>
                                <line x1={72} y1={72} x2={coords.x} y2={coords.y} stroke={brightness > 0.5 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" strokeLinecap="round" />
                                <circle cx={coords.x} cy={coords.y} r="6" fill={selectedColor} stroke="white" strokeWidth="2" />
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* Brightness Slider */}
                      <div className="w-full flex flex-col gap-1.5 px-6">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Brilho</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={Math.round(brightness * 100)}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                  setBrightness(Math.max(0, Math.min(100, val)) / 100);
                                }
                              }}
                              className="w-12 h-6 px-1 text-right text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500"
                              title="Digite o valor manualmente"
                            />
                            <span className="text-[10px] font-mono text-neutral-400">%</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={brightness}
                          onChange={(e) => setBrightness(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          style={{
                            background: `linear-gradient(to right, #000, ${selectedColor})`
                          }}
                        />
                      </div>

                      {/* Manual Hex code selector */}
                      <div className="flex items-center gap-3 w-full max-w-xs mt-1">
                        <div
                          className="w-8 h-8 rounded-lg border border-neutral-300 shadow-inner flex items-center justify-center text-xs text-white dark:border-[#25283a]/80"
                          style={{ backgroundColor: selectedColor }}
                        />
                        <input
                          type="text"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          placeholder="#000000"
                          className="flex-1 h-9 px-3 rounded-lg text-xs bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 font-mono dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                        />
                      </div>

                      {/* Preset color bubbles */}
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                        {PRESET_COLORS.map((col, idx) => (
                          <button
                            key={`newplatform-color-${col}-${idx}`}
                            type="button"
                            onClick={() => setSelectedColor(col)}
                            className={`w-6 h-6 rounded-full border border-black/40 flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer`}
                            style={{ backgroundColor: col }}
                          >
                            {selectedColor.toLowerCase() === col.toLowerCase() && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EMOJI SELECTOR */}
                  {avatarTab === 'emoji' && (
                    <div className="flex flex-col items-center gap-3 w-full">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner select-none mb-1 text-white"
                        style={{ backgroundColor: selectedColor }}
                      >
                        {selectedEmoji}
                      </div>

                      <div className="grid grid-cols-5 gap-2.5 max-w-xs justify-center">
                        {PRESET_EMOJIS.map((em, idx) => (
                          <button
                            key={`newplatform-emoji-${em}-${idx}`}
                            type="button"
                            onClick={() => setSelectedEmoji(em)}
                            className={`w-8 h-8 text-lg rounded-lg flex items-center justify-center transition-all hover:bg-neutral-200 cursor-pointer dark:hover:bg-neutral-800 ${
                              selectedEmoji === em
                                ? 'bg-indigo-600/30 border border-indigo-500 scale-110'
                                : 'bg-white border border-neutral-200 dark:bg-[#111219] dark:border-[#2a2d40]'
                            }`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CUSTOM IMAGE SELECTOR */}
                  {avatarTab === 'image' && (
                    <div className="flex flex-col items-center gap-4 w-full select-none">
                      <div 
                        className="w-16 h-16 rounded-full border-2 border-indigo-500/20 overflow-hidden flex items-center justify-center shadow-lg transition-colors"
                        style={{ backgroundColor: selectedColor }}
                      >
                        {imageUrl ? (
                          <SmartImage 
                            src={imageUrl} 
                            alt="Avatar preview" 
                            className="w-full h-full object-cover transition-transform duration-200"
                            style={{ transform: `scale(${avatarZoom})` }} 
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-neutral-500" />
                        )}
                      </div>

                      {imageUrl && (
                        <div className="w-full max-w-[240px] flex flex-col gap-3 px-2">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center px-0.5">
                              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Ajustar Zoom</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="20"
                                  max="500"
                                  value={Math.round(avatarZoom * 100)}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) {
                                      setAvatarZoom(Math.max(20, Math.min(500, val)) / 100);
                                    }
                                  }}
                                  className="w-12 h-6 px-1 text-right text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500"
                                  title="Digite o zoom manualmente"
                                />
                                <span className="text-[10px] font-mono text-indigo-500">%</span>
                              </div>
                            </div>
                            <input
                              type="range"
                              min="0.2"
                              max="5"
                              step="0.01"
                              value={avatarZoom}
                              onChange={(e) => setAvatarZoom(parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-0.5">Cor de Fundo</span>
                            <div className="flex flex-wrap justify-center gap-1.5 relative">
                              {['#7c5cfc', '#ff5c5c', '#5cff9d', '#5cd6ff', '#ffb85c', '#ff5cd6', '#333333', '#ffffff'].map((color, idx) => (
                                <button
                                  key={`npm-bgcol-${color}-${idx}`}
                                  type="button"
                                  onClick={() => setSelectedColor(color)}
                                  className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                                    selectedColor === color ? 'border-indigo-500 scale-110 shadow-sm' : 'border-neutral-300 dark:border-neutral-700 hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                              
                              <button
                                type="button"
                                onClick={() => setShowColorWheel(!showColorWheel)}
                                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                                  showColorWheel ? 'border-indigo-500 scale-110' : 'border-neutral-300 dark:border-neutral-700'
                                }`}
                                style={{ background: 'conic-gradient(red, yellow, green, cyan, blue, magenta, red)' }}
                                title="Cor personalizada"
                              >
                                <Palette className="w-3 h-3 text-white drop-shadow-sm" />
                              </button>

                              {showColorWheel && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-white dark:bg-[#1a1b26] rounded-xl shadow-2xl border border-neutral-200 dark:border-[#2a2d40] z-50">
                                  <HexColorPicker color={selectedColor} onChange={setSelectedColor} />
                                  <div className="mt-2 flex gap-2">
                                    <input 
                                      type="text" 
                                      value={selectedColor} 
                                      onChange={(e) => setSelectedColor(e.target.value)}
                                      className="flex-1 px-2 py-1 text-[10px] font-mono border rounded dark:bg-neutral-900 dark:border-neutral-700"
                                    />
                                    <button onClick={() => setShowColorWheel(false)} className="px-2 py-1 text-[10px] bg-indigo-600 text-white rounded cursor-pointer">OK</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col items-center gap-2 mt-1">
                        <label className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 font-semibold text-xs transition-all border border-indigo-500/20 flex items-center gap-2">
                          <Upload className="w-3.5 h-3.5" />
                          {imageUrl ? 'Trocar imagem' : 'Escolher arquivo de imagem'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[10px] text-neutral-500">
                          Formato JPG, PNG ou GIF. Máximo 5MB.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-3 bg-neutral-50 select-none dark:border-[#26283b]/70 dark:bg-[#111219]/90">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-10 rounded-lg text-sm font-semibold border border-neutral-200 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer dark:border-[#2c2e42] dark:hover:bg-neutral-800 dark:text-neutral-400"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!platformName.trim()}
                onClick={handleNext}
                className="px-5 h-10 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Próximo →
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 h-10 rounded-lg text-sm font-semibold border border-neutral-200 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer dark:border-[#2c2e42] dark:hover:bg-neutral-800 dark:text-neutral-400"
              >
                ← Voltar
              </button>
              <button
                type="button"
                id="add-platform-confirm-btn"
                data-testid="add-platform-confirm-btn"
                disabled={isCustomProfile ? !customProfileName.trim() : !profileName}
                onClick={handleCreate}
                className="px-5 h-10 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Adicionar plataforma
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  </div>
);
};
