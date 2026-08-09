/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStorage } from './hooks/useStorage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PlatformCard } from './components/PlatformCard';
import { NewPlatformModal } from './components/NewPlatformModal';
import { ProfileModal } from './components/ProfileModal';
import { RegisterPurchaseModal } from './components/RegisterPurchaseModal';
import { ManageCategoriesModal } from './components/ManageCategoriesModal';
import { ManageStatusesModal } from './components/ManageStatusesModal';
import { getLogoUrl } from './utils/logoHelper';
import { Profile, Purchase } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Inbox, LayoutGrid, ShoppingBag, ChevronRight, Sparkles, User } from 'lucide-react';
import { useToast } from './context/ToastContext';
import { PurchasesView } from './components/PurchasesView';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { UserProfileModal } from './components/UserProfileModal';
import { ScrollButtons } from './components/ScrollButtons';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { ProfilesView } from './components/ProfilesView';

import { useTheme } from './context/ThemeContext';
import { safeStorage } from './utils/storage';

export default function App() {
  const { addToast } = useToast();
  const { user, loading: authLoading, signOut } = useAuth();
  const { theme } = useTheme();
  
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  const {
    tags,
    addTag,
    updateTag,
    deleteTag,
    categories,
    platforms,
    statuses,
    addStatus,
    updateStatus,
    deleteStatus,
    addCategory,
    updateCategory,
    deleteCategory,
    addPlatform,
    deletePlatform,
    addProfile,
    updateProfile,
    deleteProfile,
    addPurchase,
    updatePurchase,
    deletePurchase,
    isDemoActive,
    setDemoActive,
    profilePresets,
    addProfilePreset,
    updateProfilePreset,
    deleteProfilePreset,
    reorderProfilePresets,
  } = useStorage();

  const [isTutorialActive, setIsTutorialActive] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'platforms' | 'purchases'>('platforms');

  useEffect(() => {
    setDemoActive(isTutorialActive);
  }, [isTutorialActive, setDemoActive]);
  const handleClearHighlight = useCallback(() => {
    setHighlightedPurchaseId(null);
  }, []);

  const handleCloseTutorial = useCallback(() => {
    setIsTutorialActive(false);
  }, []);

  const handleShowTutorial = useCallback(() => {
    setIsTutorialActive(true);
  }, []);

  const handleOpenNewPlatform = useCallback(() => {
    setIsNewPlatformOpen(true);
  }, []);

  const handleOpenManageCategories = useCallback(() => {
    setIsManageCategoriesOpen(true);
  }, []);

  const handleOpenManageStatuses = useCallback(() => {
    setIsManageStatusesOpen(true);
  }, []);

  const handleOpenManageProfiles = useCallback(() => {
    setProfileModal({
      isOpen: true,
      platformId: null,
      profile: null,
      openPresetsManager: true,
    });
  }, []);

  const handleOpenSidebarMobile = useCallback(() => {
    setIsSidebarOpenMobile(true);
  }, []);

  const handleCloseSidebarMobile = useCallback(() => {
    setIsSidebarOpenMobile(false);
  }, []);

  const handleAuthAction = useCallback(() => {
    if (user) {
      setIsUserProfileOpen(true);
    }
  }, [user]);

  const handleSignOut = useCallback(() => {
    if (user) {
      signOut();
    }
  }, [user, signOut]);

  // Bulk platform select states
  const [showPlatformBulkSelect, setShowPlatformBulkSelect] = useState(false);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(new Set());
  const [showPlatformBulkDeleteConfirm, setShowPlatformBulkDeleteConfirm] = useState(false);

  const handleToggleSelectPlatform = useCallback((platformId: string) => {
    setSelectedPlatformIds((prev) => {
      const next = new Set(prev);
      if (next.has(platformId)) {
        next.delete(platformId);
      } else {
        next.add(platformId);
      }
      return next;
    });
  }, []);

  const handleBulkDeletePlatforms = useCallback(() => {
    if (selectedPlatformIds.size === 0) return;

    selectedPlatformIds.forEach((id) => {
      deletePlatform(id);
    });
    
    addToast(`${selectedPlatformIds.size} plataforma(s) excluída(s) com sucesso! 🗑️`, 'info');
    setSelectedPlatformIds(new Set());
    setShowPlatformBulkSelect(false);
    setShowPlatformBulkDeleteConfirm(false);
  }, [selectedPlatformIds, deletePlatform, addToast]);

  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [highlightedPurchaseId, setHighlightedPurchaseId] = useState<string | null>(null);

  // Dynamic theme-color meta tag for mobile status bar
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const color = theme === 'dark' ? '#000000' : '#ffffff';
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', color);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = color;
      document.head.appendChild(meta);
    }
  }, [theme]);

  // Modals state management
  const [isNewPlatformOpen, setIsNewPlatformOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isManageStatusesOpen, setIsManageStatusesOpen] = useState(false);

  // Profile modal state (Handles both add and view/edit)
  const [profileModal, setProfileModal] = useState<{
    isOpen: boolean;
    platformId: string | null;
    profile: Profile | null;
    startInEditMode?: boolean;
    openPresetsManager?: boolean;
  }>({
    isOpen: false,
    platformId: null,
    profile: null,
    startInEditMode: false,
    openPresetsManager: false,
  });

  // Purchase modal state (Handles both add and view/edit)
  const [purchaseModal, setPurchaseModal] = useState<{
    isOpen: boolean;
    platformId: string | null;
    purchase: Purchase | null;
  }>({
    isOpen: false,
    platformId: null,
    purchase: null,
  });

  // Category mapping
  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);
  const categoryTitle = currentCategoryObj ? currentCategoryObj.name : 'Todas';

  // Filter platforms by ownership (STRICT SECURITY)
  const userPlatforms = useMemo(() => {
    return platforms.filter((plat) => {
      if (!user) return false;
      const isGuestUser = user.uid.startsWith('guest_') || user.isAnonymous;
      if (isGuestUser) return true; // Show all local platforms in guest mode
      return !plat.ownerId || plat.ownerId === user.uid;
    });
  }, [platforms, user]);

  // Find dynamic counts
  const filteredPlatforms = useMemo(() => {
    return userPlatforms.filter((plat) => {
      // 1. Category Filter
      if (selectedCategory !== 'todas' && plat.categoryId !== selectedCategory) {
        return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const platNameMatch = plat.name.toLowerCase().includes(q);
        const categoryMatch = categories
          .find((c) => c.id === plat.categoryId)
          ?.name.toLowerCase()
          .includes(q);
        const profileMatch = plat.profiles.some(
          (prof) =>
            prof.name.toLowerCase().includes(q) ||
            (prof.username?.toLowerCase().includes(q) ?? false) ||
            prof.description?.toLowerCase().includes(q) ||
            prof.accessLink?.toLowerCase().includes(q)
        );
        const purchaseMatch = plat.purchases.some((pur) =>
          pur.productName.toLowerCase().includes(q)
        );

        return platNameMatch || categoryMatch || profileMatch || purchaseMatch;
      }

      return true;
    });
  }, [userPlatforms, selectedCategory, searchQuery, categories]);

  // Calculate search matches on filtered platforms
  const searchMatches = useMemo(() => {
    const matches: Array<{ platformId: string; profileId: string }> = [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filteredPlatforms.forEach((plat) => {
        const platNameMatch = plat.name.toLowerCase().includes(q);
        plat.profiles.forEach((prof) => {
          const profNameMatch = prof.name.toLowerCase().includes(q);
          const usernameMatch = prof.username?.toLowerCase().includes(q) || false;
          const descMatch = prof.description?.toLowerCase().includes(q) || false;
          const linkMatch = prof.accessLink?.toLowerCase().includes(q) || false;

          if (platNameMatch || profNameMatch || usernameMatch || descMatch || linkMatch) {
            matches.push({ platformId: plat.id, profileId: prof.id });
          }
        });
      });
    }
    return matches;
  }, [filteredPlatforms, searchQuery]);

  // Reset active match index when search query changes
  useEffect(() => {
    setActiveMatchIndex(0);
  }, [searchQuery]);

  const activeMatch = searchMatches[activeMatchIndex] || null;

  // Scroll active match into view
  useEffect(() => {
    if (activeMatch) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`profile-card-${activeMatch.profileId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeMatch?.profileId]);

  // Counts of profiles in current subset
  const subsetAccountsCount = filteredPlatforms.reduce((acc, p) => acc + p.profiles.length, 0);

  // Sub-header string helper (e.g. "Todas > 4 contas")
  const subHeaderString = `${categoryTitle} › ${subsetAccountsCount} ${
    subsetAccountsCount === 1 ? 'conta' : 'contas'
  }`;

  // Platform creation trigger
  const handleCreatePlatform = (data: {
    name: string;
    url: string;
    logoUrl?: string;
    categoryId: string;
    firstProfile: Omit<Profile, 'id'>;
  }) => {
    const logo = data.logoUrl || getLogoUrl(data.name, data.url);
    const newPlat = addPlatform({
      name: data.name,
      url: data.url,
      logoUrl: logo,
      categoryId: data.categoryId,
    });

    addProfile(newPlat.id, data.firstProfile);
    setIsNewPlatformOpen(false);
    
    // Automatically complete/hide the onboarding tutorial once they successfully create a platform
    setIsTutorialActive(false);
    safeStorage.setItem('hub_onboarding_seen', 'true');
    
    addToast(`Plataforma "${data.name}" criada com sucesso! 🚀`, 'success');
  };

  const handleOpenAddProfile = (platformId: string) => {
    setProfileModal({
      isOpen: true,
      platformId,
      profile: null,
    });
  };

  const handleOpenEditProfile = (platformId: string, profile: Profile, startInEditMode: boolean = false) => {
    setProfileModal({
      isOpen: true,
      platformId,
      profile,
      startInEditMode,
    });
  };

  const handleDeleteProfileDirect = (platformId: string, profileId: string) => {
    const plat = platforms.find((p) => p.id === platformId);
    const prof = plat?.profiles.find((pr) => pr.id === profileId);
    deleteProfile(platformId, profileId);
    if (prof) {
      addToast(`Conta "${prof.name}" excluída com sucesso! 🗑️`, 'info');
    }
  };

  const handleSaveProfile = (profileData: Omit<Profile, 'id'>) => {
    if (profileModal.platformId) {
      addProfile(profileModal.platformId, profileData);
    }
  };

  const handleEditProfile = (profileId: string, profileData: Partial<Profile>) => {
    if (profileModal.platformId) {
      updateProfile(profileModal.platformId, profileId, profileData);
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    if (profileModal.platformId) {
      deleteProfile(profileModal.platformId, profileId);
    }
  };

  // Purchase registration triggers
  const handleOpenAddPurchase = (platformId: string) => {
    setPurchaseModal({
      isOpen: true,
      platformId,
      purchase: null,
    });
  };

  const handleOpenViewPurchase = (platformId: string, purchase: Purchase) => {
    setPurchaseModal({
      isOpen: true,
      platformId,
      purchase,
    });
  };

  const handleSavePurchase = (purchaseData: Purchase | Omit<Purchase, 'id'>) => {
    if (purchaseModal.platformId) {
      try {
        if ('id' in purchaseData && purchaseData.id) {
          updatePurchase(purchaseModal.platformId, purchaseData.id, purchaseData);
        } else {
          addPurchase(purchaseModal.platformId, purchaseData as Omit<Purchase, 'id'>);
        }
      } catch (err: any) {
        addToast(err.message || 'Erro ao salvar compra', 'error');
      }
    }
  };

  const handleUpdatePurchaseDirect = (platformId: string, purchase: Purchase) => {
    updatePurchase(platformId, purchase.id, purchase);
  };

  const handleGoToPurchase = (purchase: Purchase) => {
    setHighlightedPurchaseId(purchase.id);
    setCurrentView('purchases');
    // The actual scrolling will be handled inside PurchasesView when it mounts/updates
  };

  const handleEditPurchase = (purchaseId: string, purchaseData: Partial<Purchase>) => {
    if (purchaseModal.platformId) {
      updatePurchase(purchaseModal.platformId, purchaseId, purchaseData);
    }
  };

  const handleDeletePurchase = (purchaseId: string) => {
    if (purchaseModal.platformId) {
      deletePurchase(purchaseModal.platformId, purchaseId);
    }
  };

  const handleDeletePlatformAndAssets = (platformId: string) => {
    const plat = platforms.find((p) => p.id === platformId);
    if (plat) {
      deletePlatform(platformId);
      addToast(`Plataforma "${plat.name}" excluída com sucesso! 🗑️`, 'info');
    }
  };

  const currentPlatformForProfile = userPlatforms.find((p) => p.id === profileModal.platformId) || null;
  const currentPlatformForPurchase = userPlatforms.find((p) => p.id === purchaseModal.platformId) || null;

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50 dark:bg-black text-neutral-800 dark:text-neutral-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage />
    );
  }

  return (
    <div className="flex min-h-screen font-sans bg-neutral-50 dark:bg-[#0f0f0f] text-neutral-800 dark:text-neutral-200 transition-colors duration-200">
        
        {/* Sidebar Component */}
        <Sidebar
          categories={categories}
          platforms={userPlatforms}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onManageCategories={handleOpenManageCategories}
          onManageStatuses={handleOpenManageStatuses}
          onManageProfiles={handleOpenManageProfiles}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={handleCloseSidebarMobile}
          onBackToLogin={handleSignOut}
          onShowTutorial={handleShowTutorial}
          onUserProfile={() => setIsUserProfileOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full overflow-x-hidden">
          {/* Header Bar */}
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onNewPlatform={handleOpenNewPlatform}
            onMenuClick={handleOpenSidebarMobile}
            searchMatchesCount={searchMatches.length}
            activeMatchIndex={activeMatchIndex}
            onPrevMatch={() => {
              if (searchMatches.length > 0) {
                setActiveMatchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
              }
            }}
            onNextMatch={() => {
              if (searchMatches.length > 0) {
                setActiveMatchIndex((prev) => (prev + 1) % searchMatches.length);
              }
            }}
            onAuthAction={handleAuthAction}
          />

          {/* Core Body Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-12">
            
            {/* View Selector Tabs */}
            <div role="tablist" className="flex bg-neutral-200/50 dark:bg-white/[0.02] p-1.5 rounded-2xl self-start select-none border border-neutral-200 dark:border-white/5 shadow-sm">
              <button
                id="view-selector-platforms"
                data-testid="view-selector-platforms"
                role="tab"
                aria-selected={currentView === 'platforms'}
                aria-label="Ver Plataformas"
                onClick={() => setCurrentView('platforms')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                  currentView === 'platforms'
                    ? 'bg-white dark:bg-[#141414] text-indigo-600 dark:text-indigo-400 shadow-md dark:shadow-[0_0_20px_rgba(79,70,229,0.15)] border border-neutral-200 dark:border-white/10'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Plataformas</span>
              </button>
              <button
                id="view-selector-purchases"
                data-testid="view-selector-purchases"
                role="tab"
                aria-selected={currentView === 'purchases'}
                aria-label="Ver Painel de Compras"
                onClick={() => setCurrentView('purchases')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                  currentView === 'purchases'
                    ? 'bg-white dark:bg-[#141414] text-indigo-600 dark:text-indigo-400 shadow-md dark:shadow-[0_0_20px_rgba(79,70,229,0.15)] border border-neutral-200 dark:border-white/10'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Compras</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {currentView === 'platforms' ? (
                <motion.div
                  key="platforms-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex flex-col gap-6"
                >
                  {/* Subheader summary path */}
                  <div className="flex items-center justify-between select-none">
                    <h2 className="text-xs font-bold font-sans tracking-wide text-neutral-500 dark:text-neutral-200 uppercase flex items-center gap-1.5">
                      <span>{subHeaderString}</span>
                    </h2>

                    {filteredPlatforms.length > 0 && (
                      <div className="flex items-center gap-2">
                        {showPlatformBulkSelect ? (
                          <div className="flex items-center gap-2">
                            {showPlatformBulkDeleteConfirm ? (
                              <div className="flex items-center gap-2 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl text-xs">
                                <span className="font-bold text-rose-600 dark:text-rose-400 mr-1 text-[11px]">Excluir {selectedPlatformIds.size} plataformas?</span>
                                <button
                                  type="button"
                                  onClick={handleBulkDeletePlatforms}
                                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Sim
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowPlatformBulkDeleteConfirm(false)}
                                  className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-[10px] uppercase tracking-wider hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <>
                                {selectedPlatformIds.size === filteredPlatforms.length ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPlatformIds(new Set())}
                                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 active:scale-95 text-neutral-700 dark:text-neutral-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm border border-neutral-200 dark:border-neutral-700"
                                  >
                                    Manualmente
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPlatformIds(new Set(filteredPlatforms.map(p => p.id)))}
                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 active:scale-95 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm border border-indigo-100 dark:border-indigo-500/15"
                                  >
                                    Selecionar tudo
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (selectedPlatformIds.size > 0) {
                                      setShowPlatformBulkDeleteConfirm(true);
                                    } else {
                                      addToast('Nenhuma plataforma selecionada', 'warning');
                                    }
                                  }}
                                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                                >
                                  Excluir Selecionados ({selectedPlatformIds.size})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowPlatformBulkSelect(false);
                                    setSelectedPlatformIds(new Set());
                                    setShowPlatformBulkDeleteConfirm(false);
                                  }}
                                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 active:scale-95 text-neutral-700 dark:text-neutral-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm border border-neutral-200 dark:border-neutral-700"
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowPlatformBulkSelect(true)}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 active:scale-95 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-sm border border-indigo-100 dark:border-indigo-500/15"
                          >
                            Selecionar vários
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Platform Grid Layout */}
                  <AnimatePresence mode="popLayout">
                    {filteredPlatforms.length === 0 ? (
                      <motion.div
                        key="empty-state"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex-1 flex flex-col items-center justify-center py-20 bg-white dark:bg-[#08080a] rounded-2xl border border-dashed border-neutral-200 dark:border-white/5"
                      >
                        <Inbox className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
                        <h3 className="font-sans font-semibold text-neutral-800 dark:text-neutral-300 text-sm">
                          Nenhuma plataforma encontrada
                        </h3>
                        <p className="text-neutral-500 dark:text-neutral-300 text-xs mt-1 text-center max-w-xs">
                          {searchQuery
                            ? 'Nenhuma plataforma ou conta atende aos seus critérios de busca.'
                            : 'Comece clicando em "+ Nova Conta" no cabeçalho.'}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="platforms-grid"
                        layout="position"
                        className="grid grid-cols-1 xl:grid-cols-2 gap-10"
                      >
                        {filteredPlatforms.map((plat, pIdx) => {
                          const cat = categories.find((c) => c.id === plat.categoryId);
                          return (
                            <PlatformCard
                              key={`plat-grid-${plat.id}-${pIdx}`}
                              platform={plat}
                              categoryName={cat ? cat.name : 'Outros'}
                              categoryIcon={cat ? cat.icon : '📁'}
                              tags={tags}
                              availableStatuses={statuses}
                              onAddProfile={handleOpenAddProfile}
                              onEditProfile={handleOpenEditProfile}
                              onDeletePlatform={handleDeletePlatformAndAssets}
                              onDeleteProfile={handleDeleteProfileDirect}
                              onAddPurchase={handleOpenAddPurchase}
                              onViewPurchase={handleOpenViewPurchase}
                              onEditPurchase={handleUpdatePurchaseDirect}
                              onGoToPurchaseInPanel={handleGoToPurchase}
                              searchQuery={searchQuery}
                              activeMatchProfileId={activeMatch?.profileId}
                              currentUserUid={user?.uid}
                              isSelectionMode={showPlatformBulkSelect}
                              isSelected={selectedPlatformIds.has(plat.id)}
                              onToggleSelect={() => handleToggleSelectPlatform(plat.id)}
                            />
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  key="purchases-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <PurchasesView
                    platforms={userPlatforms}
                    categories={categories}
                    statuses={statuses}
                    tags={tags}
                    onViewPurchase={handleOpenViewPurchase}
                    onEditPurchase={handleUpdatePurchaseDirect}
                    onAddPurchase={handleOpenAddPurchase}
                    highlightedPurchaseId={highlightedPurchaseId}
                    onClearHighlight={handleClearHighlight}
                    onDeletePurchase={deletePurchase}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* MODAL SYSTEM */}
        <AnimatePresence>
          {/* New Platform Step 1 & 2 Wizard */}
          {isNewPlatformOpen && (
            <NewPlatformModal
              isOpen={isNewPlatformOpen}
              onClose={() => setIsNewPlatformOpen(false)}
              categories={categories}
              onSubmit={handleCreatePlatform}
              onManageProfiles={() => {
                setIsNewPlatformOpen(false);
                handleOpenManageProfiles();
              }}
            />
          )}

          {/* Manage Categories Settings */}
          {isManageCategoriesOpen && (
            <ManageCategoriesModal
              isOpen={isManageCategoriesOpen}
              onClose={() => setIsManageCategoriesOpen(false)}
              categories={categories}
              onAddCategory={addCategory}
              onUpdateCategory={updateCategory}
              onDeleteCategory={deleteCategory}
            />
          )}

          {/* Manage Statuses Settings */}
          {isManageStatusesOpen && (
            <ManageStatusesModal
              isOpen={isManageStatusesOpen}
              onClose={() => setIsManageStatusesOpen(false)}
              statuses={statuses}
              onAddStatus={addStatus}
              onUpdateStatus={updateStatus}
              onDeleteStatus={deleteStatus}
            />
          )}

          {/* Profile Details Modal */}
          {profileModal.isOpen && (
            <ProfileModal
              isOpen={profileModal.isOpen}
              onClose={() => setProfileModal({ isOpen: false, platformId: null, profile: null, startInEditMode: false, openPresetsManager: false })}
              platform={currentPlatformForProfile}
              profile={profileModal.profile}
              onSave={handleSaveProfile}
              onEdit={handleEditProfile}
              onDelete={handleDeleteProfile}
              startInEditMode={profileModal.startInEditMode}
              openPresetsManager={profileModal.openPresetsManager}
              onManageProfiles={handleOpenManageProfiles}
            />
          )}

          {/* Purchase Details Modal */}
          {purchaseModal.isOpen && (
            <RegisterPurchaseModal
              isOpen={purchaseModal.isOpen}
              onClose={() => setPurchaseModal({ isOpen: false, platformId: null, purchase: null })}
              platform={currentPlatformForPurchase}
              purchase={purchaseModal.purchase}
              onSave={handleSavePurchase}
              onEdit={handleEditPurchase}
              onDelete={handleDeletePurchase}
              onAddProfile={handleOpenAddProfile}
              availableTags={tags}
              availableStatuses={statuses}
              onAddTag={addTag}
              onUpdateTag={updateTag}
              onDeleteTag={deleteTag}
            />
          )}
          {/* User Profile Modal */}
          <UserProfileModal
            isOpen={isUserProfileOpen}
            onClose={() => setIsUserProfileOpen(false)}
            user={user}
            onSignOut={() => {
              signOut();
              setIsUserProfileOpen(false);
            }}
            onStartTutorial={() => setIsTutorialActive(true)}
          />

        </AnimatePresence>

        <ScrollButtons />
        <OnboardingTutorial 
          isActive={isTutorialActive}
          onClose={handleCloseTutorial}
          onSetSidebarOpenMobile={setIsSidebarOpenMobile}
          onSetCurrentView={setCurrentView}
        />
      </div>
  );
}
