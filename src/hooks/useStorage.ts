import { useState, useEffect, useRef } from 'react';
import { Tag, Category, Platform, Status, Profile, Purchase } from '../types';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { safeParse, safeSetItem } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrors';

const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Importante', emoji: '⭐', color: '#f59e0b' },
  { id: 'tag-2', name: 'Assinatura', emoji: '🔄', color: '#3b82f6' },
  { id: 'tag-3', name: 'Físico', emoji: '📦', color: '#10b981' },
  { id: 'tag-4', name: 'Digital', emoji: '💻', color: '#8b5cf6' },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'compras', name: 'Compras', icon: 'ShoppingBag', color: '#3b82f6' },
  { id: 'assinaturas', name: 'Assinaturas', icon: 'CreditCard', color: '#8b5cf6' },
  { id: 'estudos', name: 'Estudos', icon: 'GraduationCap', color: '#10b981' },
  { id: 'trabalho', name: 'Trabalho', icon: 'Briefcase', color: '#f59e0b' },
  { id: 'entretenimento', name: 'Entretenimento', icon: 'Gamepad2', color: '#ec4899' },
  { id: 'outros', name: 'Outros', icon: 'LayoutGrid', color: '#6b7280' },
];

const DEFAULT_STATUSES: Status[] = [
  { id: 'pedido_feito', label: 'Pedido Feito', color: '#f59e0b' },
  { id: 'enviado', label: 'Enviado', color: '#3b82f6' },
  { id: 'saiu_entrega', label: 'Saiu para Entrega', color: '#8b5cf6' },
  { id: 'entregue', label: 'Entregue', color: '#10b981' },
  { id: 'cancelado', label: 'Cancelado', color: '#f43f5e' },
  { id: 'devolvido', label: 'Devolvido', color: '#737373' },
];

const DEFAULT_PLATFORMS: Platform[] = [];

