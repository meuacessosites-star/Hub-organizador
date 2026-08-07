/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Category, ProfileAvatar, Platform, Profile, ProfilePreset } from '../types';
import { X, Globe, Link, Eye, EyeOff, Search, Bookmark, Upload, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { getLogoUrl, getInitials, getPlatformColor, getPlatformNameFromUrl } from '../utils/logoHelper';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CategoryIcon } from './CategoryIcon';
import { SmartImage } from './SmartImage';
import { safeParse, safeSetItem } from '../lib/utils';
import { useStorage } from '../hooks/useStorage';
import { resizeImage } from '../utils/imageHelper';

const EMAIL_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com.br',
  'yahoo.com',
  'icloud.com',
  'uol.com.br',
  'bol.com.br',
  'terra.com.br',
  'outlook.com.br',
  'hotmail.com.br'
];

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
  onManageProfiles?: () => void;
}

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
  onManageProfiles,
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { profilePresets } = useStorage();
  
  const getCustomPresetsKey = () => user ? `hub_user_${user.uid}_custom_presets` : 'hub_custom_presets';

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
  const [profileName, setProfileName] = useState(() => {
    if (profilePresets && profilePresets.length > 0) return profilePresets[0].name;
    return 'Pessoal';
  });
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const emailSuggestionsRef = useRef<HTMLDivElement>(null);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const atIndex = val.indexOf('@');
    if (atIndex > -1) {
      const localPart = val.substring(0, atIndex);
      const domainPart = val.substring(atIndex + 1).toLowerCase();
      
      if (localPart && !localPart.includes(' ')) {
        const filteredDomains = EMAIL_DOMAINS.filter(domain => 
          domain.startsWith(domainPart)
        );
        
        const suggestions = filteredDomains.map(domain => `${localPart}@${domain}`);
        setEmailSuggestions(suggestions);
        setShowEmailSuggestions(suggestions.length > 0);
      } else {
        setShowEmailSuggestions(false);
      }
    } else {
      setShowEmailSuggestions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emailSuggestionsRef.current && !emailSuggestionsRef.current.contains(event.target as Node)) {
        setShowEmailSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setShowEmailSuggestions(false);
    }
  }, [isOpen]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accessLink, setAccessLink] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<ProfileAvatar | null>(() => {
    if (profilePresets && profilePresets.length > 0) return profilePresets[0].avatar;
    return null;
  });

  const [categorySearch, setCategorySearch] = useState('');
  const [isAccessLinkEdited, setIsAccessLinkEdited] = useState(false);

  // Auto-fill access link in Step 2 when platform URL is filled
  useEffect(() => {
    if (!isAccessLinkEdited && platformUrl) {
      setAccessLink(platformUrl);
    }
  }, [platformUrl, isAccessLinkEdited]);

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
    try {
      const formatted = url.startsWith('http') ? url : `https://${url}`;
      new URL(formatted);
      return true;
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

    setUrlError('');
    setStep(2);
  };

  const handlePrev = () => {
    setStep(1);
  };

  const handleCreate = () => {
    if (!profileName.trim()) return;

    const firstProfile: Omit<Profile, 'id'> = {
      name: profileName,
      username: username,
      email: email,
      password: password,
      accessLink: accessLink,
      description: description,
      avatar: selectedAvatar || (profilePresets[0]?.avatar ?? {
        type: 'emoji',
        value: '👤',
        bgColor: '#7c5cfc',
      }),
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
    setUsername('');
    setEmail('');
    setShowEmailSuggestions(false);
    setPassword('');
    setAccessLink('');
    setDescription('');
    setSelectedAvatar(null);
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
                        
                        // Extract name part from URL and pre-fill the name
                        if (val.includes('.')) {
                          const inferredName = getPlatformNameFromUrl(val);
                          // Pre-fill if current name is empty, is the default placeholder, or is short (<= 3 chars, e.g. "Pt" or "br")
                          if (inferredName && (!platformName.trim() || platformName === 'Plataforma' || platformName.length <= 3)) {
                            setPlatformName(inferredName);
                          }
                        }
                      }}
                      placeholder="exemplo.com"
                      className="w-full h-11 pl-10 pr-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#0d0d0d] dark:border-white/[0.08] dark:text-neutral-200 dark:placeholder-neutral-500"
                    />
                  </div>
                  {urlError && <p className="text-[10px] text-rose-500 font-medium">{urlError}</p>}
                </div>

                {/* Logo Selection Section */}
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 dark:border-white/[0.06] dark:bg-[#111219]/30">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                      <span>Logo da plataforma</span>
                      <div className="w-6 h-6 rounded-full bg-white dark:bg-[#1e202e] border border-neutral-200 dark:border-white/[0.1] flex items-center justify-center overflow-hidden shadow-sm">
                        {computedLogoUrl ? (
                          <SmartImage
                            src={computedLogoUrl}
                            alt=""
                            className="w-4 h-4 object-contain"
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                            {platformName ? getInitials(platformName) : '🌐'}
                          </span>
                        )}
                      </div>
                    </label>

                    {/* Logo Mode Tabs */}
                    <div className="flex bg-neutral-200/70 dark:bg-neutral-800 p-0.5 rounded-lg text-[10px]">
                      <button
                        type="button"
                        onClick={() => setLogoMode('auto')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          logoMode === 'auto'
                            ? 'bg-white dark:bg-[#13141c] text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        Automática
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoMode('presets')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          logoMode === 'presets'
                            ? 'bg-white dark:bg-[#13141c] text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        Padrões
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoMode('url')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          logoMode === 'url'
                            ? 'bg-white dark:bg-[#13141c] text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoMode('upload')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          logoMode === 'upload'
                            ? 'bg-white dark:bg-[#13141c] text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        Upload
                      </button>
                    </div>
                  </div>

                  {/* Logo Mode Content */}
                  <div className="pt-1">
                    {logoMode === 'auto' && (
                      <div className="text-[11px] text-neutral-500 bg-neutral-50 p-3 rounded-xl border border-neutral-200 dark:bg-[#000000]/55 dark:border-[#2a2d40]/40">
                        💡 O sistema busca a logo oficial automaticamente com base no nome ou URL.
                      </div>
                    )}

                    {logoMode === 'presets' && (
                      <div className="flex flex-col gap-3">
                        {customPresets.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Meus Padrões Salvos</span>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 max-h-[110px] overflow-y-auto p-1.5 rounded-lg border border-neutral-200 bg-neutral-50 dark:border-[#2a2d40]/70 dark:bg-[#000000]/50">
                              {customPresets.map((preset, idx) => (
                                <button
                                  key={`cp-${idx}-${preset.name}`}
                                  type="button"
                                  onClick={() => handleSelectPreset(preset)}
                                  className="flex flex-col items-center justify-center p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 dark:border-[#2a2d40] dark:bg-[#13141c]/40 dark:text-neutral-400 cursor-pointer hover:border-indigo-500"
                                >
                                  <SmartImage src={preset.logoUrl} alt={preset.name} className="w-5 h-5 object-contain rounded" />
                                  <span className="text-[8px] mt-1 font-medium truncate w-full">{preset.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Padrões Populares</span>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 max-h-[135px] overflow-y-auto p-1.5 rounded-lg border border-neutral-200 bg-neutral-50 dark:border-[#2a2d40]/70 dark:bg-[#111219]/50">
                            {POPULAR_PRESETS.map((preset) => {
                              const presetLogoUrl = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${preset.domain}&size=256`;
                              return (
                                <button
                                  key={preset.domain}
                                  type="button"
                                  onClick={() => handleSelectPreset(preset)}
                                  className="flex flex-col items-center justify-center p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 dark:border-[#2a2d40] dark:bg-[#13141c]/40 dark:text-neutral-400 cursor-pointer hover:border-indigo-500"
                                >
                                  <SmartImage src={presetLogoUrl} alt={preset.name} className="w-5 h-5 object-contain rounded" />
                                  <span className="text-[8px] mt-1 font-medium truncate w-full">{preset.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {logoMode === 'url' && (
                      <div className="flex flex-col gap-2">
                        <input
                          type="url"
                          value={logoUrlInput}
                          onChange={(e) => setLogoUrlInput(e.target.value)}
                          placeholder="https://exemplo.com/logo.png"
                          className="w-full h-10 px-3 rounded-lg text-xs bg-neutral-50 border border-neutral-200 dark:bg-[#111219] dark:border-[#2a2d40] text-neutral-800 dark:text-neutral-200"
                        />
                      </div>
                    )}

                    {logoMode === 'upload' && (
                      <div className="flex flex-col gap-1.5">
                        <label className="flex flex-col items-center justify-center h-16 border border-dashed border-neutral-200 hover:border-indigo-500 rounded-lg cursor-pointer bg-neutral-50 dark:border-[#2a2d40] dark:bg-[#111219]/40">
                          <Upload className="w-4 h-4 text-neutral-500 mb-1" />
                          <span className="text-[10px] text-neutral-400 font-medium">Escolher imagem local...</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handlePlatformLogoUpload} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Selection */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Categoria</label>
                    <div className="relative group max-w-[180px]">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500">
                        <Search className="w-3 h-3" />
                      </span>
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Filtrar categorias..."
                        className="w-full h-7 pl-8 pr-2 rounded-md bg-neutral-100 dark:bg-[#000000] border border-neutral-200 dark:border-[#2a2d40] text-[10px] text-neutral-700 dark:text-neutral-300"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {categories
                      .filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                      .map((cat) => {
                        const isSel = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 cursor-pointer ${
                              isSel
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-600 dark:bg-indigo-600/15 dark:border-indigo-500 dark:text-indigo-400'
                                : 'bg-neutral-50 border-neutral-200 text-neutral-600 dark:bg-[#000000] dark:border-[#2a2d40] dark:text-neutral-400'
                            }`}
                          >
                            <CategoryIcon icon={cat.icon} className="w-3.5 h-3.5" />
                            <span>{cat.name}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Save as preset checkbox */}
                <div className="flex items-center gap-2 mt-2 bg-neutral-50 dark:bg-[#000000]/50 border border-neutral-200/60 dark:border-[#2a2d40]/40 rounded-xl p-3">
                  <input
                    type="checkbox"
                    id="saveAsPreset"
                    checked={saveAsPreset}
                    onChange={(e) => setSaveAsPreset(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-neutral-300 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                  />
                  <label htmlFor="saveAsPreset" className="text-xs font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
                    Salvar esta plataforma nos meus padrões
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="flex flex-col gap-4.5">
                {/* Select ready-made profile preset */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                      Perfis salvos (Selecione um perfil)
                    </label>
                    <button
                      type="button"
                      onClick={onManageProfiles}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      ⚙️ Gerenciar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {profilePresets.map((preset) => {
                      const isSel = profileName === preset.name;
                      return (
                        <button
                          key={`preset-chip-${preset.id}`}
                          type="button"
                          onClick={() => {
                            setProfileName(preset.name);
                            if (preset.email) setEmail(preset.email);
                            if (preset.username) setUsername(preset.username);
                            if (preset.password) setPassword(preset.password);
                            if (preset.accessLink) {
                              setAccessLink(preset.accessLink);
                              setIsAccessLinkEdited(true);
                            }
                            if (preset.description) setDescription(preset.description);
                            if (preset.avatar) setSelectedAvatar(preset.avatar);
                            addToast(`Perfil "${preset.name}" selecionado!`, 'info');
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
                            {(() => {
                              const av = preset.avatar;
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
                                    alt=""
                                    className="w-full h-full object-cover"
                                    style={{ transform: `scale(${av.zoom || 1})` }}
                                  />
                                );
                              }
                              if (isEmoji && av?.value) {
                                return av.value;
                              }
                              return preset.name.slice(0, 2).toUpperCase();
                            })()}
                          </div>
                          {preset.name}
                        </button>
                      );
                    })}
                    {profilePresets.length === 0 && (
                      <p className="text-[10px] text-neutral-500 italic">
                        Nenhum perfil salvo. Gerencie seus perfis na aba de perfil.
                      </p>
                    )}
                  </div>
                </div>

                {/* Profile Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Nome do perfil
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Ex: Pessoal, Trabalho..."
                    className="w-full h-11 px-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                </div>

                {/* E-mail */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    E-mail <span className="text-[10px] font-normal text-neutral-400">(opcional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="exemplo@email.com"
                      className="w-full h-11 pl-10 pr-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                    />
                  </div>

                  {showEmailSuggestions && emailSuggestions.length > 0 && (
                    <div 
                      ref={emailSuggestionsRef}
                      className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#131520] border border-neutral-200 dark:border-[#2a2d40] rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-neutral-100 dark:divide-[#2a2d40]"
                    >
                      {emailSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setEmail(suggestion);
                            setShowEmailSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono transition-colors cursor-pointer"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Usuário */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Usuário <span className="text-[10px] font-normal text-neutral-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nome de usuário"
                    className="w-full h-11 px-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                </div>

                {/* Senha */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Senha <span className="text-[10px] font-normal text-neutral-400">(opcional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Senha..."
                      className="w-full h-11 pl-4 pr-11 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Link de acesso */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Link de acesso <span className="text-[10px] font-normal text-neutral-400">(opcional)</span>
                  </label>
                  <input
                    type="url"
                    value={accessLink}
                    onChange={(e) => {
                      setAccessLink(e.target.value);
                      setIsAccessLinkEdited(true);
                    }}
                    placeholder="https://exemplo.com/login"
                    className="w-full h-11 px-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                </div>

                {/* Rascunho / Descrição */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Rascunho / Descrição
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Anotações, observações..."
                    className="w-full h-20 p-3 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation Buttons */}
          <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-white/[0.08] flex items-center justify-between bg-neutral-50 dark:bg-[#0d0d0d]">
            {step === 2 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                ← Voltar
              </button>
            ) : <div />}

            {step === 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!platformName.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              >
                Avançar →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                disabled={!profileName.trim()}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              >
                Adicionar plataforma
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
