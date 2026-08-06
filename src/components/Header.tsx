/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Search, Sun, Moon, Plus, Menu, ChevronUp, ChevronDown, X, LogIn, LogOut, Loader2, User as UserIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SmartImage } from './SmartImage';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNewPlatform: () => void;
  onMenuClick?: () => void;
  searchMatchesCount?: number;
  activeMatchIndex?: number;
  onPrevMatch?: () => void;
  onNextMatch?: () => void;
  onAuthAction?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onNewPlatform,
  onMenuClick,
  searchMatchesCount = 0,
  activeMatchIndex = 0,
  onPrevMatch,
  onNextMatch,
  onAuthAction,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, userProfile, loading } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const getAvatarContent = () => {
    if (!user) return null;

    const userInitial = (userProfile?.displayName || user.displayName || user.email || 'U').charAt(0).toUpperCase();
    const defaultFallback = (
      <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white shadow-inner">
        {userInitial}
      </div>
    );

    const availablePhoto = user.photoURL || userProfile?.photoURL || (userProfile?.avatar?.type === 'google' ? userProfile.avatar.value : null) || (userProfile?.avatar?.type === 'image' ? userProfile.avatar.value : null);
    
    if (userProfile?.avatar) {
      const { type, value, bgColor } = userProfile.avatar;
      if (type === 'image' && value) {
        return (
          <SmartImage 
            src={value} 
            alt="User Avatar" 
            className="w-full h-full object-cover rounded-full" 
            containerClassName="w-full h-full rounded-full overflow-hidden"
            fallbackIcon={defaultFallback}
            style={{ transform: `scale(${userProfile.avatar.zoom || 1})` }} 
          />
        );
      }
      if (type === 'emoji') {
        return (
          <div className="w-full h-full rounded-full flex items-center justify-center text-sm shadow-sm" style={{ backgroundColor: bgColor || '#7c5cfc' }}>
            {value}
          </div>
        );
      }
      if (type === 'color') {
        return (
          <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm" style={{ backgroundColor: bgColor || '#7c5cfc' }}>
            {value || userInitial}
          </div>
        );
      }
      if (type === 'google' && availablePhoto) {
        return (
          <SmartImage 
            src={availablePhoto} 
            alt="Google Avatar" 
            className="w-full h-full object-cover rounded-full"
            containerClassName="w-full h-full rounded-full overflow-hidden"
            fallbackIcon={defaultFallback}
          />
        );
      }
    }
    
    // Fallback to Google / profile photo if available
    if (availablePhoto) {
      return (
        <SmartImage 
          src={availablePhoto} 
          alt="User Avatar" 
          className="w-full h-full object-cover rounded-full"
          containerClassName="w-full h-full rounded-full overflow-hidden"
          fallbackIcon={defaultFallback}
        />
      );
    }

    // Default fallback
    return defaultFallback;
  };

  const isSearchActive = isFocused || searchQuery.trim().length > 0;

  // Command/Ctrl + K focus shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-16 border-b flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white border-neutral-200 dark:bg-[#0d0d0d] dark:border-white/5 sticky top-0 z-10 select-none shadow-sm dark:shadow-[0_2px_15px_rgba(0,0,0,0.6)]">
      {/* Left Area: Menu Button + Search */}
      <div className="flex items-center gap-3 flex-1 mr-4 transition-all duration-300">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className={`lg:hidden p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-700 dark:border-neutral-800 dark:bg-[#141414] dark:hover:bg-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition-all duration-300 cursor-pointer shrink-0 ${
              isSearchActive ? 'max-sm:hidden max-sm:opacity-0 max-sm:scale-95' : 'flex'
            }`}
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Search Input Container */}
        <div id="search-input-container" className={`relative w-full transition-all duration-300 ease-in-out ${
          isSearchActive ? 'max-sm:max-w-full max-sm:flex-1' : 'max-sm:max-w-[140px]'
        } min-w-[100px] sm:max-w-xs md:max-w-md lg:w-96`}>
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-300">
            <Search className="w-4 h-4" />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
                searchInputRef.current?.blur();
              }
            }}
            placeholder="Buscar conta..."
            className={`w-full h-10 pl-10 rounded-lg text-xs sm:text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 dark:bg-[#141414] dark:border-white/[0.06] dark:text-neutral-100 dark:placeholder-neutral-500 ${
              searchQuery.trim() ? 'pr-[110px] sm:pr-[130px]' : 'pr-10 sm:pr-12'
            }`}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery.trim() ? (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 px-1.5 py-0.5 rounded-md shadow-sm animate-in fade-in zoom-in-95 duration-150">
                {searchMatchesCount > 0 && (
                  <>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-neutral-500 dark:text-neutral-300 select-none">
                      {activeMatchIndex + 1}/{searchMatchesCount}
                    </span>
                    <div className="h-3 w-[1px] bg-neutral-200 dark:bg-neutral-700" />
                    <button
                      type="button"
                      onClick={onPrevMatch}
                      className="p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 cursor-pointer transition-colors"
                      title="Anterior"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={onNextMatch}
                      className="p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 cursor-pointer transition-colors"
                      title="Próximo"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-3 w-[1px] bg-neutral-200 dark:bg-neutral-700" />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer transition-colors"
                  title="Limpar pesquisa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center">
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 border border-neutral-200 text-neutral-500 font-mono shadow-sm dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400">
                  ⌘K
                </kbd>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className={`flex items-center gap-2 sm:gap-4 shrink-0 transition-all duration-300 ${
        isSearchActive ? 'max-sm:hidden max-sm:opacity-0 max-sm:scale-95' : 'flex'
      }`}>
        {/* Auth Toggle */}
        {user ? (
          <button
            id="user-profile-btn"
            onClick={onAuthAction}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="Abrir perfil"
            title="Meu Perfil"
          >
            <div className="w-8 h-8 shrink-0">
              {getAvatarContent()}
            </div>
          </button>
        ) : (
          <button
            onClick={onAuthAction}
            disabled={loading}
            className="p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 transition-all duration-300 dark:border-neutral-800 dark:bg-[#141414] dark:hover:bg-neutral-900 dark:text-neutral-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fazer login"
            title="Fazer login"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5 text-indigo-500" />
            )}
          </button>
        )}

        {/* Theme Toggle */}
          <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 transition-all duration-300 dark:border-neutral-800 dark:bg-[#141414] dark:hover:bg-neutral-900 dark:text-neutral-400 cursor-pointer"
          aria-label="Alternar tema"
          title={theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* New Account Button */}
        <button
          id="add-platform-btn"
          data-testid="add-platform-btn"
          onClick={onNewPlatform}
          className="h-10 px-3 sm:px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_4px_12px_rgba(79,70,229,0.3)] active:scale-95 transition-all duration-200 cursor-pointer border border-indigo-400/20"
          title="Cadastrar Nova Conta"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">Nova Conta</span>
        </button>
      </div>
    </header>
  );
};
