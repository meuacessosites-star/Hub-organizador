import { resizeImage } from "../utils/imageHelper";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Profile, Platform, ProfileAvatar, ProfilePreset } from '../types';
import { X, User, Mail, Lock, Eye, EyeOff, Link, AlignLeft, Palette, Smile, Image as ImageIcon, Copy, Check, Trash2, Bookmark, Pencil, Upload, RefreshCw, GripVertical, Square, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { useToast } from '../context/ToastContext';
import { safeParse, safeSetItem, safeUrl } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../hooks/useStorage';
import { SmartImage } from './SmartImage';

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
  onEdit: (preset: ProfilePreset) => void;
  onDelete: (preset: ProfilePreset) => void;
}

const PresetReorderItem: React.FC<PresetReorderItemProps> = ({ preset, isEditing, isSelected, onToggleSelect, liveAvatar, onEdit, onDelete }) => {
  const dragControls = useDragControls();

  const activeAvatar = isEditing && liveAvatar ? liveAvatar : preset.avatar;

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
      className={`flex items-center gap-2 p-2 rounded-lg border shadow-sm select-none transition-all ${
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
            alt={preset.name}
            className="w-full h-full object-cover"
            style={{ transform: `scale(${activeAvatar.zoom || 1})` }}
          />
        ) : (
          <span className="text-white font-bold">{preset.name ? preset.name.slice(0, 2).toUpperCase() : 'PF'}</span>
        )}
      </div>
      <span className="flex-1 text-xs font-medium truncate">{preset.name}</span>
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
  onManageProfiles,
}) => {
  const isEditMode = !!profile;
  const { addToast } = useToast();
  const { user } = useAuth();
  const { profilePresets, saveProfilePresets } = useStorage();
  
  const [localProfilePresets, setLocalProfilePresets] = useState<ProfilePreset[]>([]);
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalProfilePresets([...profilePresets]);
      setSelectedPresetIds(new Set());
      setShowBulkDelete(false);
    }
  }, [isOpen, profilePresets]);

  useEffect(() => {
    if (isOpen && openPresetsManager) {
      setIsEditingNamesList(true);
      setIsEditingInView(true);
    }
  }, [isOpen, openPresetsManager]);
  
  const movePresetUp = (index: number) => {
    if (index <= 0) return;
    const newPresets = [...localProfilePresets];
    const temp = newPresets[index];
    newPresets[index] = newPresets[index - 1];
    newPresets[index - 1] = temp;
    setLocalProfilePresets(newPresets);
  };

  const movePresetDown = (index: number) => {
    if (index >= localProfilePresets.length - 1) return;
    const newPresets = [...localProfilePresets];
    const temp = newPresets[index];
    newPresets[index] = newPresets[index + 1];
    newPresets[index + 1] = temp;
    setLocalProfilePresets(newPresets);
  };
  
  const getProfileNamesKey = () => user ? `hub_user_${user.uid}_profile_names` : 'hub_profile_names';

  const [isEditingNamesList, setIsEditingNamesList] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

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
  }, [profile, isOpen, isEditMode, platform, startInEditMode]);

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
        });
      }
      saveProfilePresets(localProfilePresets);
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
        });
      }
      saveProfilePresets(localProfilePresets);
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

  if (!isOpen || (!platform && !openPresetsManager)) return null;

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
            <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{openPresetsManager ? 'Gerenciar Perfis Padrão (Presets)' : isEditMode ? 'Visualizar perfil' : 'Adicionar conta'}</span>
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
        <div className="p-4 sm:p-6 max-h-[80vh] sm:max-h-[75vh] overflow-y-auto">
          {isEditMode && !isEditingInView ? (
            /* VIEW DETAILS MODE */
            <div className="flex flex-col gap-5 select-text">
              {/* Profile Avatar Card */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-white/[0.06]">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md uppercase overflow-hidden shrink-0"
                  style={{
                    backgroundColor: selectedColor,
                  }}
                >
                  {avatarTab === 'emoji' && selectedEmoji ? (
                    selectedEmoji
                  ) : avatarTab === 'image' && imageUrl ? (
                    <SmartImage 
                      src={imageUrl} 
                      alt="profile" 
                      className="w-full h-full object-cover transition-transform duration-200" 
                      style={{ transform: `scale(${avatarZoom})` }} 
                    />
                  ) : (
                    (isCustomProfile ? customProfileName : profileName).slice(0, 2).toUpperCase()
                  )}
                </div>
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
                        onClose();
                      }
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    ⚙️ Gerenciar
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-0.5 transition-all duration-300">
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
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors uppercase tracking-wider cursor-pointer bg-indigo-500/5 hover:bg-indigo-500/10"
                    >
                      {showAllPresets ? 'Ver menos' : `+${localProfilePresets.length - 8} outros`}
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
        <div className="px-4 sm:px-6 py-4 border-t border-neutral-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 bg-neutral-50 select-none dark:border-[#26283b]/70 dark:bg-[#111219]/90">
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

          <div className="flex items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
            {openPresetsManager ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 h-10 rounded-lg text-sm font-semibold border border-neutral-200 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer transition-all whitespace-nowrap dark:border-[#2c2e42] dark:hover:bg-[#1a1b26] dark:text-neutral-400"
                >
                  Sair sem salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveProfilePresets(localProfilePresets);
                    addToast('Configurações de perfis salvas com sucesso! ✨', 'success');
                    onClose();
                  }}
                  className="w-full sm:w-auto px-6 h-10 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md"
                >
                  Salvar
                </button>
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