export function useStorage() {
  const { user, loading: authLoading } = useAuth();
  
  const [tags, setTags] = useState<Tag[]>(() => {
    const saved = localStorage.getItem('hub_tags');
    return safeParse(saved, DEFAULT_TAGS);
  });
  
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('hub_categories');
      return safeParse(saved, DEFAULT_CATEGORIES);
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });
  
  const [platforms, setPlatforms] = useState<Platform[]>(() => {
    try {
      const saved = localStorage.getItem('hub_platforms');
      return safeParse(saved, DEFAULT_PLATFORMS);
    } catch {
      return DEFAULT_PLATFORMS;
    }
  });
  
  const [statuses, setStatuses] = useState<Status[]>(() => {
    try {
      const saved = localStorage.getItem('hub_statuses');
      return safeParse(saved, DEFAULT_STATUSES);
    } catch {
      return DEFAULT_STATUSES;
    }
  });

  // Sync from Firebase & Cleanup on logout
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      console.log('useStorage: Logged out, resetting states to avoid data leakage');
      setTags(DEFAULT_TAGS);
      setCategories(DEFAULT_CATEGORIES);
      setPlatforms([]);
      setStatuses(DEFAULT_STATUSES);
      lastTagsRef.current = null;
      lastCategoriesRef.current = null;
      lastPlatformsRef.current = null;
      lastStatusesRef.current = null;
      return;
    }

    console.log('useStorage: Logged in mode');
    // 2. LOGGED IN MODE
    // Load user-specific local storage cache for instant offline rendering
    const savedTags = localStorage.getItem(`hub_user_${user.uid}_tags`);
    const savedCats = localStorage.getItem(`hub_user_${user.uid}_categories`);
    const savedPlats = localStorage.getItem(`hub_user_${user.uid}_platforms`);
    const savedStatuses = localStorage.getItem(`hub_user_${user.uid}_statuses`);

    const tagsToLoad = safeParse(savedTags, DEFAULT_TAGS);
    const catsToLoad = safeParse(savedCats, DEFAULT_CATEGORIES);
    const platsToLoad = safeParse(savedPlats, DEFAULT_PLATFORMS).map((p: Platform) => ({
      ...p,
      ownerId: user.uid
    }));
    const statusesToLoad = safeParse(savedStatuses, DEFAULT_STATUSES);

    setTags(tagsToLoad);
    setCategories(catsToLoad);
    setPlatforms(platsToLoad);
    setStatuses(statusesToLoad);

    const unsubs: (() => void)[] = [];

    if (user.uid !== 'guest') {
      // Sync tags with Firestore
      const tagsRef = collection(db, 'users', user.uid, 'tags');
      unsubs.push(onSnapshot(tagsRef, (snap) => {
        console.log('useStorage: tags snapshot received', snap.size);
        if (!snap.empty) {
          const cloudTags = snap.docs.map(d => d.data() as Tag);
          setTags(cloudTags);
          safeSetItem(`hub_user_${user.uid}_tags`, JSON.stringify(cloudTags));
        } else {
          // Empty cloud: backup/upload our current state (which might be migrated guest data) to Firestore!
          tagsToLoad.forEach(async (t: Tag) => {
            try {
              await setDoc(doc(db, 'users', user.uid, 'tags', t.id), t);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/tags/${t.id}`);
            }
          });
        }
      }, (err) => {
        console.error('useStorage: tags snapshot error', err);
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/tags`);
      }));

      // Sync categories with Firestore
      const catRef = collection(db, 'users', user.uid, 'categories');
      unsubs.push(onSnapshot(catRef, (snap) => {
        if (!snap.empty) {
          const cloudCats = snap.docs.map(d => d.data() as Category);
          setCategories(cloudCats);
          safeSetItem(`hub_user_${user.uid}_categories`, JSON.stringify(cloudCats));
        } else {
          catsToLoad.forEach(async (c: Category) => {
            try {
              await setDoc(doc(db, 'users', user.uid, 'categories', c.id), c);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/categories/${c.id}`);
            }
          });
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/categories`);
      }));

      // Sync platforms with Firestore
      const platRef = collection(db, 'users', user.uid, 'platforms');
      unsubs.push(onSnapshot(platRef, (snap) => {
        if (!snap.empty) {
          const cloudPlats = snap.docs.map(d => {
            const data = d.data() as Platform;
            return { ...data, ownerId: user.uid };
          });
          setPlatforms(cloudPlats);
          safeSetItem(`hub_user_${user.uid}_platforms`, JSON.stringify(cloudPlats));
        } else {
          platsToLoad.forEach(async (p: Platform) => {
            try {
              await setDoc(doc(db, 'users', user.uid, 'platforms', p.id), p);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/platforms/${p.id}`);
            }
          });
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/platforms`);
      }));

      // Sync statuses with Firestore
      const statusRef = collection(db, 'users', user.uid, 'statuses');
      unsubs.push(onSnapshot(statusRef, (snap) => {
        if (!snap.empty) {
          const cloudStatuses = snap.docs.map(d => d.data() as Status);
          setStatuses(cloudStatuses);
          safeSetItem(`hub_user_${user.uid}_statuses`, JSON.stringify(cloudStatuses));
        } else {
          statusesToLoad.forEach(async (s: Status) => {
            try {
              await setDoc(doc(db, 'users', user.uid, 'statuses', s.id), s);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/statuses/${s.id}`);
            }
          });
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/statuses`);
      }));
    }

    return () => unsubs.forEach(unsub => unsub());
  }, [user, authLoading]);

  // Sync to local storage for offline / instant render when state updates
  const lastTagsRef = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading || !user) return; // DO NOT SAVE IF LOGGED OUT OR AUTH IS LOADING
    const handler = setTimeout(() => {
      const key = user.uid === 'guest' ? 'hub_tags' : `hub_user_${user.uid}_tags`;
      const value = JSON.stringify(tags);
      if (lastTagsRef.current !== value) {
        if (safeSetItem(key, value)) {
          lastTagsRef.current = value;
        }
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [tags, user, authLoading]);

  const lastCategoriesRef = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading || !user) return; // DO NOT SAVE IF LOGGED OUT OR AUTH IS LOADING
    const handler = setTimeout(() => {
      const key = user.uid === 'guest' ? 'hub_categories' : `hub_user_${user.uid}_categories`;
      const value = JSON.stringify(categories);
      if (lastCategoriesRef.current !== value) {
        if (safeSetItem(key, value)) {
          lastCategoriesRef.current = value;
        }
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [categories, user, authLoading]);

  const lastPlatformsRef = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading || !user) return; // DO NOT SAVE IF LOGGED OUT OR AUTH IS LOADING
    const handler = setTimeout(() => {
      const key = user.uid === 'guest' ? 'hub_platforms' : `hub_user_${user.uid}_platforms`;
      const value = JSON.stringify(platforms);
      if (lastPlatformsRef.current !== value) {
        if (safeSetItem(key, value)) {
          lastPlatformsRef.current = value;
        }
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [platforms, user, authLoading]);

  const lastStatusesRef = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading || !user) return; // DO NOT SAVE IF LOGGED OUT OR AUTH IS LOADING
    const handler = setTimeout(() => {
      const key = user.uid === 'guest' ? 'hub_statuses' : `hub_user_${user.uid}_statuses`;
      const value = JSON.stringify(statuses);
      if (lastStatusesRef.current !== value) {
        if (safeSetItem(key, value)) {
          lastStatusesRef.current = value;
        }
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [statuses, user, authLoading]);

  // Firestore DB Helpers
  const fbSet = async (collectionName: string, id: string, data: any) => {
    if (user && user.uid !== 'guest') {
      try {
        await setDoc(doc(db, 'users', user.uid, collectionName, id), data);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/${collectionName}/${id}`);
      }
    }
  };

  const fbDelete = async (collectionName: string, id: string) => {
    if (user && user.uid !== 'guest') {
      try {
        await deleteDoc(doc(db, 'users', user.uid, collectionName, id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/${collectionName}/${id}`);
      }
    }
  };

  // Tag CRUD (Optimistic local updates + async Firestore backup)
  const addTag = (tag: Omit<Tag, 'id'>) => {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newTag: Tag = { ...tag, id: `tag-${Date.now()}-${randomSuffix}` };
    setTags((prev) => [...prev, newTag]);
    fbSet('tags', newTag.id, newTag);
    return newTag;
  };

  const updateTag = (id: string, updated: Partial<Tag>) => {
    setTags((prev) => prev.map((tag) => (tag.id === id ? { ...tag, ...updated } : tag)));
    const tag = tags.find(t => t.id === id);
    if (tag) fbSet('tags', id, { ...tag, ...updated });
  };

  const deleteTag = (id: string) => {
    setTags((prev) => prev.filter((tag) => tag.id !== id));
    fbDelete('tags', id);
  };

  // Category CRUD
  const addCategory = (category: Omit<Category, 'id' | 'isCustom'>) => {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newCat: Category = { ...category, id: `cat-${Date.now()}-${randomSuffix}`, isCustom: true };
    setCategories((prev) => [...prev, newCat]);
    fbSet('categories', newCat.id, newCat);
    return newCat;
  };

  const updateCategory = (id: string, updated: Partial<Category>) => {
    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, ...updated } : cat)));
    const cat = categories.find(c => c.id === id);
    if (cat) fbSet('categories', id, { ...cat, ...updated });
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id || !cat.isCustom));
    fbDelete('categories', id);
  };

  // Platform CRUD
  const addPlatform = (platform: Omit<Platform, 'id' | 'profiles' | 'purchases'>) => {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newPlat: Platform = { 
      ...platform, 
      id: `plat-${Date.now()}-${randomSuffix}`, 
      profiles: [], 
      purchases: [],
      ownerId: user?.uid || 'guest'
    };
    setPlatforms((prev) => [...prev, newPlat]);
    fbSet('platforms', newPlat.id, newPlat);
    return newPlat;
  };

  const updatePlatform = (id: string, updated: Partial<Platform>) => {
    setPlatforms((prev) => prev.map((plat) => (plat.id === id ? { ...plat, ...updated } : plat)));
    const plat = platforms.find(p => p.id === id);
    if (plat) fbSet('platforms', id, { ...plat, ...updated });
  };

  const deletePlatform = (id: string) => {
    setPlatforms((prev) => prev.filter((plat) => plat.id !== id));
    fbDelete('platforms', id);
  };

  // Profile CRUD within platform
  const addProfile = (platformId: string, profile: Omit<Profile, 'id'>) => {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newProfile: Profile = { ...profile, id: `prof-${Date.now()}-${randomSuffix}` };
    setPlatforms((prev) => prev.map((plat) => plat.id === platformId ? { ...plat, profiles: [...plat.profiles, newProfile] } : plat));
    const plat = platforms.find(p => p.id === platformId);
    if (plat) fbSet('platforms', platformId, { ...plat, profiles: [...plat.profiles, newProfile] });
    return newProfile;
  };

  const updateProfile = (platformId: string, profileId: string, updated: Partial<Profile>) => {
    setPlatforms((prev) => prev.map((plat) => plat.id === platformId ? { ...plat, profiles: plat.profiles.map((prof) => prof.id === profileId ? { ...prof, ...updated } : prof) } : plat));
    const plat = platforms.find(p => p.id === platformId);
    if (plat) {
      const newProfiles = plat.profiles.map((prof) => prof.id === profileId ? { ...prof, ...updated } : prof);
      fbSet('platforms', platformId, { ...plat, profiles: newProfiles });
    }
  };

  const deleteProfile = (platformId: string, profileId: string) => {
    setPlatforms((prev) => prev.map((plat) => plat.id === platformId ? { ...plat, profiles: plat.profiles.filter((prof) => prof.id !== profileId), purchases: plat.purchases.filter((pur) => pur.profileId !== profileId) } : plat));
    const plat = platforms.find(p => p.id === platformId);
    if (plat) {
      const newProfiles = plat.profiles.filter((prof) => prof.id !== profileId);
      const newPurchases = plat.purchases.filter((pur) => pur.profileId !== profileId);
      fbSet('platforms', platformId, { ...plat, profiles: newProfiles, purchases: newPurchases });
    }
  };

  // Purchase CRUD
  const validatePurchaseData = (productName: string, originalPrice: number, finalPrice: number) => {
    const trimmedName = (productName || '').trim();
    if (!trimmedName) {
      throw new Error('O nome do produto/serviço não pode ser vazio.');
    }
    if (trimmedName.length < 3) {
      throw new Error('O nome do produto deve conter pelo menos 3 caracteres.');
    }
    if (originalPrice <= 0) {
      throw new Error('O preço original deve ser maior que zero (positivo).');
    }
    if (finalPrice <= 0) {
      throw new Error('O preço final deve ser maior que zero (positivo).');
    }
  };

  const addPurchase = (platformId: string, purchase: Omit<Purchase, 'id'> & { date?: string }) => {
    validatePurchaseData(purchase.productName, purchase.originalPrice, purchase.finalPrice);

    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newPurchase: Purchase = { ...purchase, id: `pur-${Date.now()}-${randomSuffix}`, date: purchase.date || new Date().toISOString() };
    setPlatforms((prev) => prev.map((plat) => plat.id === platformId ? { ...plat, purchases: [...plat.purchases, newPurchase] } : plat));
    const plat = platforms.find(p => p.id === platformId);
    if (plat) fbSet('platforms', platformId, { ...plat, purchases: [...plat.purchases, newPurchase] });
    return newPurchase;
  };

  const updatePurchase = (platformId: string, purchaseId: string, updated: Partial<Purchase>) => {
    const plat = platforms.find(p => p.id === platformId);
    if (plat) {
      const existingPur = plat.purchases.find(p => p.id === purchaseId);
      if (existingPur) {
        const mergedName = updated.productName !== undefined ? updated.productName : existingPur.productName;
        const mergedOriginal = updated.originalPrice !== undefined ? updated.originalPrice : existingPur.originalPrice;
        const mergedFinal = updated.finalPrice !== undefined ? updated.finalPrice : existingPur.finalPrice;
        validatePurchaseData(mergedName, mergedOriginal, mergedFinal);
      }
    }

    setPlatforms((prev) => prev.map((plat) => plat.id === platformId ? { ...plat, purchases: plat.purchases.map((pur) => pur.id === purchaseId ? { ...pur, ...updated } : pur) } : plat));
    if (plat) {
      const newPurchases = plat.purchases.map((pur) => pur.id === purchaseId ? { ...pur, ...updated } : pur);
      fbSet('platforms', platformId, { ...plat, purchases: newPurchases });
    }
  };

  const deletePurchase = (platformId: string, purchaseId: string) => {
    setPlatforms((prev) => prev.map((plat) => plat.id === platformId ? { ...plat, purchases: plat.purchases.filter((pur) => pur.id !== purchaseId) } : plat));
    const plat = platforms.find(p => p.id === platformId);
    if (plat) {
      const newPurchases = plat.purchases.filter((pur) => pur.id !== purchaseId);
      fbSet('platforms', platformId, { ...plat, purchases: newPurchases });
    }
  };

  // Status CRUD
  const addStatus = (status: Omit<Status, 'id' | 'isCustom'>) => {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newStatus: Status = { ...status, id: `status-${Date.now()}-${randomSuffix}`, isCustom: true };
    setStatuses((prev) => [...prev, newStatus]);
    fbSet('statuses', newStatus.id, newStatus);
    return newStatus;
  };

  const updateStatus = (id: string, updated: Partial<Status>) => {
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    const status = statuses.find(s => s.id === id);
    if (status) fbSet('statuses', id, { ...status, ...updated });
  };

  const deleteStatus = (id: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== id || !s.isCustom));
    fbDelete('statuses', id);
  };

  return {
    tags, addTag, updateTag, deleteTag,
    categories, addCategory, updateCategory, deleteCategory,
    platforms, addPlatform, updatePlatform, deletePlatform,
    addProfile, updateProfile, deleteProfile,
    addPurchase, updatePurchase, deletePurchase,
    statuses, addStatus, updateStatus, deleteStatus,
  };
}
