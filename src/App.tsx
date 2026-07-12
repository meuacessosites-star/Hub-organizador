/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
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
import { Inbox, LayoutGrid, ShoppingBag } from 'lucide-react';
import { useToast } from './context/ToastContext';
import { PurchasesView } from './components/PurchasesView';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { UserProfileModal } from './components/UserProfileModal';
import { ScrollButtons } from './components/ScrollButtons';

export default function App() {
  const { addToast } = useToast();
  const { user, loading: authLoading, signOut } = useAuth();
  
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
  } = useStorage();

  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'platforms' | 'purchases'>('platforms');
  const [highlightedPurchaseId, setHighlightedPurchaseId] = useState<string | null>(null);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

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
  }>({
    isOpen: false,
    platformId: null,
    profile: null,
    startInEditMode: false,
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

  // Find dynamic counts
  const filteredPlatforms = platforms.filter((plat) => {
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
          prof.username.toLowerCase().includes(q) ||
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

  // Calculate search matches on filtered platforms
  const searchMatches: Array<{ platformId: string; profileId: string }> = [];
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredPlatforms.forEach((plat) => {
      const platNameMatch = plat.name.toLowerCase().includes(q);
      plat.profiles.forEach((prof) => {
        const profNameMatch = prof.name.toLowerCase().includes(q);
        const usernameMatch = prof.username.toLowerCase().includes(q);
        const descMatch = prof.description?.toLowerCase().includes(q) || false;
        const linkMatch = prof.accessLink?.toLowerCase().includes(q) || false;

        if (platNameMatch || profNameMatch || usernameMatch || descMatch || linkMatch) {
          searchMatches.push({ platformId: plat.id, profileId: prof.id });
        }
      });
    });
  }

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
      if ('id' in purchaseData && purchaseData.id) {
        updatePurchase(purchaseModal.platformId, purchaseData.id, purchaseData);
      } else {
        addPurchase(purchaseModal.platformId, purchaseData as Omit<Purchase, 'id'>);
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

  const currentPlatformForProfile = platforms.find((p) => p.id === profileModal.platformId) || null;
  const currentPlatformForPurchase = platforms.find((p) => p.id === purchaseModal.platformId) || null;

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
    <div className="flex min-h-screen font-sans bg-neutral-50 dark:bg-black text-neutral-800 dark:text-neutral-200 transition-colors duration-200">
        
        {/* Sidebar Component */}
        <Sidebar
          categories={categories}
          platforms={platforms}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onManageCategories={() => setIsManageCategoriesOpen(true)}
          onManageStatuses={() => setIsManageStatusesOpen(true)}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          onBackToLogin={() => {
            if (user) {
              signOut();
            }
          }}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full overflow-x-hidden">
          {/* Header Bar */}
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onNewPlatform={() => setIsNewPlatformOpen(true)}
            onMenuClick={() => setIsSidebarOpenMobile(true)}
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
            onAuthAction={() => {
              if (user) {
                setIsUserProfileOpen(true);
              }
            }}
          />

          {/* Core Body Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
            
            {/* View Selector Tabs */}
            <div className="flex bg-neutral-200/50 dark:bg-black/40 p-1 rounded-xl self-start select-none border border-neutral-200 dark:border-neutral-800/50">
              <button
                onClick={() => setCurrentView('platforms')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                  currentView === 'platforms'
                    ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-sm dark:shadow-[0_0_15px_rgba(79,70,229,0.2)] border border-neutral-200 dark:border-indigo-500/30'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Plataformas</span>
              </button>
              <button
                onClick={() => setCurrentView('purchases')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                  currentView === 'purchases'
                    ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-sm dark:shadow-[0_0_15px_rgba(79,70,229,0.2)] border border-neutral-200 dark:border-indigo-500/30'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Compras</span>
              </button>
            </div>

            {currentView === 'platforms' ? (
              <>
                {/* Subheader summary path */}
                <div className="flex items-center justify-between select-none">
                  <h2 className="text-xs font-bold font-sans tracking-wide text-neutral-500 dark:text-neutral-400 uppercase flex items-center gap-1.5">
                    <span>{subHeaderString}</span>
                  </h2>
                </div>

                {/* Platform Grid Layout */}
                <AnimatePresence mode="popLayout">
                  {filteredPlatforms.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex-1 flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0a0a0c] rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800"
                    >
                      <Inbox className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
                      <h3 className="font-sans font-semibold text-neutral-800 dark:text-neutral-300 text-sm">
                        Nenhuma plataforma encontrada
                      </h3>
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1 text-center max-w-xs">
                        {searchQuery
                          ? 'Nenhuma plataforma ou conta atende aos seus critérios de busca.'
                          : 'Comece clicando em "+ Nova Conta" no cabeçalho.'}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      layout="position"
                      className="grid grid-cols-1 xl:grid-cols-2 gap-6"
                    >
                      {filteredPlatforms.map((plat) => {
                        const cat = categories.find((c) => c.id === plat.categoryId);
                        return (
                          <PlatformCard
                            key={plat.id}
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
                          />
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <PurchasesView
                platforms={platforms}
                categories={categories}
                statuses={statuses}
                tags={tags}
                onViewPurchase={handleOpenViewPurchase}
                onEditPurchase={handleUpdatePurchaseDirect}
                onAddPurchase={handleOpenAddPurchase}
                highlightedPurchaseId={highlightedPurchaseId}
                onClearHighlight={() => setHighlightedPurchaseId(null)}
              />
            )}
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
              onClose={() => setProfileModal({ isOpen: false, platformId: null, profile: null, startInEditMode: false })}
              platform={currentPlatformForProfile}
              profile={profileModal.profile}
              onSave={handleSaveProfile}
              onEdit={handleEditProfile}
              onDelete={handleDeleteProfile}
              startInEditMode={profileModal.startInEditMode}
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
          />

        </AnimatePresence>

        <ScrollButtons />
      </div>
  );
}
