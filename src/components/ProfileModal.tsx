import { resizeImage } from "../utils/imageHelper";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Profile, Platform, ProfileAvatar, ProfilePreset } from '../types';
import { X, User, Mail, Lock, Eye, EyeOff, Link, AlignLeft, Palette, Smile, Image as ImageIcon, Copy, Check, Trash2, Bookmark, Pencil, Upload, RefreshCw, GripVertical, Square, CheckSquare, Plus } from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { useToast } from '../context/ToastContext';
import { safeParse, safeSetItem, safeUrl } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useStorage, deduplicatePresets } from '../hooks/useStorage';
import { SmartImage } from './SmartImage';
import { AvatarFrame, defaultAvatarFrame, AVATAR_FRAME_MODELS, AVATAR_FRAME_MODEL_LABELS, MAX_AVATAR_FRAME_COLORS, AvatarFrameSettings } from './AvatarFrame';
import { AvatarFrameGallery } from './AvatarFrameGallery';

function FrameColorControls({ frame, onChange }: { frame: AvatarFrameSettings; onChange: (frame: AvatarFrameSettings) => void }) {
  const colors = (frame.colors?.length ? frame.colors : ['#A99AE8']).slice(0, MAX_AVATAR_FRAME_COLORS);
  const [activeColor, setActiveColor] = React.useState(0);
  const [expanded, setExpanded] = React.useState(false);
  const selectedIndex = Math.min(activeColor, colors.length - 1);
  const selected = colors[selectedIndex];
  const [hexInput, setHexInput] = React.useState(selected);
  React.useEffect(() => { setHexInput(selected); }, [selected, selectedIndex]);
  const updateColor = (value: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(value)) return;
    const next = [...colors];
    next[selectedIndex] = value.toUpperCase();
    onChange({ ...frame, colors: next });
  };
  const addColor = () => {
    if (colors.length >= MAX_AVATAR_FRAME_COLORS) return;
    const suggestions = ['#F2B8D0','#80B9E9','#79C9AD','#F5C86E','#EF9494','#A99AE8','#E7A2BD','#FFFFFF','#161616','#106EBD','#C48FF0'];
    onChange({ ...frame, colors: [...colors, suggestions[(colors.length - 1) % suggestions.length]] });
    setActiveColor(colors.length);
    setExpanded(true);
  };
  const removeColor = () => {
    if (colors.length <= 1) return;
    onChange({ ...frame, colors: colors.filter((_, i) => i !== selectedIndex) });
    setActiveColor(0);
  };
  return (
    <section className="rounded-xl border border-indigo-200/60 dark:border-indigo-500/20 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-100">Cores da moldura</p>
          <p className="text-[10px] text-neutral-500">Uma cor ou combinação de até 12 tonalidades.</p>
        </div>
        <button type="button" onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          className="shrink-0 rounded-lg border border-indigo-500/30 px-3 py-2 text-[11px] font-semibold text-indigo-500">
          {expanded ? 'Recolher' : 'Escolher cor'}
        </button>
      </div>
      <div className="flex items-center flex-wrap gap-2">
        {colors.map((color, index) => (
          <button key={index} type="button" onClick={() => { setActiveColor(index); setExpanded(true); }}
            aria-label={`Editar cor ${index + 1}`} aria-pressed={selectedIndex === index}
            className={`rounded-lg border px-2 py-1.5 flex items-center gap-2 text-[10px] font-semibold text-neutral-700 dark:text-neutral-200 ${selectedIndex === index ? 'border-indigo-500' : 'border-neutral-200 dark:border-neutral-700'}`}>
            <span className="w-6 h-6 rounded-full border border-black/10" style={{ backgroundColor: color }} />Cor {index + 1}
          </button>
        ))}
        {colors.length < MAX_AVATAR_FRAME_COLORS && <button type="button" onClick={addColor} className="rounded-lg border border-dashed border-indigo-400/60 px-2.5 py-2 text-[10px] font-semibold text-indigo-500">+ Adicionar cor</button>}
      </div>
      {expanded && (
        <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex justify-center"><HexColorPicker color={selected} onChange={updateColor} style={{ width: 'min(100%, 220px)', height: 140 }} /></div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-neutral-600 dark:text-neutral-300 shrink-0">HEX
              <input type="text" value={hexInput} maxLength={7}
                onChange={event => { const value = event.target.value; setHexInput(value); updateColor(value); }}
                onBlur={() => setHexInput(selected)}
                className="ml-2 w-28 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#15161e] px-2 py-2 text-xs text-neutral-900 dark:text-white" placeholder="#A99AE8" />
            </label>
            <input aria-label="Escolher cor personalizada" type="color" value={selected} onChange={event => updateColor(event.target.value)} className="w-10 h-9 shrink-0 cursor-pointer" />
            {colors.length > 1 && <button type="button" onClick={removeColor} className="ml-auto text-[10px] text-red-400">Remover cor</button>}
          </div>
          <div className="flex flex-wrap gap-2">
            {['#E7A2BD','#A99AE8','#80B9E9','#79C9AD','#F5C86E','#EF9494','#FFFFFF','#161616'].map(color => (
              <button key={color} type="button" title={color} aria-label={`Usar cor ${color}`} onClick={() => updateColor(color)}
                className="w-7 h-7 rounded-full border border-neutral-300 dark:border-neutral-600" style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform?: Platform | null;
  profile?: Profile | null; // If null, mode is "add"
  onSave?: (profileData: Omit<Profile, 'id'>) => void;
  onEdit?: (profileId: string, profileData: Partial<Profile>) => void;
  onDelete?: (profileId: string) => void;
  startInEditMode?: boolean;
  openPresetsManager?: boolean;
  openFrameCustomizer?: boolean;
  onManageProfiles?: () => void;
}

const PRESET_PROFILE_NAMES = [
  'Pessoal',
  'Trabalho',
  'Família',
  'Estudos',
  'Freelance',
  'Empresa',
];

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

interface PresetReorderItemProps {
  preset: ProfilePreset;
  isEditing?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  liveAvatar?: ProfileAvatar;
  liveName?: string;
  onEdit: (preset: ProfilePreset) => void;
  onDelete: (preset: ProfilePreset) => void;
}

const PresetReorderItem: React.FC<PresetReorderItemProps> = ({ preset, isEditing, isSelected, onToggleSelect, liveAvatar, liveName, onEdit, onDelete }) => {
  const dragControls = useDragControls();

  const activeAvatar = isEditing && liveAvatar ? liveAvatar : preset.avatar;
  const activeName = isEditing && liveName !== undefined ? liveName : preset.name;

  const isHex = (val?: string) => val && /^#([0-9A-F]{3}){1,2}$/i.test(val);
  const bgColor = isHex(activeAvatar?.bgColor) 
    ? activeAvatar.bgColor 
    : isHex(activeAvatar?.value) 
      ? activeAvatar.value 
      : '#6366f1';

  const isImg = activeAvatar?.type === 'image' || (activeAvatar?.value && (
    activeAvatar.value.startsWith('http') ||
    activeAvatar.value.startsWith('data:') ||
    activeAvatar.value.startsWith('blob:') ||
    activeAvatar.value.startsWith('/')
  ));

  const isEmoji = activeAvatar?.type === 'emoji' && activeAvatar?.value && !isImg;

  return (
    <Reorder.Item
      value={preset}
      dragListener={false}
      dragControls={dragControls}
      className={`flex items-center min-w-0 w-full gap-2 p-2 rounded-lg border shadow-sm select-none transition-all ${
        isEditing 
          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500/50 ring-1 ring-indigo-500/20' 
          : 'bg-white dark:bg-[#13141c] border-neutral-100 dark:border-[#2a2d40]/40'
      }`}
    >
      {/* Drag Handle Icon */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-grab active:cursor-grabbing touch-none shrink-0"
        title="Tocar e arrastar para reordenar"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Select Checkbox for bulk deletion */}
      {onToggleSelect && (
        <button
          type="button"
          onClick={onToggleSelect}
          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer shrink-0"
          title="Selecionar para exclusão em massa"
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
          )}
        </button>
      )}

      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0 overflow-hidden"
        style={{
          backgroundColor: isImg && activeAvatar?.value ? 'transparent' : (activeAvatar?.bgColor || (activeAvatar?.type === 'color' ? activeAvatar.value : bgColor))
        }}
      >
        {isEmoji ? (
          activeAvatar.value
        ) : isImg && activeAvatar?.value ? (
          <SmartImage
            src={activeAvatar.value}
            alt={activeName}
            className="w-full h-full object-cover"
            style={{ transform: `scale(${activeAvatar.zoom || 1})` }}
          />
        ) : (
          <span className="text-white font-bold">{activeName ? activeName.slice(0, 2).toUpperCase() : 'PF'}</span>
        )}
      </div>
      <span className="flex-1 min-w-0 text-xs font-medium truncate">{activeName}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(preset)}
          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
            isEditing 
              ? 'bg-indigo-600 text-white' 
              : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20'
          }`}
          title="Editar preset"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(preset)}
          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
          title="Excluir preset"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </Reorder.Item>
  );
};

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

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  platform,
  profile,
  onSave,
  onEdit,
  onDelete,
  startInEditMode = false,
  openPresetsManager = false,
  openFrameCustomizer = false,
  onManageProfiles,
}) => {
  const isEditMode = !!profile;
  const { addToast } = useToast();
  const { user } = useAuth();
  const { platforms, profilePresets, saveProfilePresets, addProfilePreset } = useStorage();
  
  const [localProfilePresets, setLocalProfilePresets] = useState<ProfilePreset[]>([]);
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [isEditingNamesList, setIsEditingNamesList] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      const syncedPresets = deduplicatePresets(profilePresets || []);
      setLocalProfilePresets(syncedPresets);

      if (!prevIsOpenRef.current || openPresetsManager) {
        setSelectedPresetIds(new Set());
        setShowBulkDelete(false);
        
        if (openPresetsManager) {
          setIsEditingNamesList(true);
          setIsEditingInView(true);
          if (!editingPresetId || editingPresetId === 'new_preset_creation_mode') {
            setEditingPresetId('new_preset_creation_mode');
            setProfileName('');
            setSelectedColor('#7c5cfc');
            setSelectedEmoji('👤');
            setImageUrl('');
            setAvatarZoom(1);
            setAvatarTab('color');
          }
        }
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, openPresetsManager, profilePresets, editingPresetId]);
  
  const movePresetUp = (index: number) => {
    if (index <= 0) return;
    const newPresets = [...localProfilePresets];
    const temp = newPresets[index];
    newPresets[index] = newPresets[index - 1];
    newPresets[index - 1] = temp;
    setLocalProfilePresets(newPresets);
    saveProfilePresets(newPresets);
  };

  const movePresetDown = (index: number) => {
    if (index >= localProfilePresets.length - 1) return;
    const newPresets = [...localProfilePresets];
    const temp = newPresets[index];
    newPresets[index] = newPresets[index + 1];
    newPresets[index + 1] = temp;
    setLocalProfilePresets(newPresets);
    saveProfilePresets(newPresets);
  };
  
  const getProfileNamesKey = () => user ? `hub_user_${user.uid}_profile_names` : 'hub_profile_names';

  const editingFormRef = useRef<HTMLDivElement>(null);
  const profileNameInputRef = useRef<HTMLInputElement>(null);

  const handleSelectPresetForEditing = (preset: ProfilePreset) => {
    setEditingPresetId(preset.id);
    setProfileName(preset.name);
    if (preset.avatar.bgColor) {
      setSelectedColor(preset.avatar.bgColor);
    } else if (preset.avatar.type === 'color') {
      setSelectedColor(preset.avatar.value);
    }
    
    if (preset.avatar.type === 'emoji') {
      setAvatarTab('emoji');
      setSelectedEmoji(preset.avatar.value);
      setImageUrl('');
    } else if (preset.avatar.type === 'image' || (preset.avatar.value && (preset.avatar.value.startsWith('http') || preset.avatar.value.startsWith('data:') || preset.avatar.value.startsWith('blob:')))) {
      setAvatarTab('image');
      setImageUrl(preset.avatar.value);
      setAvatarZoom(preset.avatar.zoom || 1);
    } else {
      setAvatarTab('color');
      setImageUrl('');
    }

    setTimeout(() => {
      editingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleNameChange = (newName: string) => {
    setProfileName(newName);
  };

  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
  };

  const handleEmojiChange = (newEmoji: string) => {
    setSelectedEmoji(newEmoji);
  };

  const handleImageChange = (newUrl: string, zoomVal?: number) => {
    setImageUrl(newUrl);
    if (zoomVal !== undefined) {
      setAvatarZoom(zoomVal);
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setAvatarZoom(newZoom);
  };

  const handleAvatarTabChange = (newTab: 'color' | 'emoji' | 'image') => {
    setAvatarTab(newTab);
  };

  const handleDeletePreset = (id: string) => {
    const isEditingCurrent = editingPresetId === id;
    const filtered = localProfilePresets.filter(p => p.id !== id);
    setLocalProfilePresets(filtered);
    saveProfilePresets(filtered);
    addToast('Perfil removido com sucesso!', 'info');
    if (isEditingCurrent) {
      handleCreateNewPreset();
    }
  };

  const handleCreateNewPreset = () => {
    setEditingPresetId('new_preset_creation_mode');
    setProfileName('');
    setSelectedColor('#7c5cfc');
    setSelectedEmoji('👤');
    setImageUrl('');
    setAvatarZoom(1);
    setAvatarTab('color');
    setTimeout(() => {
      editingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      profileNameInputRef.current?.focus();
    }, 100);
  };

  const handleSaveExistingPreset = () => {
    if (!editingPresetId || editingPresetId === 'new_preset_creation_mode') return;
    if (!profileName.trim()) {
      addToast('O nome do perfil é obrigatório.', 'error');
      return;
    }

    let finalAvatarType = avatarTab;
    let avatarValue = '';
    if (avatarTab === 'color') {
      avatarValue = selectedColor;
    } else if (avatarTab === 'emoji') {
      avatarValue = selectedEmoji;
    } else {
      if (imageUrl) {
        avatarValue = imageUrl;
      } else {
        finalAvatarType = 'color';
        avatarValue = selectedColor;
      }
    }

    const updatedAvatar: ProfileAvatar = {
      type: finalAvatarType,
      value: avatarValue,
      bgColor: selectedColor,
      zoom: finalAvatarType === 'image' ? avatarZoom : undefined
    };

    const updatedList = localProfilePresets.map(p => {
      if (p.id === editingPresetId) {
        return {
          ...p,
          name: profileName.trim(),
          avatar: updatedAvatar
        };
      }
      return p;
    });

    setLocalProfilePresets(updatedList);
    saveProfilePresets(updatedList);
    addToast('Perfil atualizado com sucesso! ✨', 'success');

    // Automatically reset to ready new creation mode
    handleCreateNewPreset();
  };

  const handleSaveNewPreset = () => {
    if (!profileName.trim()) {
      addToast('O nome do perfil é obrigatório.', 'error');
      return;
    }

    let finalAvatarType = avatarTab;
    let avatarValue = '';
    if (avatarTab === 'color') {
      avatarValue = selectedColor;
    } else if (avatarTab === 'emoji') {
      avatarValue = selectedEmoji;
    } else {
      if (imageUrl) {
        avatarValue = imageUrl;
      } else {
        finalAvatarType = 'color';
        avatarValue = selectedColor;
      }
    }

    const newPreset: ProfilePreset = {
      id: `preset-${Date.now()}`,
      name: profileName.trim(),
      avatar: {
        type: finalAvatarType,
        value: avatarValue,
        bgColor: selectedColor,
        zoom: finalAvatarType === 'image' ? avatarZoom : undefined
      }
    };

    const updatedList = [...localProfilePresets, newPreset];
    setLocalProfilePresets(updatedList);
    saveProfilePresets(updatedList);
    addToast(`Perfil "${newPreset.name}" criado com sucesso! ✨`, 'success');

    // Reset back to blank creation mode waiting for the next profile
    handleCreateNewPreset();
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

  const handleBulkDeletePresets = () => {
    const filtered = localProfilePresets.filter(p => !selectedPresetIds.has(p.id));
    setLocalProfilePresets(filtered);
    setSelectedPresetIds(new Set());
    setShowBulkDelete(false);
    saveProfilePresets(filtered);
    addToast('Perfis selecionados removidos com sucesso! ✨', 'success');
    if (editingPresetId && selectedPresetIds.has(editingPresetId)) {
      if (filtered.length > 0) {
        handleSelectPresetForEditing(filtered[0]);
      } else {
        setEditingPresetId(null);
      }
    }
  };

  const [profileName, setProfileName] = useState('Pessoal');
  const [customProfileName, setCustomProfileName] = useState('');
  const customNameInputRef = useRef<HTMLInputElement>(null);
  const [isCustomProfile, setIsCustomProfile] = useState(false);
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
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accessLink, setAccessLink] = useState('');
  const [description, setDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Avatar states
  const [avatarTab, setAvatarTab] = useState<'color' | 'emoji' | 'image'>('color');
  const [selectedColor, setSelectedColor] = useState('#7c5cfc');
  const [selectedEmoji, setSelectedEmoji] = useState('👤');
  const [imageUrl, setImageUrl] = useState('');
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [zoomInput, setZoomInput] = useState('100');
  const [isZoomFocused, setIsZoomFocused] = useState(false);

  useEffect(() => {
    setZoomInput(String(Math.round(avatarZoom * 100)));
  }, [avatarZoom]);
  const [showColorWheel, setShowColorWheel] = useState(false);
  const [showAllPresets, setShowAllPresets] = useState(false);

  // UI state
  const [isEditingInView, setIsEditingInView] = useState(!isEditMode || startInEditMode);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [avatarFrame, setAvatarFrame] = useState<AvatarFrameSettings>(() => defaultAvatarFrame(profile?.id || 'new-profile'));
  const [showFrameCustomizer, setShowFrameCustomizer] = useState(false);
  const [framePicker, setFramePicker] = useState<'finish' | 'motion' | null>(null);

  useEffect(() => {
    if (profile?.id) setAvatarFrame(profile.avatarFrame || defaultAvatarFrame(profile.id));
    else setAvatarFrame(defaultAvatarFrame('new-profile'));
  }, [profile?.id, profile?.avatarFrame, isOpen]);

  const colorWheelRef = useRef<HTMLDivElement>(null);
  const colorWheelContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll color wheel into view when shown
  useEffect(() => {
    if (showColorWheel) {
      const timer = setTimeout(() => {
        colorWheelContainerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showColorWheel]);

  // Load profile data if in edit mode
  useEffect(() => {
    setShowColorWheel(false); // Reset color wheel state
    setShowFrameCustomizer(!!openFrameCustomizer);
    setShowAllPresets(false);
    setShowEmailSuggestions(false);
    if (profile) {
      if (isEditMode) {
        setIsEditingInView(startInEditMode);
      }
      
      const matchedPreset = profilePresets.find(p => p.name === profile.name);
      if (matchedPreset) {
        setProfileName(profile.name);
        setIsCustomProfile(false);
      } else {
        setIsCustomProfile(true);
        setCustomProfileName(profile.name);
      }
      setUsername(profile.username || '');
      setEmail(profile.email || '');
      setPassword(profile.password || '');
      setAccessLink(profile.accessLink || '');
      setDescription(profile.description || '');

      if (profile.avatar) {
        if (profile.avatar.bgColor) {
          setSelectedColor(profile.avatar.bgColor);
        } else if (profile.avatar.type === 'color') {
          setSelectedColor(profile.avatar.value);
        }
        
        const isImg = profile.avatar.type === 'image' || (profile.avatar.value && (profile.avatar.value.startsWith('http') || profile.avatar.value.startsWith('data:') || profile.avatar.value.startsWith('blob:')));

        if (isImg && profile.avatar.value) {
          setAvatarTab('image');
          setImageUrl(profile.avatar.value);
          setAvatarZoom(profile.avatar.zoom || 1);
        } else if (profile.avatar.type === 'emoji') {
          setAvatarTab('emoji');
          setSelectedEmoji(profile.avatar.value);
          setImageUrl('');
        } else {
          setAvatarTab('color');
          setImageUrl('');
        }
      }
    } else {
      setIsEditingInView(true);
      setProfileName('Pessoal');
      setIsCustomProfile(false);
      setCustomProfileName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setAccessLink(platform?.url || '');
      setDescription('');
      setAvatarTab('color');
      setSelectedColor('#7c5cfc');
      setSelectedEmoji('👤');
      setImageUrl('');
      setAvatarZoom(1);
    }
  }, [profile, isOpen, isEditMode, platform, startInEditMode, openFrameCustomizer]);

  // Reset color wheel state when switching tabs
  useEffect(() => {
    setShowColorWheel(false);
  }, [avatarTab]);



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

  const isDraggingRef = useRef(false);

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
    
    const rgb = hsvToRgb(hue, sat, 1.0);
    const hex = '#' + rgb.map(val => {
      const hexStr = val.toString(16);
      return hexStr.length === 1 ? '0' + hexStr : hexStr;
    }).join('');
    
    setSelectedColor(hex);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    handleColorSelection(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      handleColorSelection(e.clientX, e.clientY);
    }
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    if (e.touches[0]) {
      handleColorSelection(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDraggingRef.current && e.touches[0]) {
      handleColorSelection(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
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

  const handleCopyUser = () => {
    navigator.clipboard.writeText(username);
    setCopiedUser(true);
    setTimeout(() => setCopiedUser(false), 1500);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 1500);
  };

  const handleCopyPass = () => {
    navigator.clipboard.writeText(password);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 1500);
  };

  const handleSaveOrEdit = () => {
    const finalProfileName = isCustomProfile ? customProfileName : profileName;
    if (!finalProfileName.trim()) return;

    let finalAvatarType = avatarTab;
    let avatarValue = '';
    if (avatarTab === 'color') {
      avatarValue = selectedColor;
    } else if (avatarTab === 'emoji') {
      avatarValue = selectedEmoji;
    } else {
      if (imageUrl) {
        avatarValue = imageUrl;
      } else {
        finalAvatarType = 'color';
        avatarValue = selectedColor;
      }
    }

    const avatarObj: ProfileAvatar = {
      type: finalAvatarType,
      value: avatarValue,
      bgColor: selectedColor,
      zoom: finalAvatarType === 'image' ? avatarZoom : undefined,
    };

    if (finalProfileName && !profilePresets.some(p => p.name.trim().toLowerCase() === finalProfileName.trim().toLowerCase())) {
      addProfilePreset({
        name: finalProfileName,
        avatar: avatarObj,
      });
    }

    if (isEditMode && profile) {
      if (onEdit) {
        onEdit(profile.id, {
          name: finalProfileName,
          username,
          email,
          password,
          accessLink,
          description,
          avatar: avatarObj,
          avatarFrame,
        });
      }
      addToast(`Conta "${finalProfileName}" atualizada com sucesso! 👤`, 'success');
      setIsEditingInView(false);
      onClose();
    } else {
      if (onSave) {
        onSave({
          name: finalProfileName,
          username,
          email,
          password,
          accessLink,
          description,
          avatar: avatarObj,
          avatarFrame,
        });
      }
      addToast(`Conta "${finalProfileName}" criada com sucesso! ✨`, 'success');
      onClose();
    }
  };

  const handleDelete = () => {
    if (isEditMode && profile && onDelete) {
      onDelete(profile.id);
      addToast(`Conta "${profile.name}" excluída com sucesso! 🗑️`, 'info');
      onClose();
    }
  };

  // Dedicated screen: avatar tap must show only frame customization, not the profile details modal.
  if (isOpen && openFrameCustomizer && showFrameCustomizer && profile && platform) {
    const saveFrameOnly = () => {
      if (onEdit) onEdit(profile.id, { ...profile, avatarFrame });
      addToast('Moldura atualizada com sucesso!', 'success');
      onClose();
    };
    return (
      <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3" onClick={onClose}>
        <div className="w-full max-w-lg max-h-[88dvh] overflow-y-auto rounded-2xl border border-indigo-200/70 dark:border-indigo-500/20 bg-white dark:bg-[#101116] shadow-2xl p-3.5 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Personalizar moldura</p>
              <p className="text-[10px] text-neutral-500">Escolha o desenho, as cores e o movimento</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Fechar personalização" className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-4 h-4"/></button>
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-bold text-neutral-800 dark:text-neutral-100">Pré-visualização</p><p className="text-[10px] text-neutral-500">A moldura desta conta</p></div>
            <AvatarFrame profileId={profile.id} settings={avatarFrame} size={52}>
              <div className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden" style={{backgroundColor:selectedColor}}>
                {avatarTab === 'emoji' ? selectedEmoji : avatarTab === 'image' && imageUrl ? <SmartImage src={imageUrl} alt={profile.name} className="w-full h-full object-cover"/> : profile.name.slice(0,2).toUpperCase()}
              </div>
            </AvatarFrame>
          </div>
          <div className="grid grid-cols-2 gap-2">
<button type="button" onClick={() => setFramePicker(framePicker === 'finish' ? null : 'finish')} className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#15161e] p-2.5 text-left">
<span className="block text-[10px] text-neutral-500 mb-1">Acabamento</span><span className="flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-neutral-100">{({solid:'Clássico',gradient:'Degradê','pastel-rainbow':'Arco-íris suave','soft-neon':'Neon suave',pearl:'Perolado',metallic:'Metálico',matte:'Fosco',satin:'Acetinado',crystal:'Cristalino'} as Record<string,string>)[avatarFrame.finish]} <span className="text-indigo-400">⌄</span></span>
</button>
<button type="button" onClick={() => setFramePicker(framePicker === 'motion' ? null : 'motion')} className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#15161e] p-2.5 text-left">
<span className="block text-[10px] text-neutral-500 mb-1">Animação</span><span className="flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-neutral-100">{({none:'Sem movimento','soft-pulse':'Pulso delicado','soft-glow':'Brilho respirando','color-shift':'Cores em transição','soft-shimmer':'Cintilação discreta','color-wave':'Onda de brilho',twinkle:'Pontinhos cintilantes','soft-breathe':'Respiração suave',glint:'Reflexo perolado','rainbow-wave':'Arco-íris delicado','sparkle-wave':'Brilhos alternados','soft-blink':'Pisca-pisca suave','slow-twinkle':'Cintilar lento','light-ripple':'Ondinha de luz','gentle-glimmer':'Cintilação leve','color-breathe':'Cores que respiram','soft-sway':'Brisa delicada','petal-dance':'Dança das pétalas',fireflies:'Vagalumes', 'comet-tail':'Cometinhas de luz','double-beat':'Batida dupla',bloom:'Florescer'} as Record<string,string>)[avatarFrame.motion]} <span className="text-indigo-400">⌄</span></span>
</button>
</div>
{framePicker && <div className="rounded-xl border border-indigo-500/20 bg-neutral-50 dark:bg-[#12131a] p-2.5">
<div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{framePicker === 'finish' ? 'Escolha o acabamento' : 'Escolha o movimento'}</span><button type="button" onClick={()=>setFramePicker(null)} className="text-[10px] text-indigo-400">Fechar</button></div>
{framePicker === 'finish' ? <div className="grid grid-cols-3 gap-2">
{([{id:'solid',name:'Clássico',desc:'Cor uniforme'},{id:'gradient',name:'Degradê',desc:'Cores nos desenhos'},{id:'pastel-rainbow',name:'Arco-íris',desc:'Tons suaves'},{id:'soft-neon',name:'Neon suave',desc:'Brilho delicado'},{id:'pearl',name:'Perolado',desc:'Reflexo claro'},{id:'metallic',name:'Metálico',desc:'Toque metalizado'},{id:'matte',name:'Fosco',desc:'Cor suave sem brilho'},{id:'satin',name:'Acetinado',desc:'Reflexo discreto'},{id:'crystal',name:'Cristalino',desc:'Brilho translúcido'}] as const).map(item=><button key={item.id} type="button" onClick={()=>{setAvatarFrame(v=>({...v,finish:item.id}));setFramePicker(null)}} className={'rounded-lg border p-2 text-left '+(avatarFrame.finish===item.id?'border-indigo-500 bg-indigo-500/10':'border-neutral-200 dark:border-neutral-700')}>
<AvatarFrame profileId={'finish-'+item.id} settings={{...avatarFrame,finish:item.id,motion:'none'}} size={36}><span className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[9px] text-white">A</span></AvatarFrame><span className="block mt-1 text-[10px] font-semibold text-neutral-800 dark:text-neutral-100">{item.name}</span><span className="block text-[9px] text-neutral-500">{item.desc}</span></button>)}
</div> : <div className="space-y-3"><div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3"><AvatarFrame profileId="motion-large-preview" settings={avatarFrame} size={92}><span className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center text-lg text-white">A</span></AvatarFrame><div><p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Prévia do movimento selecionado</p><p className="text-[10px] text-neutral-500">Toque em uma opção abaixo para assistir aqui, em tamanho maior.</p></div></div><div className="grid grid-cols-2 gap-2">
{([{id:'none',name:'Sem movimento',desc:'Fixo e discreto'},{id:'soft-pulse',name:'Pulso delicado',desc:'Intensidade suave'},{id:'soft-glow',name:'Brilho respirando',desc:'Luz que aparece e some'},{id:'color-shift',name:'Cores em transição',desc:'Tons mudam devagar'},{id:'soft-shimmer',name:'Cintilação discreta',desc:'Reflexos sutis'},{id:'color-wave',name:'Onda de brilho',desc:'Brilho percorre os detalhes'},{id:'twinkle',name:'Pontinhos cintilantes',desc:'Pequenos pontos brilham'},{id:'soft-breathe',name:'Respiração suave',desc:'A moldura ganha vida'},{id:'glint',name:'Reflexo perolado',desc:'Reflexo delicado'},{id:'rainbow-wave',name:'Arco-íris delicado',desc:'Cores suaves alternadas'},{id:'sparkle-wave',name:'Brilhos alternados',desc:'Pequenos brilhos em sequência'},{id:'soft-blink',name:'Pisca-pisca suave',desc:'Acende e suaviza lentamente, sem flashes fortes'},{id:'slow-twinkle',name:'Cintilar lento',desc:'Detalhes brilham em tempos diferentes'},{id:'light-ripple',name:'Ondinha de luz',desc:'Um brilho discreto percorre os desenhos'},{id:'gentle-glimmer',name:'Cintilação leve',desc:'Pequenos reflexos aparecem suavemente'},{id:'color-breathe',name:'Cores que respiram',desc:'As cores ganham vida devagar'},{id:'soft-sway',name:'Brisa delicada',desc:'Enfeites balançam de lado'},{id:'petal-dance',name:'Dança das pétalas',desc:'Pétalas se inclinam alternadamente'},{id:'fireflies',name:'Vagalumes',desc:'Luzinhas aparecem e flutuam'},{id:'comet-tail',name:'Cometinhas de luz',desc:'Pequenos rastros luminosos'},{id:'double-beat',name:'Batida dupla',desc:'Duas pulsações e uma pausa'},{id:'bloom',name:'Florescer',desc:'Mini flores se abrem e fecham'}] as const).map(item=><button key={item.id} type="button" onClick={()=>{setAvatarFrame(v=>({...v,motion:item.id}));setFramePicker(null)}} className={'rounded-lg border p-2 text-left flex items-center gap-2 '+(avatarFrame.motion===item.id?'border-indigo-500 bg-indigo-500/10':'border-neutral-200 dark:border-neutral-700')}>
<AvatarFrame profileId={'motion-'+item.id} settings={{...avatarFrame,motion:'none'}} size={44}><span className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[8px] text-white">A</span></AvatarFrame><span className="min-w-0"><span className="block text-[10px] font-semibold text-neutral-800 dark:text-neutral-100">{item.name}</span><span className="block text-[9px] text-neutral-500">{item.desc}</span></span></button>)}
</div></div>}
</div>}
          <FrameColorControls frame={avatarFrame} onChange={setAvatarFrame} />
          <AvatarFrameGallery
              frame={avatarFrame}
              onChange={setAvatarFrame}
              profileId={profile.id}
              avatarText={avatarTab === 'emoji' ? selectedEmoji : profile.name.slice(0,1).toUpperCase()}
              avatarColor={selectedColor}
            />
<button type="button" onClick={saveFrameOnly} className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">Concluir e salvar</button>
        </div>
      </div>
    );
  }

  if (!isOpen || (!platform && !openPresetsManager)) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 overflow-y-auto overflow-x-hidden backdrop-blur-sm scrollbar-hide">
      <div className="min-h-full flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full min-w-0 max-w-lg bg-white dark:bg-[#0a0a0a] rounded-2xl border border-neutral-200 dark:border-white/[0.08] overflow-hidden shadow-2xl text-neutral-800 dark:text-neutral-200 flex flex-col"
        >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-white/[0.08] flex items-center justify-between bg-neutral-50 dark:bg-[#0d0d0d]">
          <div>
            <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{openPresetsManager ? 'Gerenciar Perfis Padrão' : isEditMode ? 'Visualizar perfil' : 'Adicionar conta'}</span>
              {platform && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100 dark:border-transparent">
                  {platform.name}
                </span>
              )}
            </h2>
            <p className="text-neutral-500 text-[10px] font-medium mt-1">
              {openPresetsManager
                ? 'Adicione, edite e reordene os perfis de acesso padrão'
                : isEditMode
                  ? 'Detalhes e credenciais de acesso'
                  : 'Cadastre um novo perfil de acesso'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 max-h-[80vh] sm:max-h-[75vh] overflow-y-auto overflow-x-hidden min-w-0">
          {openPresetsManager ? (
            /* PRESETS MANAGER VIEW */
            <div className="flex flex-col gap-4 select-none">
              {/* Header row inside view */}
              <div className="flex items-center justify-between pb-1">
                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Perfis padrão
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      saveProfilePresets(localProfilePresets);
                      addToast('Configurações de perfis salvas com sucesso! ✨', 'success');
                      onClose();
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    ✓ Concluir
                  </button>
                </div>
              </div>

              {/* Reordering container box */}
              <div className="min-w-0 bg-neutral-50/50 dark:bg-neutral-900/10 border border-neutral-150 dark:border-neutral-800/40 rounded-2xl p-3 sm:p-4 flex flex-col">
                <div className="flex flex-col gap-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800/40">
                  {/* Top Row: Title and Drag Instruction perfectly aligned horizontally */}
                  <div className="flex flex-col gap-2 items-start sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      GERENCIAR E REORDENAR PERFIS
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                      <GripVertical className="w-3.5 h-3.5" />
                      <span>Arraste o ícone para reordenar</span>
                    </span>
                  </div>

                  {/* Bottom Row: Selection button placed below */}
                  <div className="flex justify-end w-full">
                    {!showBulkDelete ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowBulkDelete(true);
                          setSelectedPresetIds(new Set());
                        }}
                        className="px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#13141c] hover:bg-neutral-50 dark:hover:bg-neutral-850/50 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Selecionar vários</span>
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPresetIds(new Set(localProfilePresets.map(p => p.id)));
                              addToast('Todos os perfis selecionados!', 'info');
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#13141c] hover:bg-neutral-50 dark:hover:bg-neutral-850/50 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1 cursor-pointer"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Selecionar todos</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowBulkDelete(false);
                              setSelectedPresetIds(new Set());
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 text-rose-500" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bulk delete action button */}
                {showBulkDelete && selectedPresetIds.size > 0 && (
                  <div className="mt-2.5 p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/35 rounded-xl flex items-center justify-between">
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                      {selectedPresetIds.size} {selectedPresetIds.size === 1 ? 'perfil selecionado' : 'perfis selecionados'}
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkDeletePresets}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Selecionados</span>
                    </button>
                  </div>
                )}

                {/* Reorder list */}
                <Reorder.Group
                  axis="y"
                  values={localProfilePresets}
                  onReorder={setLocalProfilePresets}
                  className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto overflow-x-hidden min-w-0 pr-1 mt-3"
                >
                  {localProfilePresets.map((preset) => {
                    const isEditingThis = editingPresetId === preset.id;
                    const liveAvatarObj: ProfileAvatar = {
                      type: avatarTab,
                      value: avatarTab === 'color' ? selectedColor : avatarTab === 'emoji' ? selectedEmoji : imageUrl,
                      bgColor: selectedColor,
                      zoom: avatarTab === 'image' ? avatarZoom : undefined
                    };
                    return (
                      <PresetReorderItem
                        key={preset.id}
                        preset={preset}
                        isEditing={isEditingThis}
                        isSelected={selectedPresetIds.has(preset.id)}
                        onToggleSelect={showBulkDelete ? () => handleToggleSelectPreset(preset.id) : undefined}
                        liveAvatar={liveAvatarObj}
                        liveName={profileName}
                        onEdit={handleSelectPresetForEditing}
                        onDelete={() => handleDeletePreset(preset.id)}
                      />
                    );
                  })}
                </Reorder.Group>

                {localProfilePresets.length === 0 && (
                  <div className="text-center py-8 text-xs text-neutral-400 dark:text-neutral-500 italic">
                    Nenhum perfil cadastrado.
                  </div>
                )}
              </div>

              {/* Creation / Editing Form (Always open in Manager view) */}
              <div ref={editingFormRef} className="min-w-0 flex flex-col gap-4 mt-2 bg-neutral-50/80 dark:bg-neutral-900/20 border border-neutral-200/80 dark:border-neutral-800/60 p-3 sm:p-4 rounded-2xl shadow-sm">
                {/* Header row for form: Title & Actions */}
                <div className="min-w-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-neutral-200/60 dark:border-neutral-800/50">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    {editingPresetId && editingPresetId !== 'new_preset_creation_mode' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>Editando: <strong className="text-indigo-600 dark:text-indigo-400">{profileName || 'Perfil'}</strong></span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-indigo-500" />
                        <span>Novo perfil</span>
                      </>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {editingPresetId && editingPresetId !== 'new_preset_creation_mode' ? (
                      <button
                        type="button"
                        onClick={handleCreateNewPreset}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer transition-all flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    ) : (
                      profileName.trim() ? (
                        <button
                          type="button"
                          onClick={handleCreateNewPreset}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer transition-all"
                        >
                          Limpar
                        </button>
                      ) : null
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (editingPresetId === 'new_preset_creation_mode' || !editingPresetId) {
                          handleSaveNewPreset();
                        } else {
                          handleSaveExistingPreset();
                        }
                      }}
                      disabled={!profileName.trim()}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      {editingPresetId === 'new_preset_creation_mode' || !editingPresetId ? (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Salvar novo</span>
                        </>
                      ) : (
                        <span>Salvar alterações</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Preset Name Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Nome do perfil <span className="text-[10px] font-normal text-rose-500 dark:text-rose-400">(obrigatório)</span>
                  </label>
                  <input
                    ref={profileNameInputRef}
                    type="text"
                    value={profileName}
                    onChange={(e) => editingPresetId === 'new_preset_creation_mode' ? setProfileName(e.target.value) : handleNameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && profileName.trim()) {
                        e.preventDefault();
                        if (editingPresetId === 'new_preset_creation_mode' || !editingPresetId) {
                          handleSaveNewPreset();
                        } else {
                          handleSaveExistingPreset();
                        }
                      }
                    }}
                    placeholder="Ex: INFINIX, XIAOMI, MEU MOTO G..."
                    className="w-full h-11 px-4 rounded-xl text-sm bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                </div>

                  {/* Avatar Picker Section */}
                  <div className="flex flex-col gap-3 pt-3 border-t border-neutral-100 dark:border-[#26283b]/40">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                      Avatar do perfil
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAvatarTabChange('color')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          avatarTab === 'color'
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                            : 'bg-white hover:bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>Cor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAvatarTabChange('emoji')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          avatarTab === 'emoji'
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                            : 'bg-white hover:bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <Smile className="w-3.5 h-3.5" />
                        <span>Emoji</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAvatarTabChange('image')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          avatarTab === 'image'
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                            : 'bg-white hover:bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Imagem</span>
                      </button>
                    </div>

                    {/* Tab content */}
                    <div className="mt-1">
                      {avatarTab === 'color' && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowColorWheel(!showColorWheel)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md cursor-pointer border border-neutral-200/50 transition-all active:scale-95 ${
                                showColorWheel ? 'ring-2 ring-indigo-500 scale-105' : ''
                              }`}
                              style={{ backgroundColor: selectedColor }}
                              title={showColorWheel ? "Fechar seletor de cores" : "Abrir seletor de cores"}
                            >
                              <Palette className="w-4 h-4" />
                            </button>
                            <input
                              type="color"
                              value={selectedColor.startsWith('#') && selectedColor.length === 7 ? selectedColor : '#6366f1'}
                              onChange={(e) => handleColorChange(e.target.value)}
                              className="w-10 h-10 rounded-xl cursor-pointer border border-neutral-200 dark:border-[#2a2d40] bg-neutral-50 dark:bg-[#111219] p-1 shrink-0"
                              title="Seletor nativo do sistema"
                            />
                            <input
                              type="text"
                              value={selectedColor}
                              onChange={(e) => handleColorChange(e.target.value)}
                              placeholder="#ffffff"
                              className="flex-1 h-10 px-3 rounded-xl text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 font-mono"
                            />
                          </div>

                          {showColorWheel && (
                            <div ref={colorWheelContainerRef} className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col items-center gap-3">
                              <div
                                ref={colorWheelRef}
                                className="relative w-32 h-32 rounded-full cursor-crosshair select-none touch-none overflow-hidden border border-neutral-200/60 dark:border-white/10"
                                style={{
                                  background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                                }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUpOrLeave}
                                onMouseLeave={handleMouseUpOrLeave}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                              >
                                <div
                                  className="absolute inset-0 rounded-full pointer-events-none"
                                  style={{
                                    background: 'radial-gradient(circle, white 0%, transparent 100%)',
                                  }}
                                />
                                <div
                                  className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-white shadow-md pointer-events-none"
                                  style={{
                                    left: `${getIndicatorCoords(selectedColor, 64).x}px`,
                                    top: `${getIndicatorCoords(selectedColor, 64).y}px`,
                                    backgroundColor: selectedColor,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-medium text-neutral-400">Arraste para escolher uma cor</span>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((c, idx) => (
                              <button
                                key={`pm-col-${c}-${idx}`}
                                type="button"
                                onClick={() => handleColorChange(c)}
                                className={`w-6 h-6 rounded-full border border-neutral-200/40 cursor-pointer shadow-sm transition-transform hover:scale-110 ${
                                  selectedColor === c ? 'ring-2 ring-indigo-500 scale-105' : ''
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {avatarTab === 'emoji' && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-xl shrink-0 shadow-inner">
                              {selectedEmoji}
                            </div>
                            <input
                              type="text"
                              maxLength={2}
                              value={selectedEmoji}
                              onChange={(e) => handleEmojiChange(e.target.value)}
                              className="w-full h-11 px-4 rounded-xl text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                            />
                          </div>

                          <div className="grid grid-cols-10 gap-2 p-2 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-150 dark:border-neutral-800/50">
                            {PRESET_EMOJIS.map((em, idx) => (
                              <button
                                key={`pm-em-${em}-${idx}`}
                                type="button"
                                onClick={() => handleEmojiChange(em)}
                                className={`text-lg p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer ${
                                  selectedEmoji === em ? 'bg-indigo-100 dark:bg-indigo-950/40 ring-1 ring-indigo-500' : ''
                                }`}
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {avatarTab === 'image' && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-md transition-colors border border-neutral-200/50"
                              style={{ backgroundColor: selectedColor || '#6366f1' }}
                            >
                              {imageUrl ? (
                                <SmartImage
                                  src={imageUrl}
                                  alt="preview"
                                  className="w-full h-full object-cover"
                                  style={{ transform: `scale(${avatarZoom})` }}
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-neutral-400" />
                              )}
                            </div>
                            <input
                              type="text"
                              value={imageUrl}
                              onChange={(e) => handleImageChange(e.target.value)}
                              placeholder="Cole o URL da imagem..."
                              className="w-full h-11 px-4 rounded-xl text-xs bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                            />
                          </div>

                          <div className="relative border-2 border-dashed border-neutral-200 dark:border-neutral-850 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 hover:border-indigo-500 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <Upload className="w-5 h-5 text-neutral-400" />
                            <span className="text-xs text-neutral-500">Clique para enviar uma foto (max 5MB)</span>
                          </div>

                          {imageUrl && (
                            <div className="flex flex-col gap-3">
                              {/* Background color customization for image avatar */}
                              <div className="flex flex-col gap-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-800/50">
                                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Cor de fundo da imagem</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowColorWheel(!showColorWheel)}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm cursor-pointer border border-neutral-200 dark:border-neutral-700 transition-all active:scale-95 ${
                                      showColorWheel ? 'ring-2 ring-indigo-500 scale-105' : ''
                                    }`}
                                    style={{ backgroundColor: selectedColor }}
                                    title={showColorWheel ? "Fechar seletor de cores" : "Abrir seletor de cores"}
                                  >
                                    <Palette className="w-3.5 h-3.5" />
                                  </button>
                                  <input
                                    type="color"
                                    value={selectedColor.startsWith('#') && selectedColor.length === 7 ? selectedColor : '#6366f1'}
                                    onChange={(e) => setSelectedColor(e.target.value)}
                                    className="w-7 h-7 rounded-md cursor-pointer border border-neutral-200 dark:border-neutral-700 bg-transparent p-0.5 shrink-0"
                                    title="Seletor nativo do sistema"
                                  />
                                  <input
                                    type="text"
                                    value={selectedColor}
                                    onChange={(e) => setSelectedColor(e.target.value)}
                                    placeholder="#6366f1"
                                    className="w-20 h-7 px-2 rounded-lg text-xs font-mono bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                                    title="Digite o código HEX da cor (ex: #6366F1)"
                                  />
                                  <div className="flex flex-wrap gap-1.5 items-center">
                                    {PRESET_COLORS.map((c, idx) => (
                                      <button
                                        key={`img-bg-${c}-${idx}`}
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

                              {showColorWheel && (
                                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col items-center gap-2">
                                  <div
                                    ref={colorWheelRef}
                                    className="relative w-28 h-28 rounded-full cursor-crosshair select-none touch-none overflow-hidden border border-neutral-200/60 dark:border-white/10"
                                    style={{
                                      background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                                    }}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUpOrLeave}
                                    onMouseLeave={handleMouseUpOrLeave}
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                  >
                                    <div
                                      className="absolute inset-0 rounded-full pointer-events-none"
                                      style={{
                                        background: 'radial-gradient(circle, white 0%, transparent 100%)',
                                      }}
                                    />
                                    <div
                                      className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-white shadow-md pointer-events-none"
                                      style={{
                                        left: `${getIndicatorCoords(selectedColor, 56).x}px`,
                                        top: `${getIndicatorCoords(selectedColor, 56).y}px`,
                                        backgroundColor: selectedColor,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-medium text-neutral-400">Arraste para escolher uma cor</span>
                                </div>
                              )}

                              {/* Zoom Slider + Direct Input */}
                              <div className="flex flex-col gap-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-800/50">
                                <div className="flex justify-between items-center text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">
                                  <span>Zoom da Imagem</span>
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
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
                                      className="text-[10px] text-indigo-500 hover:underline cursor-pointer font-normal"
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
                                  className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>


                </div>
            </div>
          ) : isEditMode && !isEditingInView ? (
            /* VIEW DETAILS MODE */
            <div className="flex flex-col gap-5 select-text">
              {/* Profile Avatar Card */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-white/[0.06]">
                <button type="button" onClick={() => { setIsEditingInView(true); setShowFrameCustomizer(true); }} aria-label="Personalizar moldura do perfil" title="Toque para personalizar a moldura" className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer shrink-0">
                  <AvatarFrame profileId={profile?.id || 'new-profile'} settings={avatarFrame} size={60}>
                    <div className="w-full h-full rounded-full flex items-center justify-center text-xl font-bold text-white uppercase overflow-hidden" style={{backgroundColor:selectedColor}}>
                      {avatarTab === 'emoji' && selectedEmoji ? selectedEmoji : avatarTab === 'image' && imageUrl ? <SmartImage src={imageUrl} alt="profile" className="w-full h-full object-cover" style={{transform:`scale(${avatarZoom})`}}/> : (isCustomProfile ? customProfileName : profileName).slice(0,2).toUpperCase()}
                    </div>
                  </AvatarFrame>
                </button>
                <div>
                  <h3 className="font-sans font-bold text-neutral-900 dark:text-white text-sm">
                    {isCustomProfile ? customProfileName : profileName}
                  </h3>
                  <p className="text-neutral-500 text-[11px] font-medium mt-0.5">
                    Perfil cadastrado no {platform.name}
                  </p>
                </div>
              </div>

              {/* Email field (Quick copy) */}
              {email && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider select-none">
                    E-mail
                  </label>
                  <div className="flex items-center justify-between p-3 h-11 rounded-lg bg-neutral-50 dark:bg-[#111219] border border-neutral-200 dark:border-[#2a2d40]/50">
                    <span className="text-sm font-mono text-neutral-800 dark:text-neutral-200 font-medium truncate">
                      {email}
                    </span>
                    <button
                      onClick={handleCopyEmail}
                      className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer select-none shrink-0"
                      title="Copiar e-mail"
                    >
                      {copiedEmail ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Username field (Quick copy) */}
              {username && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider select-none">
                    Usuário
                  </label>
                  <div className="flex items-center justify-between p-3 h-11 rounded-lg bg-neutral-50 dark:bg-[#111219] border border-neutral-200 dark:border-[#2a2d40]/50">
                    <span className="text-sm font-mono text-neutral-800 dark:text-neutral-200 font-medium truncate">
                      {username}
                    </span>
                    <button
                      onClick={handleCopyUser}
                      className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer select-none shrink-0"
                      title="Copiar usuário"
                    >
                      {copiedUser ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Password field (Quick copy & Toggle) */}
              {password && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider select-none">
                    Senha de acesso
                  </label>
                  <div className="flex items-center justify-between p-3 h-11 rounded-lg bg-neutral-50 dark:bg-[#111219] border border-neutral-200 dark:border-[#2a2d40]/50">
                    <span className="text-sm font-mono text-neutral-800 dark:text-neutral-200 font-medium">
                      {showPassword ? password : '••••••••••••••••'}
                    </span>
                    <div className="flex items-center gap-1.5 select-none">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
                        title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={handleCopyPass}
                        className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
                        title="Copiar senha"
                      >
                        {copiedPass ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Access Link */}
              {accessLink && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider select-none">
                    Link de login direto
                  </label>
                  <a
                    href={safeUrl(accessLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-600/5 hover:bg-indigo-100 dark:hover:bg-indigo-600/10 border border-indigo-100 dark:border-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all animate-none"
                  >
                    <span className="text-xs truncate font-mono font-medium max-w-[360px]">{accessLink}</span>
                    <span className="text-xs font-semibold flex items-center gap-1 shrink-0 select-none">
                      Acessar <Link className="w-3 h-3" />
                    </span>
                  </a>
                </div>
              )}

              {/* Notes / Description */}
              {description && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider select-none">
                    Rascunho / Descrição
                  </label>
                  <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#111219]/60 border border-neutral-200 dark:border-[#2a2d40]/30 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 font-sans whitespace-pre-wrap">
                    {description}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* EDIT OR ADD FORM MODE */
            <div className="flex flex-col gap-4.5">
              {/* Profile Name preset selection */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Perfis padrão (Presets)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (onManageProfiles) {
                        onManageProfiles();
                      }
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    ⚙️ Gerenciar
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-0.5 max-h-56 overflow-y-auto pr-1 transition-all duration-300">
                  {(showAllPresets ? localProfilePresets : localProfilePresets.slice(0, 8)).map((preset, idx) => {
                    const isSel = profileName === preset.name && !isCustomProfile;
                    const isHex = (val?: string) => val && /^#([0-9A-F]{3}){1,2}$/i.test(val);
                    const chipBgColor = isHex(preset.avatar.bgColor) 
                      ? preset.avatar.bgColor 
                      : isHex(preset.avatar.value) 
                        ? preset.avatar.value 
                        : '#6366f1';

                    return (
                      <button
                        key={`preset-chip-${preset.id || idx}-${idx}`}
                        type="button"
                        onClick={() => {
                          setIsCustomProfile(false);
                          setProfileName(preset.name);
                          // Apply preset avatar
                          if (preset.avatar.bgColor) setSelectedColor(preset.avatar.bgColor);
                          else if (preset.avatar.type === 'color') setSelectedColor(preset.avatar.value);
                          
                          const isImg = preset.avatar.type === 'image' || (preset.avatar.value && (preset.avatar.value.startsWith('http') || preset.avatar.value.startsWith('data:') || preset.avatar.value.startsWith('blob:')));

                          if (isImg && preset.avatar.value) {
                            setAvatarTab('image');
                            setImageUrl(preset.avatar.value);
                            setAvatarZoom(preset.avatar.zoom || 1);
                          } else if (preset.avatar.type === 'emoji') {
                            setAvatarTab('emoji');
                            setSelectedEmoji(preset.avatar.value);
                            setImageUrl('');
                          } else {
                            setAvatarTab('color');
                            setImageUrl('');
                          }
                          
                          // Apply extra fields
                          if (preset.email) setEmail(preset.email);
                          if (preset.username) setUsername(preset.username);
                          if (preset.password) setPassword(preset.password);
                          if (preset.accessLink) setAccessLink(preset.accessLink);
                          if (preset.description) setDescription(preset.description);
                          
                          addToast(`Preset "${preset.name}" aplicado!`, 'info');
                        }}
                        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                          isSel
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-transparent dark:bg-[#111219] dark:hover:bg-neutral-800/80 dark:text-neutral-400'
                        }`}
                      >
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm overflow-hidden text-white shrink-0"
                          style={{
                            backgroundColor: isSel ? 'rgba(255,255,255,0.2)' : (
                              ((preset.avatar.type === 'image' || (preset.avatar.value && (preset.avatar.value.startsWith('http') || preset.avatar.value.startsWith('data:') || preset.avatar.value.startsWith('blob:') || preset.avatar.value.startsWith('/')))) && preset.avatar.value)
                                ? 'transparent'
                                : chipBgColor
                            )
                          }}
                        >
                          {preset.avatar.type === 'emoji' && preset.avatar.value ? (
                            preset.avatar.value
                          ) : (preset.avatar.type === 'image' || (preset.avatar.value && (preset.avatar.value.startsWith('http') || preset.avatar.value.startsWith('data:') || preset.avatar.value.startsWith('blob:')))) && preset.avatar.value ? (
                            <SmartImage
                              src={preset.avatar.value}
                              alt=""
                              className="w-full h-full object-cover"
                              style={{ transform: `scale(${preset.avatar.zoom || 1})` }}
                            />
                          ) : (
                            preset.name ? preset.name.slice(0, 2).toUpperCase() : 'PF'
                          )}
                        </div>
                        {preset.name}
                      </button>
                    );
                  })}

                  {localProfilePresets.length > 8 && (
                    <button
                      type="button"
                      onClick={() => setShowAllPresets(!showAllPresets)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors uppercase tracking-wider cursor-pointer bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center gap-1"
                    >
                      {showAllPresets ? 'Ver menos' : `Ver mais (+${localProfilePresets.length - 8})`}
                    </button>
                  )}
                </div>
              </div>

              {/* Nome do Perfil Input (Sempre Visível) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Nome do perfil / Identificação <span className="text-[10px] font-normal text-rose-500 dark:text-rose-400">(obrigatório)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    ref={customNameInputRef}
                    type="text"
                    value={isCustomProfile ? customProfileName : profileName}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (isCustomProfile) {
                        setCustomProfileName(val);
                      } else {
                        setProfileName(val);
                        setCustomProfileName(val);
                        setIsCustomProfile(true);
                      }
                    }}
                    placeholder="Ex: Pessoal, Trabalho, Romulo..."
                    className="w-full h-11 pl-10 pr-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                </div>
              </div>

              {showFrameCustomizer && (
                <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3" onClick={() => setShowFrameCustomizer(false)}>
                  <div className="w-full max-w-lg max-h-[88dvh] overflow-y-auto rounded-2xl border border-indigo-200/70 dark:border-indigo-500/20 bg-white dark:bg-[#101116] shadow-2xl p-3.5 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Personalizar moldura</p>
                        <p className="text-[10px] text-neutral-500">Escolha o desenho, as cores e o movimento</p>
                      </div>
                      <button type="button" onClick={() => setShowFrameCustomizer(false)} aria-label="Fechar personalização" className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-4 h-4"/></button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-neutral-800 dark:text-neutral-100">Pré-visualização</p>
                        <p className="text-[10px] text-neutral-500">A moldura desta conta</p>
                      </div>
                      <AvatarFrame profileId={profile?.id || 'new-profile'} settings={avatarFrame} size={52}>
                        <div className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden" style={{backgroundColor:selectedColor}}>
                          {avatarTab === 'emoji' ? selectedEmoji : avatarTab === 'image' && imageUrl ? <SmartImage src={imageUrl} alt="" className="w-full h-full object-cover"/> : profileName.slice(0,2).toUpperCase()}
                        </div>
                      </AvatarFrame>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
<button type="button" onClick={() => setFramePicker(framePicker === 'finish' ? null : 'finish')} className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#15161e] p-2.5 text-left">
<span className="block text-[10px] text-neutral-500 mb-1">Acabamento</span><span className="flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-neutral-100">{({solid:'Clássico',gradient:'Degradê','pastel-rainbow':'Arco-íris suave','soft-neon':'Neon suave',pearl:'Perolado',metallic:'Metálico',matte:'Fosco',satin:'Acetinado',crystal:'Cristalino'} as Record<string,string>)[avatarFrame.finish]} <span className="text-indigo-400">⌄</span></span>
</button>
<button type="button" onClick={() => setFramePicker(framePicker === 'motion' ? null : 'motion')} className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#15161e] p-2.5 text-left">
<span className="block text-[10px] text-neutral-500 mb-1">Animação</span><span className="flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-neutral-100">{({none:'Sem movimento','soft-pulse':'Pulso delicado','soft-glow':'Brilho respirando','color-shift':'Cores em transição','soft-shimmer':'Cintilação discreta','color-wave':'Onda de brilho',twinkle:'Pontinhos cintilantes','soft-breathe':'Respiração suave',glint:'Reflexo perolado','rainbow-wave':'Arco-íris delicado','sparkle-wave':'Brilhos alternados','soft-blink':'Pisca-pisca suave','slow-twinkle':'Cintilar lento','light-ripple':'Ondinha de luz','gentle-glimmer':'Cintilação leve','color-breathe':'Cores que respiram','soft-sway':'Brisa delicada','petal-dance':'Dança das pétalas',fireflies:'Vagalumes', 'comet-tail':'Cometinhas de luz','double-beat':'Batida dupla',bloom:'Florescer'} as Record<string,string>)[avatarFrame.motion]} <span className="text-indigo-400">⌄</span></span>
</button>
</div>
{framePicker && <div className="rounded-xl border border-indigo-500/20 bg-neutral-50 dark:bg-[#12131a] p-2.5">
<div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{framePicker === 'finish' ? 'Escolha o acabamento' : 'Escolha o movimento'}</span><button type="button" onClick={()=>setFramePicker(null)} className="text-[10px] text-indigo-400">Fechar</button></div>
{framePicker === 'finish' ? <div className="grid grid-cols-3 gap-2">
{([{id:'solid',name:'Clássico',desc:'Cor uniforme'},{id:'gradient',name:'Degradê',desc:'Cores nos desenhos'},{id:'pastel-rainbow',name:'Arco-íris',desc:'Tons suaves'},{id:'soft-neon',name:'Neon suave',desc:'Brilho delicado'},{id:'pearl',name:'Perolado',desc:'Reflexo claro'},{id:'metallic',name:'Metálico',desc:'Toque metalizado'},{id:'matte',name:'Fosco',desc:'Cor suave sem brilho'},{id:'satin',name:'Acetinado',desc:'Reflexo discreto'},{id:'crystal',name:'Cristalino',desc:'Brilho translúcido'}] as const).map(item=><button key={item.id} type="button" onClick={()=>{setAvatarFrame(v=>({...v,finish:item.id}));setFramePicker(null)}} className={'rounded-lg border p-2 text-left '+(avatarFrame.finish===item.id?'border-indigo-500 bg-indigo-500/10':'border-neutral-200 dark:border-neutral-700')}>
<AvatarFrame profileId={'finish-'+item.id} settings={{...avatarFrame,finish:item.id,motion:'none'}} size={36}><span className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[9px] text-white">A</span></AvatarFrame><span className="block mt-1 text-[10px] font-semibold text-neutral-800 dark:text-neutral-100">{item.name}</span><span className="block text-[9px] text-neutral-500">{item.desc}</span></button>)}
</div> : <div className="space-y-3"><div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3"><AvatarFrame profileId="motion-large-preview" settings={avatarFrame} size={92}><span className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center text-lg text-white">A</span></AvatarFrame><div><p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Prévia do movimento selecionado</p><p className="text-[10px] text-neutral-500">Toque em uma opção abaixo para assistir aqui, em tamanho maior.</p></div></div><div className="grid grid-cols-2 gap-2">
{([{id:'none',name:'Sem movimento',desc:'Fixo e discreto'},{id:'soft-pulse',name:'Pulso delicado',desc:'Intensidade suave'},{id:'soft-glow',name:'Brilho respirando',desc:'Luz que aparece e some'},{id:'color-shift',name:'Cores em transição',desc:'Tons mudam devagar'},{id:'soft-shimmer',name:'Cintilação discreta',desc:'Reflexos sutis'},{id:'color-wave',name:'Onda de brilho',desc:'Brilho percorre os detalhes'},{id:'twinkle',name:'Pontinhos cintilantes',desc:'Pequenos pontos brilham'},{id:'soft-breathe',name:'Respiração suave',desc:'A moldura ganha vida'},{id:'glint',name:'Reflexo perolado',desc:'Reflexo delicado'},{id:'rainbow-wave',name:'Arco-íris delicado',desc:'Cores suaves alternadas'},{id:'sparkle-wave',name:'Brilhos alternados',desc:'Pequenos brilhos em sequência'},{id:'soft-blink',name:'Pisca-pisca suave',desc:'Acende e suaviza lentamente, sem flashes fortes'},{id:'slow-twinkle',name:'Cintilar lento',desc:'Detalhes brilham em tempos diferentes'},{id:'light-ripple',name:'Ondinha de luz',desc:'Um brilho discreto percorre os desenhos'},{id:'gentle-glimmer',name:'Cintilação leve',desc:'Pequenos reflexos aparecem suavemente'},{id:'color-breathe',name:'Cores que respiram',desc:'As cores ganham vida devagar'},{id:'soft-sway',name:'Brisa delicada',desc:'Enfeites balançam de lado'},{id:'petal-dance',name:'Dança das pétalas',desc:'Pétalas se inclinam alternadamente'},{id:'fireflies',name:'Vagalumes',desc:'Luzinhas aparecem e flutuam'},{id:'comet-tail',name:'Cometinhas de luz',desc:'Pequenos rastros luminosos'},{id:'double-beat',name:'Batida dupla',desc:'Duas pulsações e uma pausa'},{id:'bloom',name:'Florescer',desc:'Mini flores se abrem e fecham'}] as const).map(item=><button key={item.id} type="button" onClick={()=>{setAvatarFrame(v=>({...v,motion:item.id}));setFramePicker(null)}} className={'rounded-lg border p-2 text-left flex items-center gap-2 '+(avatarFrame.motion===item.id?'border-indigo-500 bg-indigo-500/10':'border-neutral-200 dark:border-neutral-700')}>
<AvatarFrame profileId={'motion-'+item.id} settings={{...avatarFrame,motion:'none'}} size={44}><span className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[8px] text-white">A</span></AvatarFrame><span className="min-w-0"><span className="block text-[10px] font-semibold text-neutral-800 dark:text-neutral-100">{item.name}</span><span className="block text-[9px] text-neutral-500">{item.desc}</span></span></button>)}
</div></div>}
</div>}
                    <FrameColorControls frame={avatarFrame} onChange={setAvatarFrame} />
          <AvatarFrameGallery
                      frame={avatarFrame}
                      onChange={setAvatarFrame}
                      profileId={profile?.id || 'new-profile'}
                      avatarText={avatarTab === 'emoji' ? selectedEmoji : profileName.slice(0,1).toUpperCase()}
                      avatarColor={selectedColor}
                    />
<button type="button" onClick={handleSaveOrEdit} className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">Concluir e salvar</button>
                  </div>
                </div>
              )}
              {/* E-mail Input com Sugestões de Domínio */}
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
                    {emailSuggestions.map((suggestion, idx) => (
                      <button
                        key={`email-sug-${suggestion}-${idx}`}
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

              {/* Usuário Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Usuário <span className="text-[10px] font-normal text-neutral-400">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nome de usuário"
                    className="w-full h-11 pl-10 pr-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                </div>
              </div>

              {/* Senha Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Senha <span className="text-[10px] font-normal text-neutral-400">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha..."
                    className="w-full h-11 pl-10 pr-11 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 cursor-pointer"
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
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                    <Link className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={accessLink}
                    onChange={(e) => setAccessLink(e.target.value)}
                    placeholder="https://exemplo.com/login"
                    className="w-full h-11 pl-10 pr-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                </div>
              </div>

              {/* Rascunho / Descrição */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Rascunho / Descrição
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-neutral-500">
                    <AlignLeft className="w-4 h-4" />
                  </span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Anotações, observações..."
                    className="w-full h-24 pl-10 pr-4 py-2.5 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-neutral-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 min-w-0 bg-neutral-50 select-none dark:border-[#26283b]/70 dark:bg-[#111219]/90">
          {/* Delete Button (Only visible in edit-mode, when editing) */}
          <div className="flex justify-center sm:justify-start w-full sm:w-auto">
            {isEditMode && onDelete && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-1.5 bg-rose-500/5 dark:bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20 whitespace-nowrap">
                  <span className="text-[10px] font-bold text-rose-500 px-1">Excluir conta?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2.5 py-1 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all cursor-pointer"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-rose-500 hover:text-rose-400 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir Conta
                </button>
              )
            )}
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
            {openPresetsManager ? (
              <>
                {editingPresetId && editingPresetId !== 'new_preset_creation_mode' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCreateNewPreset}
                      className="w-full sm:w-auto px-4 h-10 rounded-lg text-sm font-semibold border border-neutral-200 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer transition-all whitespace-nowrap dark:border-[#2c2e42] dark:hover:bg-[#1a1b26] dark:text-neutral-400"
                    >
                      Cancelar edição
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto px-4 h-10 rounded-lg text-sm font-semibold border border-neutral-200 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer transition-all whitespace-nowrap dark:border-[#2c2e42] dark:hover:bg-[#1a1b26] dark:text-neutral-400"
                    >
                      Sair sem salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveExistingPreset();
                      }}
                      disabled={!profileName.trim()}
                      className="w-full sm:w-auto px-6 h-10 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>Salvar alterações</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto px-5 h-10 rounded-lg text-sm font-semibold border border-neutral-200 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer transition-all whitespace-nowrap dark:border-[#2c2e42] dark:hover:bg-[#1a1b26] dark:text-neutral-400"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (profileName.trim()) {
                          handleSaveNewPreset();
                        }
                        onClose();
                      }}
                      disabled={!profileName.trim()}
                      className="w-full sm:w-auto px-6 h-10 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Salvar novo</span>
                    </button>
                  </>
                )}
              </>
            ) : isEditMode && !isEditingInView ? (
              /* View State Actions */
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 h-10 rounded-lg text-sm font-semibold border border-neutral-200 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer transition-all whitespace-nowrap dark:border-[#2c2e42] dark:hover:bg-neutral-800 dark:text-neutral-400"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingInView(true)}
                  className="flex-1 sm:flex-none px-5 h-10 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer whitespace-nowrap"
                >
                  Editar Perfil
                </button>
              </>
            ) : (
              /* Edit/Create Form State Actions */
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (isEditMode) {
                      setIsEditingInView(false);
                    } else {
                      onClose();
                    }
                  }}
                  className="flex-1 sm:flex-none px-4 h-10 rounded-lg text-sm font-semibold border border-neutral-200 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer transition-all whitespace-nowrap dark:border-[#2c2e42] dark:hover:bg-[#1a1b26] dark:text-neutral-400"
                >
                  {isEditMode ? 'Cancelar' : 'Fechar'}
                </button>
                <button
                  type="button"
                  id="save-profile-btn"
                  data-testid="save-profile-btn"
                  disabled={isCustomProfile ? !customProfileName.trim() : !profileName}
                  onClick={handleSaveOrEdit}
                  className="flex-1 sm:flex-none px-5 h-10 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                >
                  {isEditMode ? 'Salvar Alterações' : 'Salvar Perfil'}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  </div>
);
};
