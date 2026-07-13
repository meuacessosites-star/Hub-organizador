import { resizeImage } from "../utils/imageHelper";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut, Camera, Type, Image as ImageIcon, Smile, Save, Check, Loader2 } from 'lucide-react';
import { User, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, UserProfileData } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSignOut: () => void;
}

const PRESET_EMOJIS = [
  '👤', '💼', '🏠', '🎓', '🛠️', '🏢', '💰', '🎬', '🛍️', '📁',
  '💻', '📱', '🎮', '❤️', '🌟', '🚀', '🔒', '🔑', '🎨', '✈️'
];

const PRESET_COLORS = [
  '#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#f43f5e', '#84cc16', '#a855f7'
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignOut,
}) => {
  const { userProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarTab, setAvatarTab] = useState<'google' | 'color' | 'emoji' | 'image'>('google');
  const [selectedColor, setSelectedColor] = useState('#7c5cfc');
  const [selectedEmoji, setSelectedEmoji] = useState('👤');
  const [imageUrl, setImageUrl] = useState('');
  const [customLetters, setCustomLetters] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(userProfile?.displayName || user.displayName || '');
      if (userProfile?.avatar) {
        setAvatarTab(userProfile.avatar.type);
        if (userProfile.avatar.type === 'color') {
          setSelectedColor(userProfile.avatar.bgColor || '#7c5cfc');
          setCustomLetters(userProfile.avatar.value || '');
        }
        if (userProfile.avatar.type === 'emoji') {
          setSelectedEmoji(userProfile.avatar.value);
          setSelectedColor(userProfile.avatar.bgColor || '#7c5cfc');
        }
        if (userProfile.avatar.type === 'image') setImageUrl(userProfile.avatar.value);
      } else {
        setAvatarTab(user.photoURL ? 'google' : 'color');
        setCustomLetters('');
      }
      setShowSuccess(false);
    }
  }, [isOpen, user, userProfile]);

  if (!user) return null;

  const { addToast } = useToast();

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
      const newProfile: UserProfileData = {
        displayName,
        avatar: {
          type: avatarTab,
          value: avatarTab === 'emoji' ? selectedEmoji : avatarTab === 'image' ? imageUrl : avatarTab === 'color' ? customLetters : '',
          bgColor: (avatarTab === 'color' || avatarTab === 'emoji') ? selectedColor : undefined
        }
      };

      if (user.uid !== 'guest') {
        if (displayName !== user.displayName) {
          await firebaseUpdateProfile(user, { displayName });
        }
        await setDoc(doc(db, 'users', user.uid), newProfile, { merge: true });
      } else {
        localStorage.setItem('hub_guest_profile', JSON.stringify(newProfile));
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        if (user.uid === 'guest') {
          window.location.reload();
        }
      }, 1500);
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderAvatarPreview = () => {
    if (avatarTab === 'image' && imageUrl) {
      return <img referrerPolicy="no-referrer" src={imageUrl} alt="preview" className="w-full h-full object-cover rounded-full" />;
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
          {customLetters || (displayName || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
        </div>
      );
    }
    if (avatarTab === 'google' && user.photoURL) {
      return <img referrerPolicy="no-referrer" src={user.photoURL} alt="google preview" className="w-full h-full object-cover rounded-full"/>;
    }
    
    // Fallback
    return (
      <div className="w-full h-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-4xl font-bold shadow-inner rounded-full">
        {(displayName || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
      </div>
    );
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-[#0a0a0c] rounded-2xl shadow-2xl z-[101] border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center shrink-0">
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
                  {user.photoURL && (
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
                            {PRESET_EMOJIS.map(emoji => (
                              <button
                                key={emoji}
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

                      <div className="flex flex-wrap gap-2 justify-center items-center">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer hover:scale-110 ${
                              selectedColor === color ? 'border-neutral-900 dark:border-white scale-110 shadow-md' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        
                        {/* Roda das cores (Color Wheel Picker Button) */}
                        <div 
                          className={`relative w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer hover:scale-110 shadow-sm shrink-0 bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] ${
                            !PRESET_COLORS.includes(selectedColor) ? 'border-neutral-900 dark:border-white scale-110 shadow-md' : 'border-neutral-300 dark:border-neutral-700/60'
                          }`}
                          title="Roda das cores"
                        >
                          <input
                            type="color"
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                          />
                          {!PRESET_COLORS.includes(selectedColor) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                              <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {avatarTab === 'image' && (
                    <div className="flex flex-col items-center gap-3">
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
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-neutral-50 dark:bg-[#111219]/90 border-t border-neutral-200 dark:border-[#26283b]/70 flex flex-col gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
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
