/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ProfilePreset, ProfileAvatar } from '../types';
import { 
  User, Mail, Lock, Eye, EyeOff, Link, AlignLeft, 
  Trash2, Bookmark, Pencil, Upload, GripVertical, 
  Square, CheckSquare, Plus, ArrowUp, ArrowDown, Search, Check, Copy, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';
import { resizeImage } from '../utils/imageHelper';
import { SmartImage, preloadImages } from './SmartImage';

interface ProfilesViewProps {
  profilePresets: ProfilePreset[];
  onAddPreset: (preset: Omit<ProfilePreset, 'id'>) => ProfilePreset;
  onUpdatePreset: (id: string, updated: Partial<ProfilePreset>) => void;
  onDeletePreset: (id: string) => void;
  onReorderPresets: (newPresets: ProfilePreset[]) => void;
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

export const ProfilesView: React.FC<ProfilesViewProps> = ({
  profilePresets,
  onAddPreset,
  onUpdatePreset,
  onDeletePreset,
  onReorderPresets
}) => {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<ProfilePreset | null>(null);

  // Preload image avatars for profile presets
  useEffect(() => {
    const avatarImages: string[] = [];
    (profilePresets || []).forEach((p) => {
      if (p.avatar?.type === 'image' && p.avatar.value) {
        avatarImages.push(p.avatar.value);
      }
    });
    preloadImages(avatarImages);
  }, [profilePresets]);
  
  // Form states
  const [isNewMode, setIsNewMode] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accessLink, setAccessLink] = useState('');
  const [description, setDescription] = useState('');

  // Avatar states
  const [avatarTab, setAvatarTab] = useState<'color' | 'emoji' | 'image'>('color');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [selectedEmoji, setSelectedEmoji] = useState('👤');
  const [imageUrl, setImageUrl] = useState('');
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [zoomInput, setZoomInput] = useState('100');

  useEffect(() => {
    setZoomInput(String(Math.round(avatarZoom * 100)));
  }, [avatarZoom]);

  // Email auto suggestions
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const emailSuggestionsRef = useRef<HTMLDivElement>(null);

  // Bulk Delete and Selection
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<string>>(new Set());

  // Copy success indicator
  const [copiedField, setCopiedField] = useState<'email' | 'username' | 'password' | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emailSuggestionsRef.current && !emailSuggestionsRef.current.contains(event.target as Node)) {
        setShowEmailSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update form fields when selectedPreset changes
  useEffect(() => {
    if (selectedPreset) {
      setIsNewMode(false);
      setProfileName(selectedPreset.name);
      setEmail(selectedPreset.email || '');
      setUsername(selectedPreset.username || '');
      setPassword(selectedPreset.password || '');
      setAccessLink(selectedPreset.accessLink || '');
      setDescription(selectedPreset.description || '');

      const avatar = selectedPreset.avatar;
      if (avatar) {
        setAvatarTab(avatar.type === 'color' ? 'color' : avatar.type === 'emoji' ? 'emoji' : 'image');
        if (avatar.type === 'color') {
          setSelectedColor(avatar.value);
        } else if (avatar.type === 'emoji') {
          setSelectedEmoji(avatar.value);
          setSelectedColor(avatar.bgColor || '#3b82f6');
        } else if (avatar.type === 'image') {
          setImageUrl(avatar.value);
          setAvatarZoom(avatar.zoom || 1);
          setSelectedColor(avatar.bgColor || '#3b82f6');
        }
      }
    } else {
      resetForm();
    }
  }, [selectedPreset]);

  const resetForm = () => {
    setProfileName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setAccessLink('');
    setDescription('');
    setAvatarTab('color');
    setSelectedColor('#3b82f6');
    setSelectedEmoji('👤');
    setImageUrl('');
    setAvatarZoom(1);
    setIsNewMode(false);
  };

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
        setAvatarTab('image');
      } catch (error) {
        addToast('Erro ao processar imagem.', 'error');
      }
    }
  };

  const handleSave = () => {
    const nameToSave = profileName.trim();
    if (!nameToSave) {
      addToast('O perfil precisa de um nome.', 'error');
      return;
    }

    const finalAvatar: ProfileAvatar = {
      type: avatarTab,
      value: avatarTab === 'color' ? selectedColor : avatarTab === 'emoji' ? selectedEmoji : imageUrl,
      bgColor: selectedColor,
      zoom: avatarTab === 'image' ? avatarZoom : undefined
    };

    if (avatarTab === 'image' && !imageUrl) {
      addToast('Insira uma URL de imagem ou faça upload de um arquivo.', 'error');
      return;
    }

    const presetData = {
      name: nameToSave,
      avatar: finalAvatar,
      email: email.trim(),
      username: username.trim(),
      password,
      accessLink: accessLink.trim(),
      description: description.trim()
    };

    if (isNewMode) {
      const newPreset = onAddPreset(presetData);
      setSelectedPreset(newPreset);
      setIsNewMode(false);
      addToast(`Perfil "${nameToSave}" criado com sucesso!`, 'success');
    } else if (selectedPreset) {
      onUpdatePreset(selectedPreset.id, presetData);
      addToast(`Perfil "${nameToSave}" atualizado com sucesso!`, 'success');
      // Refresh current preset selection to update state
      setSelectedPreset({ ...selectedPreset, ...presetData });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza de que deseja excluir o perfil "${name}"?`)) {
      onDeletePreset(id);
      if (selectedPreset?.id === id) {
        setSelectedPreset(null);
      }
      addToast(`Perfil "${name}" excluído.`, 'success');
    }
  };

  const handleBulkDelete = () => {
    if (selectedPresetIds.size === 0) return;
    if (confirm(`Deseja excluir os ${selectedPresetIds.size} perfis selecionados?`)) {
      selectedPresetIds.forEach(id => {
        onDeletePreset(id);
        if (selectedPreset?.id === id) {
          setSelectedPreset(null);
        }
      });
      addToast(`${selectedPresetIds.size} perfis excluídos com sucesso.`, 'success');
      setSelectedPresetIds(new Set());
      setIsBulkDeleteMode(false);
    }
  };

  const handleToggleSelectPreset = (id: string) => {
    setSelectedPresetIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const movePreset = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= profilePresets.length) return;

    const reordered = [...profilePresets];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;

    onReorderPresets(reordered);
    addToast('Ordem dos perfis atualizada.', 'info');
  };

  const handleCopy = (text: string, fieldName: 'email' | 'username' | 'password') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast('Copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredPresets = profilePresets.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.username && p.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Preset list */}
      <div className="lg:col-span-5 flex flex-col gap-5 bg-white dark:bg-[#111115] border border-neutral-200/80 dark:border-white/[0.04] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-white">
              Meus Perfis
            </h2>
            <p className="text-neutral-500 text-[11px] font-medium mt-0.5">
              {profilePresets.length} {profilePresets.length === 1 ? 'perfil salvo' : 'perfis salvos'} para preenchimento rápido
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsNewMode(true);
              setSelectedPreset(null);
            }}
            className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Criar Novo</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 transition-colors group-focus-within:text-indigo-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar perfis..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-indigo-500 transition-all dark:bg-neutral-900/60 dark:border-neutral-800 dark:text-neutral-200 dark:placeholder:text-neutral-600"
          />
        </div>

        {/* Bulk delete action banner */}
        <div className="flex items-center gap-2">
          {isBulkDeleteMode ? (
            <>
              {selectedPresetIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir Selecionados ({selectedPresetIds.size})
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsBulkDeleteMode(false);
                  setSelectedPresetIds(new Set());
                }}
                className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-[11px] font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </>
          ) : (
            profilePresets.length > 0 && (
              <button
                type="button"
                onClick={() => setIsBulkDeleteMode(true)}
                className="px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-800"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Selecionar vários
              </button>
            )
          )}
        </div>

        {/* Preset List */}
        <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredPresets.map((preset, idx) => {
            const isSelected = selectedPreset?.id === preset.id && !isNewMode;
            const isChecked = selectedPresetIds.has(preset.id);

            // Determine background color of avatar
            const avatar = preset.avatar;
            const isImg = avatar?.type === 'image' || (avatar?.value && (
              avatar.value.startsWith('http') ||
              avatar.value.startsWith('data:') ||
              avatar.value.startsWith('blob:') ||
              avatar.value.startsWith('/')
            ));
            const isEmoji = avatar?.type === 'emoji' && avatar?.value && !isImg;
            const bgColor = avatar?.bgColor || '#6366f1';

            return (
              <div
                key={`pv-preset-${preset.id}-${idx}`}
                onClick={() => {
                  if (isBulkDeleteMode) {
                    handleToggleSelectPreset(preset.id);
                  } else {
                    setSelectedPreset(preset);
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                  isSelected 
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-500/35 shadow-sm' 
                    : 'bg-white hover:bg-neutral-50 dark:bg-neutral-900/40 dark:hover:bg-neutral-800/20 border-neutral-100 dark:border-neutral-800/60'
                }`}
              >
                {/* Select Checkbox */}
                {isBulkDeleteMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelectPreset(preset.id);
                    }}
                    className="p-1 rounded text-neutral-400 hover:text-indigo-600 shrink-0 cursor-pointer"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-300 dark:text-neutral-700" />
                    )}
                  </button>
                )}

                {/* Avatar Preview */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner shrink-0 overflow-hidden"
                  style={{
                    backgroundColor: isImg && avatar?.value ? 'transparent' : bgColor
                  }}
                >
                  {isEmoji ? (
                    avatar.value
                  ) : isImg && avatar?.value ? (
                    <SmartImage
                      src={avatar.value}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                      style={{ transform: `scale(${avatar.zoom || 1})` }}
                    />
                  ) : (
                    <span className="text-white font-bold">{preset.name ? preset.name.slice(0, 2).toUpperCase() : 'PF'}</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-neutral-800 dark:text-white truncate">
                    {preset.name}
                  </span>
                  {(preset.email || preset.username) && (
                    <span className="block text-[10px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                      {preset.email || preset.username}
                    </span>
                  )}
                </div>

                {/* Reorder and Delete Controls */}
                {!isBulkDeleteMode && (
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => movePreset(idx, 'up')}
                      className="p-1 rounded text-neutral-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors cursor-pointer"
                      title="Mover para Cima"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === profilePresets.length - 1}
                      onClick={() => movePreset(idx, 'down')}
                      className="p-1 rounded text-neutral-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors cursor-pointer"
                      title="Mover para Baixo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(preset.id, preset.name)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                      title="Excluir Perfil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {filteredPresets.length === 0 && (
            <div className="text-center py-10 text-neutral-500 text-xs italic">
              {searchQuery ? 'Nenhum perfil corresponde à busca.' : 'Nenhum perfil cadastrado. Clique em "+ Criar Novo".'}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Add/Edit Form */}
      <div className="lg:col-span-7 bg-white dark:bg-[#111115] border border-neutral-200/80 dark:border-white/[0.04] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-6">
        {selectedPreset || isNewMode ? (
          <>
            {/* Header Form */}
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/40 pb-4">
              <div>
                <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-white">
                  {isNewMode ? 'Novo Perfil Preset' : `Configuração: ${profileName}`}
                </h2>
                <p className="text-neutral-500 text-[11px] font-medium mt-0.5">
                  Estes dados serão sugeridos ao adicionar novas contas nas plataformas
                </p>
              </div>

              {/* Avatar Live Preview Badge */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md border-2 border-indigo-200 dark:border-indigo-500/30 overflow-hidden shrink-0"
                style={{
                  backgroundColor: selectedColor,
                }}
                title="Visualização em tempo real do Avatar"
              >
                {avatarTab === 'emoji' && selectedEmoji ? (
                  selectedEmoji
                ) : avatarTab === 'image' && imageUrl ? (
                  <SmartImage
                    src={imageUrl}
                    alt="preview"
                    className="w-full h-full object-cover"
                    style={{ transform: `scale(${avatarZoom})` }}
                  />
                ) : (
                  (profileName || 'P').slice(0, 2).toUpperCase()
                )}
              </div>
            </div>

            {/* Input Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Profile Name */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Nome do perfil <span className="text-[10px] font-normal text-rose-500 dark:text-rose-400">(obrigatório)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Ex: Pessoal, Trabalho, Premium..."
                    className="w-full h-10 pl-9 pr-4 rounded-xl text-xs bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-neutral-900 dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  E-mail <span className="text-[10px] font-normal text-neutral-400">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="exemplo@email.com"
                    className="w-full h-10 pl-9 pr-10 rounded-xl text-xs bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-neutral-900 dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                  {email && (
                    <button
                      type="button"
                      onClick={() => handleCopy(email, 'email')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      title="Copiar e-mail"
                    >
                      {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Email suggestions */}
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
                        className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono transition-colors cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Nome de usuário <span className="text-[10px] font-normal text-neutral-400">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nome de usuário"
                    className="w-full h-10 pl-9 pr-10 rounded-xl text-xs bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-neutral-900 dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                  {username && (
                    <button
                      type="button"
                      onClick={() => handleCopy(username, 'username')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      title="Copiar usuário"
                    >
                      {copiedField === 'username' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Senha <span className="text-[10px] font-normal text-neutral-400">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Salvar senha..."
                    className="w-full h-10 pl-9 pr-16 rounded-xl text-xs bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-neutral-900 dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {password && (
                      <button
                        type="button"
                        onClick={() => handleCopy(password, 'password')}
                        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                        title="Copiar senha"
                      >
                        {copiedField === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Access Link */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Link de login <span className="text-[10px] font-normal text-neutral-400">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Link className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={accessLink}
                    onChange={(e) => setAccessLink(e.target.value)}
                    placeholder="https://exemplo.com/login"
                    className="w-full h-10 pl-9 pr-4 rounded-xl text-xs bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-neutral-900 dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Rascunho / Descrição
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-neutral-400">
                    <AlignLeft className="w-4 h-4" />
                  </span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Anotações adicionais, observações de segurança..."
                    className="w-full h-20 pl-9 pr-4 py-2 rounded-xl text-xs bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-neutral-900 dark:border-[#2a2d40] dark:text-neutral-200 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Avatar Selection Section */}
            <div className="flex flex-col gap-3 p-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 dark:border-white/[0.04] dark:bg-neutral-950/20">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Customizar Avatar
                </label>

                {/* Tab Switcher */}
                <div className="flex bg-neutral-200/60 dark:bg-neutral-900 p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setAvatarTab('color')}
                    className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      avatarTab === 'color'
                        ? 'bg-white dark:bg-[#13141c] text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Cor
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarTab('emoji')}
                    className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      avatarTab === 'emoji'
                        ? 'bg-white dark:bg-[#13141c] text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Emoji
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarTab('image')}
                    className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      avatarTab === 'image'
                        ? 'bg-white dark:bg-[#13141c] text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Imagem
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="pt-2">
                {avatarTab === 'color' && (
                  <div className="flex flex-col gap-3">
                    {/* Preset Colors Grid */}
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className="w-7 h-7 rounded-full cursor-pointer transition-all border-2 border-transparent hover:scale-110 flex items-center justify-center shrink-0 shadow-sm"
                          style={{ 
                            backgroundColor: c,
                            borderColor: selectedColor === c ? '#fff' : 'transparent',
                            boxShadow: selectedColor === c ? '0 0 0 2px #4f46e5' : 'none'
                          }}
                        />
                      ))}
                    </div>

                    {/* Native Hex Picker */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Hex customizado:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="w-8 h-8 rounded border-none cursor-pointer overflow-hidden p-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={selectedColor}
                          onChange={(e) => {
                            if (/^#[0-9A-F]{0,6}$/i.test(e.target.value)) {
                              setSelectedColor(e.target.value);
                            }
                          }}
                          placeholder="#ffffff"
                          maxLength={7}
                          className="w-20 h-8 px-2 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono font-medium text-neutral-800 dark:text-neutral-200 text-center uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {avatarTab === 'emoji' && (
                  <div className="flex flex-col gap-3">
                    {/* Preset Emojis Grid */}
                    <div className="grid grid-cols-10 gap-2 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-h-[120px] overflow-y-auto">
                      {PRESET_EMOJIS.map(em => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setSelectedEmoji(em)}
                          className={`text-lg p-1.5 rounded-lg cursor-pointer transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 text-center ${
                            selectedEmoji === em ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 scale-105' : 'border border-transparent'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>

                    {/* Emoji Background Selection */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Fundo do Emoji:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_COLORS.slice(0, 7).map(c => (
                          <button
                            key={`emoji-bg-${c}`}
                            type="button"
                            onClick={() => setSelectedColor(c)}
                            className="w-5 h-5 rounded-full cursor-pointer transition-all hover:scale-110"
                            style={{ 
                              backgroundColor: c,
                              boxShadow: selectedColor === c ? '0 0 0 2px #4f46e5' : 'none'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {avatarTab === 'image' && (
                  <div className="flex flex-col gap-3">
                    {/* File Dropzone & Image URL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex flex-col items-center justify-center h-20 border border-dashed border-neutral-200 dark:border-neutral-800 hover:border-indigo-500 dark:hover:border-indigo-500/50 rounded-xl cursor-pointer bg-white dark:bg-neutral-900 transition-colors">
                        <Upload className="w-4 h-4 text-neutral-500 mb-1" />
                        <span className="text-[10px] text-neutral-400 font-medium">Fazer upload de imagem...</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>

                      <div className="flex flex-col justify-center gap-1">
                        <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Ou insira a URL da imagem:</span>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://exemplo.com/avatar.jpg"
                          className="w-full h-8 px-2 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-[#2a2d40] text-[10px] text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Image Avatar Background Color */}
                    <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
                      <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Cor de Fundo da Imagem</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-7 h-7 rounded-full border border-neutral-200 dark:border-neutral-700 shrink-0 shadow-sm transition-transform flex items-center justify-center text-white relative overflow-hidden"
                          style={{ backgroundColor: selectedColor }}
                          title="Cor atual de fundo"
                        >
                          <Palette className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="color"
                          value={selectedColor.startsWith('#') && selectedColor.length === 7 ? selectedColor : '#6366f1'}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="w-7 h-7 rounded-md cursor-pointer border border-neutral-200 dark:border-neutral-700 bg-transparent p-0.5 shrink-0"
                          title="Abrir seletor de cores"
                        />
                        <input
                          type="text"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          placeholder="#6366f1"
                          className="w-20 h-7 px-2 rounded text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500"
                          title="Digite o código HEX da cor (ex: #6366F1)"
                        />
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={`pv-img-bg-${c}`}
                              type="button"
                              onClick={() => setSelectedColor(c)}
                              className={`w-5 h-5 rounded-full border border-neutral-200/40 cursor-pointer shadow-sm transition-transform hover:scale-110 ${
                                selectedColor === c ? 'ring-2 ring-indigo-500 scale-105' : ''
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {imageUrl && (
                      <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">
                          <span>Zoom da Imagem</span>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                              <input
                                type="number"
                                min="10"
                                max="500"
                                value={zoomInput}
                                onChange={(e) => {
                                  const str = e.target.value;
                                  setZoomInput(str);
                                  const val = parseInt(str);
                                  if (!isNaN(val) && val >= 10 && val <= 500) {
                                    setAvatarZoom(val / 100);
                                  }
                                }}
                                onBlur={() => {
                                  const val = parseInt(zoomInput);
                                  if (zoomInput === '' || isNaN(val)) {
                                    setZoomInput(String(Math.round(avatarZoom * 100)));
                                  } else {
                                    const clamped = Math.max(10, Math.min(500, val));
                                    setZoomInput(String(clamped));
                                    setAvatarZoom(clamped / 100);
                                  }
                                }}
                                className="w-10 text-center text-xs font-mono bg-transparent text-neutral-800 dark:text-neutral-200 focus:outline-none"
                                title="Digite o zoom de 10% a 500%"
                              />
                              <span className="text-[10px] text-neutral-500 font-mono">%</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                setAvatarZoom(1);
                                setZoomInput('100');
                              }}
                              className="text-[9px] text-indigo-500 hover:underline cursor-pointer"
                            >
                              Resetar
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.01"
                          value={avatarZoom}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setAvatarZoom(val);
                            setZoomInput(String(Math.round(val * 100)));
                          }}
                          className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700 accent-indigo-600"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/40">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Bookmark className="w-4 h-4 fill-current" />
                <span>Salvar Perfil</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 select-none">
            <User className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mb-4 stroke-[1.5]" />
            <h3 className="font-sans font-bold text-neutral-800 dark:text-neutral-300 text-sm">
              Nenhum perfil selecionado
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1.5 text-center max-w-xs leading-relaxed">
              Selecione um perfil na lista ao lado para editar suas configurações ou clique em <strong>"+ Criar Novo"</strong> para adicionar um novo perfil padrão.
            </p>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsNewMode(true);
                setSelectedPreset(null);
              }}
              className="mt-6 h-10 px-5 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Criar Perfil Preset</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
