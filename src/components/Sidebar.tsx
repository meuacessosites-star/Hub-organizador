/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Category, Platform } from '../types';
import { LayoutGrid, Settings2, X, Search, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { CategoryIcon } from './CategoryIcon';

interface SidebarProps {
  categories: Category[];
  platforms: Platform[];
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;
  onManageCategories: () => void;
  onManageStatuses: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onBackToLogin: () => void;
  onShowTutorial?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  platforms,
  selectedCategory,
  setSelectedCategory,
  onManageCategories,
  onManageStatuses,
  isOpenMobile = false,
  onCloseMobile,
  onBackToLogin,
  onShowTutorial,
}) => {
  const [categorySearch, setCategorySearch] = useState('');
  const { user, userProfile, isGuest } = useAuth();

  const getSidebarAvatarContent = () => {
    if (!user) return null;

    if (userProfile?.avatar) {
      const { type, value, bgColor } = userProfile.avatar;
      if (type === 'image' && value) {
        return <img referrerPolicy="no-referrer" src={value} alt="User Avatar" className="w-full h-full object-cover rounded-full" />;
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
            {value || (userProfile.displayName || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
          </div>
        );
      }
      if (type === 'google' && user.photoURL) {
        return <img referrerPolicy="no-referrer" src={user.photoURL} alt="Google Avatar" className="w-full h-full object-cover rounded-full" />;
      }
    }

    if (user.photoURL) {
      return <img referrerPolicy="no-referrer" src={user.photoURL} alt="Google Avatar" className="w-full h-full object-cover rounded-full" />;
    }

    return (
      <div className="w-full h-full rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
        {(userProfile?.displayName || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
      </div>
    );
  };

  // Calculate dynamic counts
  const getCategoryCount = (catId: string) => {
    if (catId === 'todas') {
      return platforms.length;
    }
    return platforms.filter((p) => p.categoryId === catId).length;
  };

  const totalPlatforms = platforms.length;
  const totalProfiles = platforms.reduce((acc, p) => acc + p.profiles.length, 0);

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden cursor-pointer transition-opacity duration-300"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:z-auto lg:sticky lg:top-0 w-64 border-r flex flex-col justify-between h-screen transition-transform duration-300 select-none bg-slate-50 border-neutral-200/60 text-neutral-650 dark:bg-[#000000] dark:border-neutral-900/80 dark:text-neutral-350 shadow-xl lg:shadow-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Part */}
        <div className="flex flex-col py-6">
          {/* Brand Logo & Mobile Close button */}
          <div className="flex items-center justify-between px-6 mb-8">
            <div className="flex items-center gap-3">
              <button onClick={onBackToLogin} className="cursor-pointer">
                <Logo className="w-8 h-8" />
              </button>
              <span className="font-sans font-bold text-lg tracking-tight text-neutral-900 dark:text-white">
                Hub Organizador
              </span>
            </div>

            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Categories List */}
          <div id="sidebar-search-category" className="px-3 mb-2">
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 transition-colors group-focus-within:text-indigo-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Filtrar categorias..."
                className="w-full h-8 pl-9 pr-3 rounded-md bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-200 dark:placeholder:text-neutral-600"
              />
              {categorySearch && (
                <button
                  onClick={() => setCategorySearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <nav className="flex flex-col px-3 gap-1 max-h-[55vh] overflow-y-auto custom-scrollbar">
            {/* Default "Todas" */}
            {categorySearch === '' && (
              <button
                id="category-btn-all"
                data-testid="category-btn-all"
                aria-label="Filtrar por todas as categorias"
                onClick={() => {
                  setSelectedCategory('todas');
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === 'todas'
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-600/10 dark:text-indigo-400'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-4 h-4" />
                  <span data-testid="category-name-all">Todas</span>
                </div>
                <span
                  data-testid="category-count-all"
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${
                    selectedCategory === 'todas'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-300'
                      : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {getCategoryCount('todas')}
                </span>
              </button>
            )}

            {/* Map other categories */}
            {categories
              .filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
              .map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const slugName = cat.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
              return (
                <button
                  key={cat.id}
                  id={`sidebar-category-btn-${cat.id}`}
                  data-testid={`sidebar-category-btn-${slugName}`}
                  aria-label={`Filtrar por ${cat.name}, ${getCategoryCount(cat.id)} itens`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-600/10 dark:text-indigo-400'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CategoryIcon icon={cat.icon} className="w-4 h-4" />
                    <span data-testid={`sidebar-category-name-${cat.id}`} className="truncate">{cat.name}</span>
                  </div>
                  <span
                    data-testid={`sidebar-category-count-${cat.id}`}
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${
                      isSelected
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-300'
                        : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}
                  >
                    {getCategoryCount(cat.id)}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Part */}
        <div className="flex flex-col border-t border-neutral-200 dark:border-[#1e202c] p-4 gap-3">
          <button
            id="sidebar-manage-status-btn"
            onClick={() => {
              onManageStatuses();
              if (onCloseMobile) onCloseMobile();
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/30 transition-all duration-200 cursor-pointer"
          >
            <Settings2 className="w-4 h-4" />
            <span>Gerenciar status</span>
          </button>

          <button
            id="sidebar-manage-categories-btn"
            onClick={() => {
              onManageCategories();
              if (onCloseMobile) onCloseMobile();
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/30 transition-all duration-200 cursor-pointer"
          >
            <Settings2 className="w-4 h-4" />
            <span>Gerenciar categorias</span>
          </button>

          {/* User Profile Info Card */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-100/50 dark:bg-neutral-900/40 border border-neutral-200/40 dark:border-neutral-800/40 mt-1 select-none">
            {user ? (
              <>
                <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden relative">
                  {getSidebarAvatarContent()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate flex items-center gap-1.5">
                    <span className="truncate">{userProfile?.displayName || user.displayName || 'Usuário Logado'}</span>
                    {isGuest && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" title="Visitante" />
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate text-left">
                    {isGuest ? 'Sem backup ativo' : user.email}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-[10px] shrink-0">
                  CV
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate flex items-center gap-1">
                    <span>Convidado</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  </div>
                  <div className="text-[9px] text-amber-600 dark:text-amber-500 font-semibold truncate uppercase tracking-wide text-left">
                    Sem backup ativo
                  </div>
                </div>
              </>
            )}
          </div>

          <div id="sidebar-stats-container" className="px-3 py-1 font-mono text-[11px] leading-relaxed text-neutral-500 border-t border-neutral-200 dark:border-[#1e202c] pt-3">
            <div className="font-semibold">{totalPlatforms} plataformas</div>
            <div className="text-[10px]">
              {totalProfiles} {totalProfiles === 1 ? 'conta cadastrada' : 'contas cadastradas'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
