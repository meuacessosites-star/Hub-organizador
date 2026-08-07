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
                    onClick={() => setIsEditingNamesList(!isEditingNamesList)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isEditingNamesList ? '✓ Concluir' : '⚙️ Gerenciar'}
                  </button>
                </div>

                {isEditingNamesList ? (
                  <div className="flex flex-col gap-2 p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 dark:border-[#2a2d40]/60 dark:bg-[#111219]/50 max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
                    <div className="flex flex-col gap-2 pb-2.5 border-b border-neutral-200/50 dark:border-white/[0.05]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                          Gerenciar e reordenar perfis
                        </span>
                        <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 shrink-0">
                          <GripVertical className="w-3 h-3 inline" /> Arraste o ícone para reordenar
                        </span>
                      </div>
                      
                      {/* Action buttons row placed below the header */}
                      <div className="flex items-center gap-2">
                        {showBulkDelete ? (
                          <>
                            {selectedPresetIds.size > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLocalProfilePresets(prev => prev.filter(p => !selectedPresetIds.has(p.id)));
                                  addToast(`${selectedPresetIds.size} perfil(is) marcado(s) para exclusão! Salve para confirmar.`, 'info');
                                  setSelectedPresetIds(new Set());
                                }}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Excluir Selecionados ({selectedPresetIds.size})
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setShowBulkDelete(false);
                                setSelectedPresetIds(new Set());
                              }}
                              className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-[11px] font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowBulkDelete(true)}
                            className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            Selecionar vários
                          </button>
                        )}
                      </div>
                    </div>

                    <Reorder.Group
                      axis="y"
                      values={localProfilePresets}
                      onReorder={setLocalProfilePresets}
                      className="flex flex-col gap-2"
                    >
                      {localProfilePresets.map((preset, idx) => (
                        <PresetReorderItem
                          key={`reorder-item-${preset.id || idx}`}
                          preset={preset}
                          isSelected={selectedPresetIds.has(preset.id)}
                          onToggleSelect={showBulkDelete ? () => {
                            setSelectedPresetIds(prev => {
                              const next = new Set(prev);
                              if (next.has(preset.id)) {
                                next.delete(preset.id);
                              } else {
                                next.add(preset.id);
                              }
                              return next;
                            });
                          } : undefined}
                          isEditing={editingPresetId === preset.id}
                          liveAvatar={{
                            type: avatarTab,
                            value: avatarTab === 'image' ? imageUrl : avatarTab === 'emoji' ? selectedEmoji : selectedColor,
                            bgColor: selectedColor,
                            zoom: avatarTab === 'image' ? avatarZoom : undefined
                          }}
                          onEdit={(presetToEdit) => {
                            setEditingPresetId(presetToEdit.id);
                            setProfileName(presetToEdit.name);
                            setIsCustomProfile(true);
                            setCustomProfileName(presetToEdit.name);
                            if (presetToEdit.avatar.bgColor) setSelectedColor(presetToEdit.avatar.bgColor);
                            else if (presetToEdit.avatar.type === 'color') setSelectedColor(presetToEdit.avatar.value);
                            
                            const isImg = presetToEdit.avatar.type === 'image' || (presetToEdit.avatar.value && (
                              presetToEdit.avatar.value.startsWith('http') ||
                              presetToEdit.avatar.value.startsWith('data:') ||
                              presetToEdit.avatar.value.startsWith('blob:') ||
                              presetToEdit.avatar.value.startsWith('/')
                            ));

                            if (isImg && presetToEdit.avatar.value) {
                              setAvatarTab('image');
                              setImageUrl(presetToEdit.avatar.value);
                              setAvatarZoom(presetToEdit.avatar.zoom || 1);
                            } else if (presetToEdit.avatar.type === 'emoji') {
                              setAvatarTab('emoji');
                              setSelectedEmoji(presetToEdit.avatar.value);
                              setImageUrl('');
                            } else {
                              setAvatarTab('color');
                              setImageUrl('');
                            }
                            
                            setEmail(presetToEdit.email || '');
                            setUsername(presetToEdit.username || '');
                            setPassword(presetToEdit.password || '');
                            setAccessLink(presetToEdit.accessLink || '');
                            setDescription(presetToEdit.description || '');
                            
                            addToast(`Editando preset: ${presetToEdit.name}`, 'info');
                            setTimeout(() => {
                              customNameInputRef.current?.focus();
                              customNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                          }}
                          onDelete={(presetToDelete) => {
                            setLocalProfilePresets(prev => prev.filter(p => p.id !== presetToDelete.id));
                            if (profileName === presetToDelete.name) {
                              setProfileName(localProfilePresets.find(p => p.id !== presetToDelete.id)?.name || '');
                            }
                            if (editingPresetId === presetToDelete.id) {
                              setEditingPresetId(null);
                              setIsCustomProfile(false);
                            }
                            addToast(`Preset "${presetToDelete.name}" removido localmente! Salve para confirmar.`, 'info');
                          }}
                        />
                      ))}
                    </Reorder.Group>

                    {/* New/Edit Preset Form Integrated */}
                    {isCustomProfile && (
                      <div className="mt-2 p-3 rounded-xl border-2 border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-500/5 flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                              {editingPresetId ? 'Nome do Preset (Editando)' : 'Nome do Novo Preset'}
                            </label>
                            {editingPresetId && (
                              <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                Modo Edição
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5">
                            {/* Live Avatar Preview Badge at the top of the edit section */}
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md border-2 border-indigo-200 dark:border-indigo-500/30 overflow-hidden shrink-0"
                              style={{
                                backgroundColor: selectedColor,
                              }}
                              title="Visualização em tempo real do Avatar do perfil"
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
                                (customProfileName || 'P').slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <input
                              ref={customNameInputRef}
                              type="text"
                              value={customProfileName}
                              onChange={(e) => setCustomProfileName(e.target.value)}
                              placeholder="Ex: Minha Empresa"
                              className="flex-1 h-10 px-3 rounded-lg text-xs bg-white border border-indigo-200 text-neutral-800 focus:outline-none focus:border-indigo-500 dark:bg-[#13141c] dark:border-[#2a2d40] dark:text-neutral-200 shadow-sm"
                            />
                          </div>
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

                            let finalAvatarType = avatarTab;
                            let avatarValue = '';
                            if (avatarTab === 'color') avatarValue = selectedColor;
                            else if (avatarTab === 'emoji') avatarValue = selectedEmoji;
                            else {
                              if (imageUrl) {
                                avatarValue = imageUrl;
                              } else {
                                finalAvatarType = 'color';
                                avatarValue = selectedColor;
                              }
                            }

                            const presetData = {
                              id: editingPresetId || `preset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                              name: nameToSave,
                              avatar: { 
                                type: finalAvatarType, 
                                value: avatarValue, 
                                bgColor: selectedColor, 
                                zoom: finalAvatarType === 'image' ? avatarZoom : undefined 
                              },
                              email, 
                              username, 
                              password, 
                              accessLink, 
                              description
                            };

                            if (editingPresetId) {
                              setLocalProfilePresets(prev => prev.map(p => p.id === editingPresetId ? presetData : p));
                              addToast(`Preset "${nameToSave}" atualizado localmente! Salve para confirmar.`, 'info');
                            } else {
                              setLocalProfilePresets(prev => [...prev, presetData]);
                              addToast(`Novo preset "${nameToSave}" adicionado localmente! Salve para confirmar.`, 'info');
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
                    
                    {localProfilePresets.length === 0 && !isCustomProfile && (
                      <p className="text-[10px] text-neutral-500 text-center py-4">
                        Nenhum perfil salvo como padrão.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-0.5 transition-all duration-300">
                    {(showAllPresets ? localProfilePresets : localProfilePresets.slice(0, 8)).map((preset) => {
                      const isSel = profileName === preset.name && !isCustomProfile;
                      const isHex = (val?: string) => val && /^#([0-9A-F]{3}){1,2}$/i.test(val);
                      const chipBgColor = isHex(preset.avatar.bgColor) 
                        ? preset.avatar.bgColor 
                        : isHex(preset.avatar.value) 
                          ? preset.avatar.value 
                          : '#6366f1';

                      return (
                        <button
                          key={`preset-chip-${preset.id}`}
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

                    <button
                      type="button"
                      onClick={() => setIsCustomProfile(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                        isCustomProfile
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-transparent dark:bg-[#111219] dark:hover:bg-neutral-800/80 dark:text-neutral-400'
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

              {!isEditingNamesList && (
                <>
                  {/* E-mail Input */}
              <div className="flex flex-col gap-1.5">
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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@email.com"
                    className="w-full h-11 pl-10 pr-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                </div>
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

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Senha (opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Salvar senha..."
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
                  Link de login (opcional)
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

              {/* Description */}
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
                    placeholder="Anotações, observações, informações extras... sem limite de caracteres."
                    className="w-full h-20 pl-10 pr-4 py-2.5 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 resize-none"
                  />
                </div>
              </div>
            </>
          )}

              {/* Avatar options tabs */}
              <div className="flex flex-col gap-2 pt-1">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Avatar do perfil
                </label>

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
                    id="profile-emoji-tab-btn"
                    data-testid="profile-emoji-tab-btn"
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

                {/* Sub Panel */}
                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col items-center dark:border-[#25283a] dark:bg-[#14151f]">
                  {(avatarTab === 'color' || avatarTab === 'emoji') && (
                    <div className="flex flex-col items-center gap-4 w-full">
                      
                      {/* Unified Preview for Emoji / Letter */}
                      {avatarTab === 'emoji' && (
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner select-none mb-1 text-white border border-black/10"
                          style={{ backgroundColor: selectedColor }}
                        >
                          {selectedEmoji || '👤'}
                        </div>
                      )}

                      {/* Unified Color Input */}
                      <div className="flex items-center gap-3 w-full max-w-xs">
                        <button
                          type="button"
                          onClick={() => setShowColorWheel(!showColorWheel)}
                          className="w-10 h-10 rounded-xl border border-neutral-300 shadow-md flex items-center justify-center text-xs text-white dark:border-[#25283a]/80 shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer relative group"
                          style={{ backgroundColor: selectedColor }}
                          title="Abrir/Fechar roda de cores"
                        >
                          <Palette className="w-4.5 h-4.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] opacity-80 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <input
                          type="text"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          placeholder="#000000"
                          className="flex-1 h-10 px-3 rounded-xl text-xs bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 font-mono dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                        />
                      </div>

                      {/* Color Wheel (Toggled & Animated) */}
                      <AnimatePresence>
                        {showColorWheel && (
                          <motion.div
                            ref={colorWheelContainerRef}
                            initial={{ opacity: 0, scale: 0.9, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, scale: 1, height: 'auto', marginTop: 8 }}
                            exit={{ opacity: 0, scale: 0.9, height: 0, marginTop: 0 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 180 }}
                            className="overflow-hidden flex flex-col items-center gap-4 w-full"
                          >
                            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider self-center select-none flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              Arraste na roda para escolher a cor
                            </span>
                            <div className="relative w-32 h-32 flex items-center justify-center select-none touch-none">
                              {/* Pulsing attention halo ripple */}
                              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping pointer-events-none" style={{ animationDuration: '2s' }} />
                              <div
                                ref={colorWheelRef}
                                id="profile-color-wheel-canvas"
                                data-testid="profile-color-wheel-canvas"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUpOrLeave}
                                onMouseLeave={handleMouseUpOrLeave}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                className="rounded-full cursor-crosshair border border-neutral-300 shadow-md dark:border-neutral-700 touch-none z-10 w-full h-full"
                                style={{
                                  background: `
                                    radial-gradient(circle, #fff 0%, transparent 100%),
                                    conic-gradient(from 180deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)
                                  `
                                }}
                              />
                              <div
                                className="absolute w-8 h-8 rounded-full border-2 border-white shadow-md pointer-events-none flex items-center justify-center font-bold text-white uppercase"
                                style={{ backgroundColor: selectedColor }}
                              >
                                {avatarTab === 'color' ? (
                                  <span className="text-[10px]">{(isCustomProfile ? customProfileName : profileName).slice(0, 2).toUpperCase() || 'PE'}</span>
                                ) : (
                                  <span className="text-base">{selectedEmoji || '👤'}</span>
                                )}
                              </div>

                              {/* Dynamic line indicator (pauzinho) and handle circle */}
                              {(() => {
                                const coords = getIndicatorCoords(selectedColor, 64);
                                return (
                                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                                    <line
                                      x1={64}
                                      y1={64}
                                      x2={coords.x}
                                      y2={coords.y}
                                      stroke="white"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      className="shadow-sm drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.6)]"
                                    />
                                    <circle
                                      cx={coords.x}
                                      cy={coords.y}
                                      r="5"
                                      fill={selectedColor}
                                      stroke="white"
                                      strokeWidth="2"
                                      className="shadow-md"
                                    />
                                  </svg>
                                );
                              })()}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {PRESET_COLORS.map((col, idx) => (
                          <button
                            key={`profile-color-${col}-${idx}`}
                            type="button"
                            onClick={() => setSelectedColor(col)}
                            className="w-6 h-6 rounded-full border border-black/40 flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
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

                  {avatarTab === 'emoji' && (
                    <div className="flex flex-col items-center gap-3.5 w-full mt-4 pt-4 border-t border-neutral-200 dark:border-[#2a2d40]">
                      <div className="grid grid-cols-5 gap-2 max-w-xs justify-center w-full">
                        {PRESET_EMOJIS.map((em, idx) => (
                          <button
                            key={`profile-emoji-${em}-${idx}`}
                            type="button"
                            id={`profile-preset-emoji-${em}`}
                            data-testid={`profile-preset-emoji-${em}`}
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

                      <div className="w-full max-w-[220px] mt-1 text-center">
                        <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5 select-none">
                          Ou digite seu emoji / letra
                        </label>
                        <input
                          type="text"
                          maxLength={8}
                          value={selectedEmoji}
                          onChange={(e) => setSelectedEmoji(e.target.value)}
                          placeholder="Cole ou digite aqui..."
                          className="w-full h-9 px-3 rounded-lg text-center text-xs bg-neutral-100 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 dark:bg-[#13141c] dark:border-[#25283a] dark:text-neutral-200 dark:placeholder-neutral-600"
                        />
                      </div>
                    </div>
                  )}

                  {avatarTab === 'image' && (
                    <div className="flex flex-col items-center gap-4 w-full select-none">
                      <div 
                        className="w-16 h-16 rounded-full border-2 border-indigo-500/20 overflow-hidden flex items-center justify-center shadow-lg transition-colors bg-white dark:bg-black"
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
                                   type="text"
                                   inputMode="numeric"
                                   value={zoomInput}
                                   onChange={(e) => {
                                     const str = e.target.value.replace(/\D/g, '');
                                     setZoomInput(str);
                                     if (str === '') return;
                                     const val = parseInt(str);
                                     if (!isNaN(val) && val >= 20 && val <= 500) {
                                       setAvatarZoom(val / 100);
                                     }
                                   }}
                                   onFocus={() => setIsZoomFocused(true)}
                                   onBlur={() => {
                                     setIsZoomFocused(false);
                                     const val = parseInt(zoomInput);
                                     if (zoomInput === '' || isNaN(val)) {
                                       setZoomInput(String(Math.round(avatarZoom * 100)));
                                     } else {
                                       const clamped = Math.max(20, Math.min(500, val));
                                       setZoomInput(String(clamped));
                                       setAvatarZoom(clamped / 100);
                                     }
                                   }}
                                   className="w-12 h-6 px-1 text-right text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500"
                                   title="Digite o zoom manually"
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
                                  key={`profile-bgcol-${color}-${idx}`}
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
