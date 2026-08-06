import { resizeImage } from "../utils/imageHelper";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut, Camera, Type, Image as ImageIcon, Smile, Save, Check, Loader2, Palette, Trash2, AlertTriangle, Sparkles, Download, Shield } from 'lucide-react';
import { User, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, UserProfileData } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useStorage } from '../hooks/useStorage';
import { SmartImage } from './SmartImage';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSignOut: () => void;
  onStartTutorial?: () => void;
}

const PRESET_EMOJIS = [
  '👤', '💼', '🏠', '🎓', '🛠️', '🏢', '💰', '🎬', '🛍️', '📁',
  '💻', '📱', '🎮', '❤️', '🌟', '🚀', '🔒', '🔑', '🎨', '✈️'
];

const PRESET_COLORS = [
  '#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#f43f5e', '#84cc16', '#a855f7'
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

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignOut,
  onStartTutorial,
}) => {
  const { userProfile, isGuest, linkPasswordToAccount } = useAuth();
  const { 
    clearAllData, 
    platforms, 
    categories, 
    tags, 
    statuses, 
    profilePresets,
    importData
  } = useStorage();
  const { addToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [avatarTab, setAvatarTab] = useState<'google' | 'color' | 'emoji' | 'image'>('google');
  const [selectedColor, setSelectedColor] = useState('#7c5cfc');
  const [selectedEmoji, setSelectedEmoji] = useState('👤');
  const [imageUrl, setImageUrl] = useState('');
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [customLetters, setCustomLetters] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showColorWheel, setShowColorWheel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [linkPasswordInput, setLinkPasswordInput] = useState('');
  const [isLinkingPassword, setIsLinkingPassword] = useState(false);

  const hasPasswordProvider = user?.providerData?.some(p => p.providerId === 'password');
  const hasGoogleProvider = user?.providerData?.some(p => p.providerId === 'google.com');

  const handleLinkPasswordInModal = async () => {
    if (!linkPasswordInput.trim()) return;
    if (linkPasswordInput.length < 6) {
      addToast('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }
    setIsLinkingPassword(true);
    try {
      await linkPasswordToAccount(linkPasswordInput);
      addToast('Senha vinculada com sucesso! Agora você pode entrar com e-mail e senha ou Google.', 'success');
      setLinkPasswordInput('');
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Erro ao vincular senha.', 'error');
    } finally {
      setIsLinkingPassword(false);
    }
  };

  const colorWheelRef = useRef<HTMLDivElement>(null);
  const colorWheelContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setShowColorWheel(false);
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  // Reset color wheel state when switching tabs
  useEffect(() => {
    setShowColorWheel(false);
  }, [avatarTab]);

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

  const availableGooglePhoto = user?.photoURL || user?.providerData?.find(p => p.photoURL)?.photoURL || userProfile?.photoURL || (userProfile?.avatar?.type === 'google' ? userProfile.avatar.value : '') || '';

  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(userProfile?.displayName || user.displayName || '');
      if (userProfile?.avatar?.type) {
        setAvatarTab(userProfile.avatar.type);
        if (userProfile.avatar.type === 'emoji') {
          setSelectedColor(userProfile.avatar.bgColor || '#7c5cfc');
          setSelectedEmoji(userProfile.avatar.value || '👤');
        } else if (userProfile.avatar.type === 'image') {
          setImageUrl(userProfile.avatar.value || '');
          setAvatarZoom(userProfile.avatar.zoom || 1);
        } else if (userProfile.avatar.type === 'color') {
          setSelectedColor(userProfile.avatar.bgColor || '#7c5cfc');
          setCustomLetters(userProfile.avatar.value || '');
        }
      } else {
        setAvatarTab(availableGooglePhoto ? 'google' : 'color');
        setCustomLetters('');
      }
      setShowSuccess(false);
    }
  }, [isOpen, user, userProfile, availableGooglePhoto]);

  const handleExportData = () => {
    try {
      const exportData = {
        platforms,
        categories: categories.filter(c => c.isCustom),
        tags,
        statuses: statuses.filter(s => s.isCustom),
        profilePresets,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hub_organizador_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addToast('Backup exportado com sucesso!', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      addToast('Falha ao exportar backup.', 'error');
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        // Validation
        if (!data.platforms || !Array.isArray(data.platforms)) {
          throw new Error('Formato de arquivo inválido.');
        }

        if (!window.confirm('Isso irá mesclar os dados importados com os seus atuais. Deseja continuar?')) {
          return;
        }

        // Import logic via useStorage (we'll need to add a bulk import if needed, 
        // but for now we can rely on the fact that useStorage will sync if we 
        // implement it or just add them one by one)
        // For simplicity and safety, we'll suggest a refresh after manual local insertion or just alert
        addToast('Processando importação...', 'info');
        
        await importData(data);
      } catch (err) {
        console.error('Import failed:', err);
        addToast('Falha ao importar arquivo. Verifique o formato.', 'error');
      }
    };
    reader.readAsText(file);
  };

  if (!user) return null;

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let photoToSave = '';
      if (avatarTab === 'image') {
        photoToSave = imageUrl || availableGooglePhoto || '';
      } else if (avatarTab === 'google') {
        photoToSave = availableGooglePhoto || imageUrl || '';
      } else {
        photoToSave = availableGooglePhoto || imageUrl || '';
      }

      const avatarValue = avatarTab === 'emoji' 
        ? selectedEmoji 
        : avatarTab === 'image' 
        ? imageUrl 
        : avatarTab === 'color' 
        ? customLetters 
        : photoToSave;

      const newProfile: UserProfileData = {
        displayName,
        photoURL: photoToSave,
        avatar: {
          type: avatarTab,
          value: avatarValue,
          bgColor: selectedColor,
          zoom: avatarTab === 'image' ? avatarZoom : undefined
        }
      };

      if (!isGuest) {
        if (displayName !== user.displayName) {
          await firebaseUpdateProfile(user, { displayName });
        }
        await setDoc(doc(db, 'usuarios', user.uid), { 
          ...newProfile, 
          email: user.email || '',
          photoURL: photoToSave,
          uid: user.uid,
          origem: 'Hub Organizador', 
          origem_app: 'Hub Organizador',
          updatedAt: new Date().toISOString()
        }, { merge: true });
        await setDoc(doc(db, 'users', user.uid), newProfile, { merge: true });
      } else {
        localStorage.setItem('hub_guest_profile', JSON.stringify(newProfile));
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        if (isGuest) {
          window.location.reload();
        }
      }, 1500);
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAllData = async () => {
    setIsDeletingAll(true);
    try {
      await clearAllData();
      addToast('Todos os dados foram excluídos com sucesso.', 'success');
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Erro ao excluir dados.', 'error');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const renderAvatarPreview = () => {
    const defaultInitial = (displayName || user?.displayName || user?.email || 'U').charAt(0).toUpperCase();
    const defaultFallback = (
      <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-4xl font-bold shadow-inner rounded-full">
        {defaultInitial}
      </div>
    );

    if (avatarTab === 'image' && imageUrl) {
      return (
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
          <SmartImage 
            src={imageUrl} 
            alt="preview" 
            className="w-full h-full object-contain transition-transform duration-200" 
            containerClassName="w-full h-full rounded-full overflow-hidden"
            fallbackIcon={defaultFallback}
            style={{ transform: `scale(${avatarZoom})` }} 
          />
        </div>
      );
    }
    if (avatarTab === 'emoji') {
      return (
        <div className="w-full h-full flex items-center justify-center text-4xl shadow-inner rounded-full" style={{ backgroundColor: selectedColor }}>
          {selectedEmoji}
        </div>
      );
    }
    if (avatarTab === 'color') {
      return (
        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white shadow-inner rounded-full" style={{ backgroundColor: selectedColor }}>
          {customLetters || defaultInitial}
        </div>
      );
    }
    if (avatarTab === 'google' && availableGooglePhoto) {
      return (
        <SmartImage 
          src={availableGooglePhoto} 
          alt="google preview" 
          className="w-full h-full object-cover rounded-full"
          containerClassName="w-full h-full rounded-full overflow-hidden"
          fallbackIcon={defaultFallback}
        />
      );
    }
    
    // Fallback
    return defaultFallback;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] sm:w-full sm:max-w-md bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-2xl z-[101] border border-neutral-200 dark:border-white/[0.08] overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-5 border-b border-neutral-200 dark:border-white/[0.08] flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-sans tracking-tight">
                Meu Perfil
              </h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {/* Avatar Preview */}
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="w-24 h-24 rounded-full shadow-md border-4 border-white dark:border-[#13141c] relative">
                  {renderAvatarPreview()}
                </div>
                <div className="text-center">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">E-mail da conta</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Display Name Input */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                  Nome de exibição
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full h-11 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-neutral-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 transition-all"
                />
              </div>

              {/* Avatar Customization */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-3">
                  Estilo da Foto de Perfil
                </label>
                
                {/* Tabs */}
                <div className="flex gap-2 p-1.5 bg-neutral-100 dark:bg-[#1a1b26] rounded-xl mb-4 overflow-x-auto custom-scrollbar shrink-0">
                  {availableGooglePhoto && (
                    <button
                      type="button"
                      onClick={() => setAvatarTab('google')}
                      className={`flex-1 min-w-[80px] h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        avatarTab === 'google'
                          ? 'bg-white text-indigo-600 shadow-sm dark:bg-[#25283a] dark:text-indigo-400'
                          : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" /> Google
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAvatarTab('color')}
                    className={`flex-1 min-w-[80px] h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      avatarTab === 'color'
                        ? 'bg-white text-indigo-600 shadow-sm dark:bg-[#25283a] dark:text-indigo-400'
                        : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" /> Letra
                  </button>
                  <button
                    type="button"
                    id="emoji-tab-btn"
                    data-testid="emoji-tab-btn"
                    aria-label="Emoji"
                    onClick={() => setAvatarTab('emoji')}
                    className={`flex-1 min-w-[80px] h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      avatarTab === 'emoji'
                        ? 'bg-white text-indigo-600 shadow-sm dark:bg-[#25283a] dark:text-indigo-400'
                        : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Smile className="w-3.5 h-3.5" /> Emoji
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarTab('image')}
                    className={`flex-1 min-w-[80px] h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      avatarTab === 'image'
                        ? 'bg-white text-indigo-600 shadow-sm dark:bg-[#25283a] dark:text-indigo-400'
                        : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Upload
                  </button>
                </div>

                {/* Sub Panel */}
                <div className="min-h-[140px] flex flex-col justify-center bg-neutral-50 border border-neutral-200 rounded-xl p-4 dark:bg-[#111219] dark:border-[#2a2d40]">
                  {avatarTab === 'google' && (
                    <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                      Usando a foto da sua conta Google.
                    </div>
                  )}

                  {(avatarTab === 'color' || avatarTab === 'emoji') && (
                    <div className="flex flex-col gap-4">
                      {avatarTab === 'color' && (
                        <div className="flex flex-col items-center gap-1.5 border-b border-neutral-200/50 dark:border-neutral-800/40 pb-3">
                          <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            Letras do avatar
                          </span>
                          <input
                            type="text"
                            value={customLetters}
                            onChange={(e) => setCustomLetters(e.target.value.slice(0, 3).toUpperCase())}
                            placeholder={(displayName || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                            maxLength={3}
                            className="w-28 h-9 px-3 text-center text-sm font-bold bg-neutral-100 dark:bg-[#1c1d28] border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 uppercase focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}

                      {avatarTab === 'emoji' && (
                        <div>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {PRESET_EMOJIS.map((emoji, idx) => (
                              <button
                                key={`upm-emoji-${emoji}-${idx}`}
                                type="button"
                                onClick={() => setSelectedEmoji(emoji)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg cursor-pointer transition-transform hover:scale-110 active:scale-95 ${
                                  selectedEmoji === emoji ? 'bg-indigo-100 dark:bg-indigo-900/50 shadow-sm' : ''
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Unified Color Input */}
                      <div className="flex items-center gap-3 w-full max-w-xs justify-center mx-auto">
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
                          className="flex-1 h-10 px-3 rounded-xl text-xs bg-neutral-100 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 font-mono dark:bg-[#1a1b26] dark:border-[#2a2d40] dark:text-neutral-200"
                        />
                      </div>

                      {/* Preset Colors */}
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {PRESET_COLORS.map((col, idx) => (
                          <button
                            key={`upm-color-${col}-${idx}`}
                            type="button"
                            onClick={() => setSelectedColor(col)}
                            className="w-6 h-6 rounded-full border border-black/20 flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                            style={{ backgroundColor: col }}
                          >
                            {selectedColor.toLowerCase() === col.toLowerCase() && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                            )}
                          </button>
                        ))}
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
                                id="user-profile-color-wheel"
                                data-testid="user-profile-color-wheel"
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
                                  <span className="text-[10px]">{customLetters.slice(0, 2).toUpperCase() || (displayName || user.displayName || user.email || 'U').charAt(0).toUpperCase()}</span>
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
                    </div>
                  )}

                  {avatarTab === 'image' && (
                    <div className="flex flex-col items-center gap-4">
                      <label className="cursor-pointer group flex flex-col items-center gap-2">
                        <div className="h-10 px-4 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-semibold text-sm group-hover:bg-indigo-100 transition-colors dark:bg-indigo-500/10 dark:text-indigo-400 dark:group-hover:bg-indigo-500/20">
                          Escolher imagem...
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <span className="text-[10px] text-neutral-500 text-center">
                          Formato JPG, PNG ou GIF. Máximo 5MB.
                        </span>
                      </label>

                      {imageUrl && (
                        <div className="w-full flex flex-col gap-2 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/40">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Ajustar Zoom</span>
                            <span className="text-[10px] font-mono font-bold text-indigo-500">{Math.round(avatarZoom * 100)}%</span>
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
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Account Security & Password Link */}
              {user && !isGuest && (
                <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                      Segurança e Vincular Senha
                    </h3>
                  </div>
                  <div className="bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Provedores de Acesso:</span>
                      <div className="flex items-center gap-1.5">
                        {hasGoogleProvider && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-medium text-[10px]">
                            ✓ Google
                          </span>
                        )}
                        {hasPasswordProvider ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-medium text-[10px]">
                            ✓ E-mail/Senha
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-medium text-[10px]">
                            Sem Senha
                          </span>
                        )}
                      </div>
                    </div>

                    {!hasPasswordProvider && (
                      <div className="space-y-2 pt-1">
                        <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
                          Você criou esta conta pelo Google. Cadastre uma senha abaixo para poder entrar tanto pelo Google quanto digitando e-mail e senha:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            placeholder="Digite uma nova senha (mín. 6 caract.)"
                            value={linkPasswordInput}
                            onChange={(e) => setLinkPasswordInput(e.target.value)}
                            className="flex-1 h-9 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <button
                            type="button"
                            disabled={isLinkingPassword || !linkPasswordInput.trim()}
                            onClick={handleLinkPasswordInModal}
                            className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs disabled:opacity-50 transition-all cursor-pointer shrink-0"
                          >
                            {isLinkingPassword ? 'Vinculando...' : 'Vincular'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider">
                    Zona de Perigo
                  </h3>
                </div>

                <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 rounded-xl p-4">
                  <p className="text-xs text-rose-700 dark:text-rose-400 mb-4 leading-relaxed">
                    Excluir todos os dados removerá permanentemente suas plataformas, compras, categorias personalizadas e configurações. Esta ação não pode ser desfeita.
                  </p>

                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir todos os meus dados
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase">
                        Tem certeza absoluta?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isDeletingAll}
                          onClick={handleDeleteAllData}
                          className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isDeletingAll ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Sim, excluir tudo'
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isDeletingAll}
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 h-9 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-bold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-neutral-50 dark:bg-[#0d0d0d] border-t border-neutral-200 dark:border-white/[0.08] flex flex-col gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                id="save-profile-btn"
                data-testid="save-profile-btn"
                aria-label="Salvar Perfil"
                className={`w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  showSuccess
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 active:scale-[0.98]'
                } shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {showSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    Salvo com sucesso!
                  </>
                ) : isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Perfil
                  </>
                )}
              </button>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleExportData}
                  className="flex-1 h-11 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-neutral-300 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  Exportar
                </button>
                <label className="flex-1 h-11 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-neutral-300 cursor-pointer">
                  <Download className="w-5 h-5 rotate-180" />
                  Importar
                  <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                </label>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem('hub_onboarding_seen');
                  onStartTutorial?.();
                  onClose();
                }}
                className="w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 animate-pulse" />
                Refazer Tutorial do App
              </button>

              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-400 cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                Sair da Conta
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
