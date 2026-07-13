import { resizeImage } from "../utils/imageHelper";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Profile, Platform, ProfileAvatar } from '../types';
import { X, User, Mail, Lock, Eye, EyeOff, Link, AlignLeft, Palette, Smile, Image as ImageIcon, Copy, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';
import { safeParse, safeSetItem, safeUrl } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: Platform | null;
  profile: Profile | null; // If null, mode is "add"
  onSave: (profileData: Omit<Profile, 'id'>) => void;
  onEdit: (profileId: string, profileData: Partial<Profile>) => void;
  onDelete?: (profileId: string) => void;
  startInEditMode?: boolean;
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

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  platform,
  profile,
  onSave,
  onEdit,
  onDelete,
  startInEditMode = false,
}) => {
  const isEditMode = !!profile;
  const { addToast } = useToast();
  const { user } = useAuth();
  
  const getProfileNamesKey = () => user ? `hub_user_${user.uid}_profile_names` : 'hub_profile_names';

  // Form states
  const [profileNames, setProfileNames] = useState<string[]>(() => {
    let saved = localStorage.getItem(getProfileNamesKey());
    if (!saved && user) saved = localStorage.getItem('hub_profile_names');
    return safeParse(saved, ['Pessoal', 'Trabalho', 'Família', 'Estudos', 'Freelance', 'Empresa']);
  });

  const [isEditingNamesList, setIsEditingNamesList] = useState(false);

  const saveProfileNames = (names: string[]) => {
    setProfileNames(names);
    safeSetItem(getProfileNamesKey(), JSON.stringify(names));
  };

  const [profileName, setProfileName] = useState('Pessoal');
  const [customProfileName, setCustomProfileName] = useState('');
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
  const [showColorWheel, setShowColorWheel] = useState(false);

  // UI state
  const [isEditingInView, setIsEditingInView] = useState(!isEditMode || startInEditMode);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const colorWheelRef = useRef<HTMLCanvasElement>(null);
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
    if (isEditMode && profile) {
      setIsEditingInView(startInEditMode);
      const isPreset = profileNames.includes(profile.name);
      if (isPreset) {
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

      setAvatarTab(profile.avatar.type);
      if (profile.avatar.type === 'color') {
        setSelectedColor(profile.avatar.value);
      } else if (profile.avatar.type === 'emoji') {
        setSelectedEmoji(profile.avatar.value);
      } else {
        setImageUrl(profile.avatar.value);
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
    }
  }, [profile, isOpen, isEditMode, platform]);

  // Reset color wheel state when switching tabs
  useEffect(() => {
    setShowColorWheel(false);
  }, [avatarTab]);

  // Color wheel generator
  const drawColorWheel = () => {
    const canvas = colorWheelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = width / 2;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= radius) {
          let angle = Math.atan2(dy, dx) + Math.PI;
          const hue = (angle / (Math.PI * 2)) * 360;
          const sat = dist / radius;
          const val = 1.0;

          const rgb = hsvToRgb(hue, sat, val);
          const index = (y * width + x) * 4;
          data[index] = rgb[0];
          data[index + 1] = rgb[1];
          data[index + 2] = rgb[2];
          data[index + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  useEffect(() => {
    if (showColorWheel) {
      // Delay slightly to ensure framer-motion has mounted the canvas
      const timer = setTimeout(() => {
        drawColorWheel();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showColorWheel, avatarTab]);

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
    const canvas = colorWheelRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    try {
      const clampedX = Math.max(0, Math.min(canvas.width - 1, x * (canvas.width / rect.width)));
      const clampedY = Math.max(0, Math.min(canvas.height - 1, y * (canvas.height / rect.height)));
      
      const pixel = ctx.getImageData(clampedX, clampedY, 1, 1).data;
      if (pixel[3] > 0) {
        const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(val => {
          const hexStr = val.toString(16);
          return hexStr.length === 1 ? '0' + hexStr : hexStr;
        }).join('');
        setSelectedColor(hex);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    handleColorSelection(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      handleColorSelection(e.clientX, e.clientY);
    }
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    if (e.touches[0]) {
      handleColorSelection(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
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

    let avatarValue = '';
    if (avatarTab === 'color') {
      avatarValue = selectedColor;
    } else if (avatarTab === 'emoji') {
      avatarValue = selectedEmoji;
    } else {
      avatarValue = imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    }

    const avatarObj: ProfileAvatar = {
      type: avatarTab,
      value: avatarValue,
      bgColor: selectedColor,
    };

    if (isEditMode && profile) {
      onEdit(profile.id, {
        name: finalProfileName,
        username,
        email,
        password,
        accessLink,
        description,
        avatar: avatarObj,
      });
      addToast(`Conta "${finalProfileName}" atualizada com sucesso! 👤`, 'success');
      setIsEditingInView(false);
      onClose();
    } else {
      onSave({
        name: finalProfileName,
        username,
        email,
        password,
        accessLink,
        description,
        avatar: avatarObj,
      });
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

  if (!isOpen || !platform) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-white dark:bg-[#181922] rounded-2xl border border-neutral-200 dark:border-[#26283b] overflow-hidden shadow-2xl text-neutral-800 dark:text-neutral-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-[#26283b]/70 flex items-center justify-between bg-neutral-50 dark:bg-[#111219]/90">
          <div>
            <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{isEditMode ? 'Visualizar perfil' : 'Adicionar conta'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100 dark:border-transparent">
                {platform.name}
              </span>
            </h2>
            <p className="text-neutral-500 text-[10px] font-medium mt-1">
              {isEditMode ? 'Detalhes e credenciais de acesso' : 'Cadastre um novo perfil de acesso'}
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
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {isEditMode && !isEditingInView ? (
            /* VIEW DETAILS MODE */
            <div className="flex flex-col gap-5 select-text">
              {/* Profile Avatar Card */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-[#111219]/80 border border-neutral-200 dark:border-[#25283a]">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md uppercase"
                  style={{
                    backgroundColor:
                      avatarTab === 'image' ? 'transparent' : (profile?.avatar?.bgColor || selectedColor),
                  }}
                >
                  {avatarTab === 'emoji' ? (
                    selectedEmoji
                  ) : avatarTab === 'image' && imageUrl ? (
                    <img referrerPolicy="no-referrer" src={imageUrl} alt="profile" className="w-full h-full object-cover rounded-full" />
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
                    Nome do perfil
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsEditingNamesList(!isEditingNamesList)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isEditingNamesList ? '✓ Concluir' : '⚙️ Editar Lista'}
                  </button>
                </div>

                {isEditingNamesList ? (
                  <div className="flex flex-col gap-2 p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 dark:border-[#2a2d40]/60 dark:bg-[#111219]/50 max-h-[180px] overflow-y-auto">
                    <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      Editar nomes rápidos
                    </span>
                    {profileNames.map((name, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            const updated = [...profileNames];
                            updated[idx] = e.target.value;
                            saveProfileNames(updated);
                          }}
                          className="flex-1 h-8 px-2.5 rounded-lg text-xs bg-white border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 dark:bg-[#13141c] dark:border-[#2a2d40] dark:text-neutral-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = profileNames.filter((_, i) => i !== idx);
                            saveProfileNames(updated);
                            if (profileName === name) {
                              setProfileName(updated[0] || '');
                            }
                          }}
                          className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newName = `Novo Perfil ${profileNames.length + 1}`;
                        saveProfileNames([...profileNames, newName]);
                      }}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-left mt-1 cursor-pointer"
                    >
                      + Adicionar novo nome rápido
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {profileNames.map((name, idx) => {
                      const isSel = profileName === name && !isCustomProfile;
                      return (
                        <button
                          key={`${name}-${idx}`}
                          type="button"
                          onClick={() => {
                            setIsCustomProfile(false);
                            setProfileName(name);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            isSel
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-[#111219] dark:hover:bg-neutral-800/80 dark:text-neutral-400'
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setIsCustomProfile(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isCustomProfile
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-[#111219] dark:hover:bg-neutral-800/80 dark:text-neutral-400'
                      }`}
                    >
                      ✏️ Personalizado
                    </button>
                  </div>
                )}

                {isCustomProfile && (
                  <div className="flex flex-col gap-2 mt-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customProfileName}
                        onChange={(e) => setCustomProfileName(e.target.value)}
                        placeholder="Digite o nome do perfil..."
                        className="flex-1 h-10 px-3 rounded-lg text-xs bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                      />
                      {customProfileName.trim() && !profileNames.includes(customProfileName.trim()) && (
                        <button
                          type="button"
                          onClick={() => {
                            const nameToSave = customProfileName.trim();
                            saveProfileNames([...profileNames, nameToSave]);
                            setProfileName(nameToSave);
                            setIsCustomProfile(false);
                          }}
                          className="px-3 shrink-0 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer shadow-sm transition-all whitespace-nowrap"
                          title="Salvar como padrão"
                        >
                          💾 Salvar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                              <canvas
                                ref={colorWheelRef}
                                width={128}
                                height={128}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUpOrLeave}
                                onMouseLeave={handleMouseUpOrLeave}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                className="rounded-full cursor-crosshair border border-neutral-300 shadow-md dark:border-neutral-700 touch-none z-10"
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
                        {PRESET_COLORS.map((col) => (
                          <button
                            key={col}
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
                        {PRESET_EMOJIS.map((em) => (
                          <button
                            key={em}
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
                    <div className="flex flex-col items-center gap-3 w-full select-none">
                      <div className="w-14 h-14 rounded-full border border-neutral-300 overflow-hidden flex items-center justify-center bg-neutral-200 mb-1 dark:border-neutral-700 dark:bg-neutral-800">
                        {imageUrl ? (
                          <img referrerPolicy="no-referrer" src={imageUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-neutral-500" />
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <label className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 font-semibold text-xs transition-all border border-indigo-500/20">
                          Escolher arquivo de imagem
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
            {isEditMode && !isEditingInView ? (
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
  );
};
