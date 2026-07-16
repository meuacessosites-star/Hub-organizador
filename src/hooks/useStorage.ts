import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Tag, Category, Platform, Status, Profile, Purchase, ProfilePreset } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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

const DEFAULT_PROFILE_PRESETS: ProfilePreset[] = [
  { id: 'preset-pessoal', name: 'Pessoal', avatar: { type: 'color', value: 'PE', bgColor: '#6366f1' } },
  { id: 'preset-trabalho', name: 'Trabalho', avatar: { type: 'color', value: 'TR', bgColor: '#f59e0b' } },
  { id: 'preset-familia', name: 'Família', avatar: { type: 'color', value: 'FA', bgColor: '#10b981' } },
  { id: 'preset-estudos', name: 'Estudos', avatar: { type: 'color', value: 'ES', bgColor: '#8b5cf6' } },
  { id: 'preset-freelance', name: 'Freelance', avatar: { type: 'color', value: 'FR', bgColor: '#ec4899' } },
  { id: 'preset-empresa', name: 'Empresa', avatar: { type: 'color', value: 'EM', bgColor: '#06b6d4' } },
];

const DEMO_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Importante', emoji: '⭐', color: '#f59e0b' },
  { id: 'tag-2', name: 'Assinatura', emoji: '🔄', color: '#3b82f6' },
  { id: 'tag-3', name: 'Físico', emoji: '📦', color: '#10b981' },
  { id: 'tag-4', name: 'Digital', emoji: '💻', color: '#8b5cf6' },
];

const DEMO_CATEGORIES: Category[] = [
  { id: 'compras', name: 'Compras', icon: 'ShoppingBag', color: '#3b82f6' },
  { id: 'assinaturas', name: 'Assinaturas', icon: 'CreditCard', color: '#8b5cf6' },
  { id: 'estudos', name: 'Estudos', icon: 'GraduationCap', color: '#10b981' },
  { id: 'trabalho', name: 'Trabalho', icon: 'Briefcase', color: '#f59e0b' },
  { id: 'entretenimento', name: 'Entretenimento', icon: 'Gamepad2', color: '#ec4899' },
  { id: 'outros', name: 'Outros', icon: 'LayoutGrid', color: '#6b7280' },
];

const DEMO_STATUSES: Status[] = [
  { id: 'pedido_feito', label: 'Pedido Feito', color: '#f59e0b' },
  { id: 'enviado', label: 'Enviado', color: '#3b82f6' },
  { id: 'saiu_entrega', label: 'Saiu para Entrega', color: '#8b5cf6' },
  { id: 'entregue', label: 'Entregue', color: '#10b981' },
  { id: 'cancelado', label: 'Cancelado', color: '#f43f5e' },
  { id: 'devolvido', label: 'Devolvido', color: '#737373' },
];

const getDemoPlatforms = (userId: string): Platform[] => [
  {
    id: 'demo-plat-netflix',
    name: 'Netflix',
    url: 'https://netflix.com',
    logoUrl: 'https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/227_Netflix_logo-512.png',
    categoryId: 'assinaturas',
    ownerId: userId,
    profiles: [
      {
        id: 'demo-prof-net1',
        name: 'Pessoal',
        username: 'Teste',
        email: 'teste@gmailm.com',
        password: 'SenhaSecretaNetflix123',
        accessLink: 'Netflix.com',
        description: 'Simulação',
        avatar: { type: 'color', value: 'PE', bgColor: '#6366f1' }
      }
    ],
    purchases: [
      {
        id: 'demo-pur-net1',
        profileId: 'demo-prof-net1',
        productName: 'Plano Premium Ultra HD (Mensal)',
        productLink: 'https://netflix.com/changeplan',
        status: 'entregue',
        originalPrice: 55.90,
        discount: 0,
        finalPrice: 55.90,
        notes: 'Renovação automática todo dia 15 no cartão de crédito.',
        date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        paymentDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
        paymentMethod: 'Cartão de Crédito',
        bankName: 'Nubank',
        cardName: 'Roxinho Principal',
        installments: 1,
        tags: ['tag-2'],
        purchaseType: 'subscription'
      },
      {
        id: 'demo-pur-net2',
        profileId: 'demo-prof-net1',
        productName: 'Adicional de Telas Extra',
        productLink: 'https://netflix.com/changeplan',
        status: 'pedido_feito',
        originalPrice: 12.90,
        discount: 0,
        finalPrice: 12.90,
        notes: 'Adicionado para a casa dos pais.',
        date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        paymentDate: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString().split('T')[0],
        paymentMethod: 'Cartão de Crédito',
        bankName: 'Nubank',
        cardName: 'Roxinho Principal',
        installments: 1,
        tags: ['tag-2'],
        purchaseType: 'single'
      }
    ]
  }
];

export function useStorage() {
  const { user, loading: authLoading, isGuest } = useAuth();
  const { addToast } = useToast();
  
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS);
  
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  
  const [statuses, setStatuses] = useState<Status[]>(DEFAULT_STATUSES);

  const [profilePresets, setProfilePresets] = useState<ProfilePreset[]>(DEFAULT_PROFILE_PRESETS);

  const [isDemoActive, setIsDemoActive] = useState(false);
  const isDemoActiveRef = useRef(isDemoActive);
  useEffect(() => { isDemoActiveRef.current = isDemoActive; }, [isDemoActive]);

  const realDataRef = useRef<{
    platforms: Platform[];
    categories: Category[];
    statuses: Status[];
    tags: Tag[];
    profilePresets: ProfilePreset[];
  } | null>(null);

  const setDemoActive = useCallback((active: boolean) => {
    if (active === isDemoActiveRef.current) return;
    
    if (active) {
      realDataRef.current = {
        platforms: [...platformsRef.current],
        categories: [...categoriesRef.current],
        statuses: [...statusesRef.current],
        tags: [...tagsRef.current],
        profilePresets: [...profilePresetsRef.current]
      };
      setTags(DEMO_TAGS);
      setCategories(DEMO_CATEGORIES);
      setStatuses(DEMO_STATUSES);
      const demoPlats = getDemoPlatforms(user?.uid || 'demo-user-id');
      setPlatforms(demoPlats);
      platformsRef.current = demoPlats;
      setIsDemoActive(true);
    } else {
      if (realDataRef.current) {
        setTags(realDataRef.current.tags);
        setCategories(realDataRef.current.categories);
        setStatuses(realDataRef.current.statuses);
        setPlatforms(realDataRef.current.platforms);
        setProfilePresets(realDataRef.current.profilePresets);
        platformsRef.current = realDataRef.current.platforms;
      } else {
        setTags(DEFAULT_TAGS);
        setCategories(DEFAULT_CATEGORIES);
        setStatuses(DEFAULT_STATUSES);
        setPlatforms([]);
        setProfilePresets(DEFAULT_PROFILE_PRESETS);
        platformsRef.current = [];
      }
      setIsDemoActive(false);
      realDataRef.current = null;
    }
  }, [user?.uid]);

  // Flag to prevent re-upload during bulk deletion
  const isClearingRef = useRef(false);

  // Refs to track the latest state for async persistence without stale closures
  const tagsRef = useRef<Tag[]>(DEFAULT_TAGS);
  const categoriesRef = useRef<Category[]>(DEFAULT_CATEGORIES);
  const platformsRef = useRef<Platform[]>([]);
  const statusesRef = useRef<Status[]>(DEFAULT_STATUSES);
  const profilePresetsRef = useRef<ProfilePreset[]>(DEFAULT_PROFILE_PRESETS);

  useEffect(() => { tagsRef.current = tags; }, [tags]);
  useEffect(() => { categoriesRef.current = categories; }, [categories]);
  useEffect(() => { platformsRef.current = platforms; }, [platforms]);
  useEffect(() => { statusesRef.current = statuses; }, [statuses]);
  useEffect(() => { profilePresetsRef.current = profilePresets; }, [profilePresets]);

  // Sync from Firebase & Cleanup on logout
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      console.log('useStorage: Logged out, resetting states to avoid data leakage');
      setIsDemoActive(false);
      realDataRef.current = null;
      setTags(DEFAULT_TAGS);
      setCategories(DEFAULT_CATEGORIES);
      setPlatforms([]);
      setStatuses(DEFAULT_STATUSES);
      setProfilePresets(DEFAULT_PROFILE_PRESETS);
      lastTagsRef.current = null;
      lastCategoriesRef.current = null;
      lastPlatformsRef.current = null;
      lastStatusesRef.current = null;
      return;
    }

    console.log('useStorage: Logged in mode');
    // 2. LOGGED IN MODE
    if (isDemoActive) {
      console.log('useStorage: Demo mode is active, bypassing firestore/local sync to protect demo data');
      return;
    }
    
    // MIGRATION: If guest and unique ID keys don't exist, try to load from old 'hub_tags' etc.
    if (isGuest) {
      const uniqueKeys = [
        `hub_user_${user.uid}_tags`, 
        `hub_user_${user.uid}_categories`, 
        `hub_user_${user.uid}_platforms`, 
        `hub_user_${user.uid}_statuses`,
        `hub_user_${user.uid}_profile_presets`
      ];
      const legacyKeys = ['hub_tags', 'hub_categories', 'hub_platforms', 'hub_statuses'];
      
      legacyKeys.forEach((oldKey, idx) => {
        const newKey = uniqueKeys[idx];
        if (!localStorage.getItem(newKey) && localStorage.getItem(oldKey)) {
          console.log(`Migrating legacy guest data from ${oldKey} to ${newKey}`);
          localStorage.setItem(newKey, localStorage.getItem(oldKey)!);
          // Optional: localStorage.removeItem(oldKey); // Keep for safety for now
        }
      });
    }

    // Load user-specific local storage cache for instant offline rendering
    const savedTags = localStorage.getItem(`hub_user_${user.uid}_tags`);
    const savedCats = localStorage.getItem(`hub_user_${user.uid}_categories`);
    const savedPlats = localStorage.getItem(`hub_user_${user.uid}_platforms`);
    const savedStatuses = localStorage.getItem(`hub_user_${user.uid}_statuses`);
    const savedPresets = localStorage.getItem(`hub_user_${user.uid}_profile_presets`);

    const localTags = safeParse(savedTags, DEFAULT_TAGS);
    const localCats = safeParse(savedCats, DEFAULT_CATEGORIES);
    const localPlats = safeParse(savedPlats, DEFAULT_PLATFORMS).map((p: Platform) => ({
      ...p,
      ownerId: user.uid
    }));
    const localStatuses = safeParse(savedStatuses, DEFAULT_STATUSES);
    const localPresets = safeParse(savedPresets, DEFAULT_PROFILE_PRESETS);

    // Initial merge of defaults with local storage to avoid flickering
    setTags(() => {
      const merged = [...DEFAULT_TAGS];
      localTags.forEach(lt => {
        const idx = merged.findIndex(m => m.id === lt.id);
        if (idx !== -1) merged[idx] = lt;
        else merged.push(lt);
      });
      return merged;
    });

    setCategories(() => {
      const merged = [...DEFAULT_CATEGORIES];
      localCats.forEach(lc => {
        const idx = merged.findIndex(m => m.id === lc.id);
        if (idx !== -1) merged[idx] = lc;
        else merged.push(lc);
      });
      return merged;
    });

    setStatuses(() => {
      const merged = [...DEFAULT_STATUSES];
      localStatuses.forEach(ls => {
        const idx = merged.findIndex(m => m.id === ls.id);
        if (idx !== -1) merged[idx] = ls;
        else merged.push(ls);
      });
      return merged;
    });

    setProfilePresets(() => {
      const merged = [...DEFAULT_PROFILE_PRESETS];
      localPresets.forEach(lp => {
        const idx = merged.findIndex(m => m.id === lp.id);
        if (idx !== -1) merged[idx] = lp;
        else merged.push(lp);
      });
      return merged;
    });

    setPlatforms(localPlats);

    const unsubs: (() => void)[] = [];

    if (!isGuest && user.uid) {
      // Sync tags with Firestore
      const tagsRef = collection(db, 'users', user.uid, 'tags');
      unsubs.push(onSnapshot(tagsRef, { includeMetadataChanges: true }, (snap) => {
        if (isClearingRef.current || isDemoActive) return;
        if (snap.metadata.hasPendingWrites) return;
        
        console.log('useStorage: tags snapshot received', snap.size);
        if (!snap.empty) {
          const cloudTags = snap.docs.map(d => ({ ...d.data() as Tag, id: d.id }));
          setTags(() => {
            const merged = [...DEFAULT_TAGS];
            cloudTags.forEach(ct => {
              const idx = merged.findIndex(m => m.id === ct.id);
              if (idx !== -1) merged[idx] = ct;
              else merged.push(ct);
            });
            return merged;
          });
          safeSetItem(`hub_user_${user.uid}_tags`, JSON.stringify(cloudTags));
        } else {
          // If empty in cloud, check if we should keep defaults or go truly empty
          // For now, if cloud is empty, we show defaults for new users
          setTags(DEFAULT_TAGS);
        }
      }, (err) => {
        console.error('useStorage: tags snapshot error', err);
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/tags`);
      }));

      // Sync categories with Firestore
      const catRef = collection(db, 'users', user.uid, 'categories');
      unsubs.push(onSnapshot(catRef, { includeMetadataChanges: true }, (snap) => {
        if (isClearingRef.current || isDemoActive) return;
        if (snap.metadata.hasPendingWrites) return;
        
        if (!snap.empty) {
          const cloudCats = snap.docs.map(d => ({ ...d.data() as Category, id: d.id }));
          setCategories(() => {
            const merged = [...DEFAULT_CATEGORIES];
            cloudCats.forEach(cc => {
              const idx = merged.findIndex(m => m.id === cc.id);
              if (idx !== -1) merged[idx] = cc;
              else merged.push(cc);
            });
            return merged;
          });
          safeSetItem(`hub_user_${user.uid}_categories`, JSON.stringify(cloudCats));
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/categories`);
      }));

      // Sync platforms with Firestore
      const platRef = collection(db, 'users', user.uid, 'platforms');
      unsubs.push(onSnapshot(platRef, { includeMetadataChanges: true }, (snap) => {
        if (isClearingRef.current || isDemoActive) return;
        if (snap.metadata.hasPendingWrites) return; // Ignore updates while we have pending local writes to this collection
        
        if (!snap.empty) {
          const cloudPlats = snap.docs.map(d => {
            const data = d.data() as Platform;
            return { ...data, id: d.id, ownerId: user.uid };
          });
          setPlatforms(cloudPlats);
          platformsRef.current = cloudPlats;
          safeSetItem(`hub_user_${user.uid}_platforms`, JSON.stringify(cloudPlats));
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/platforms`);
      }));

      // Sync statuses with Firestore
      const statusRef = collection(db, 'users', user.uid, 'statuses');
      unsubs.push(onSnapshot(statusRef, { includeMetadataChanges: true }, (snap) => {
        if (isClearingRef.current || isDemoActive) return;
        if (snap.metadata.hasPendingWrites) return;
        
        if (!snap.empty) {
          const cloudStatuses = snap.docs.map(d => ({ ...d.data() as Status, id: d.id }));
          setStatuses(() => {
            const merged = [...DEFAULT_STATUSES];
            cloudStatuses.forEach(cs => {
              const idx = merged.findIndex(m => m.id === cs.id);
              if (idx !== -1) merged[idx] = cs;
              else merged.push(cs);
            });
            return merged;
          });
          safeSetItem(`hub_user_${user.uid}_statuses`, JSON.stringify(cloudStatuses));
        } else {
          setStatuses(DEFAULT_STATUSES);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/statuses`);
      }));

      // Sync profile presets with Firestore
      const presetRef = collection(db, 'users', user.uid, 'profilePresets');
      unsubs.push(onSnapshot(presetRef, { includeMetadataChanges: true }, (snap) => {
        if (isClearingRef.current || isDemoActive) return;
        if (snap.metadata.hasPendingWrites) return;
        
        if (!snap.empty) {
          const cloudPresets = snap.docs.map(d => ({ ...d.data() as ProfilePreset, id: d.id }));
          setProfilePresets(() => {
            const merged = [...DEFAULT_PROFILE_PRESETS];
            cloudPresets.forEach(cp => {
              const idx = merged.findIndex(m => m.id === cp.id);
              if (idx !== -1) merged[idx] = cp;
              else merged.push(cp);
            });
            return merged;
          });
          safeSetItem(`hub_user_${user.uid}_profile_presets`, JSON.stringify(cloudPresets));
        } else {
          setProfilePresets(DEFAULT_PROFILE_PRESETS);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/profilePresets`);
      }));
    }

    return () => unsubs.forEach(unsub => unsub());
  }, [user, authLoading, isDemoActive]);

  // One-time initial backup/migration logic
  const hasAttemptedInitialBackup = useRef(false);
  useEffect(() => {
    if (authLoading || !user || isGuest || isDemoActive || hasAttemptedInitialBackup.current) return;

    const performInitialBackup = async () => {
      hasAttemptedInitialBackup.current = true;
      console.log('useStorage: Checking for initial data backup/migration...');
      
      // We only backup if local storage has non-default data
      // For simplicity, we'll just check if any platforms exist or if tags/categories differ from defaults
      const savedPlats = localStorage.getItem(`hub_user_${user.uid}_platforms`);
      if (!savedPlats || savedPlats === '[]') {
        console.log('useStorage: No platforms found for initial backup, skipping.');
        return;
      }

      const currentPlats = platformsRef.current;
      if (currentPlats.length > 0) {
        console.log(`useStorage: Performing initial backup of ${currentPlats.length} platforms.`);
        for (const p of currentPlats) {
          await fbSet('platforms', p.id, p);
        }
        // Also backup tags/categories if they exist
        for (const t of tagsRef.current) await fbSet('tags', t.id, t);
        for (const c of categoriesRef.current) if (c.isCustom) await fbSet('categories', c.id, c);
        for (const s of statusesRef.current) if (s.isCustom) await fbSet('statuses', s.id, s);
        for (const p of profilePresetsRef.current) await fbSet('profilePresets', p.id, p);
      }
    };

    // Small delay to ensure state is loaded from local storage
    const timer = setTimeout(performInitialBackup, 2000);
    return () => clearTimeout(timer);
  }, [user, authLoading, isGuest]);

  // Sync to local storage for offline / instant render when state updates
  const lastTagsRef = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading || !user || isDemoActive) return; // DO NOT SAVE IF LOGGED OUT OR AUTH IS LOADING OR DEMO ACTIVE
    const handler = setTimeout(() => {
      const key = `hub_user_${user.uid}_tags`;
      const value = JSON.stringify(tags);
      if (lastTagsRef.current !== value) {
        if (safeSetItem(key, value)) {
          lastTagsRef.current = value;
        }
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [tags, user, authLoading, isDemoActive]);

  const lastCategoriesRef = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading || !user || isDemoActive) return; // DO NOT SAVE IF LOGGED OUT OR AUTH IS LOADING OR DEMO ACTIVE
    const handler = setTimeout(() => {
      const key = `hub_user_${user.uid}_categories`;
      const value = JSON.stringify(categories);
      if (lastCategoriesRef.current !== value) {
        if (safeSetItem(key, value)) {
          lastCategoriesRef.current = value;
        }
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [categories, user, authLoading, isDemoActive]);

  const lastPlatformsRef = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading || !user || isDemoActive) return; // DO NOT SAVE IF LOGGED OUT OR AUTH IS LOADING OR DEMO ACTIVE
    const handler = setTimeout(() => {
      const key = `hub_user_${user.uid}_platforms`;
      const value = JSON.stringify(platforms);
      if (lastPlatformsRef.current !== value) {
        if (safeSetItem(key, value)) {
          lastPlatformsRef.current = value;
        }
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [platforms, user, authLoading, isDemoActive]);

  const lastStatusesRef = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading || !user || isDemoActive) return; // DO NOT SAVE IF LOGGED OUT OR AUTH IS LOADING OR DEMO ACTIVE
    const handler = setTimeout(() => {
      const key = `hub_user_${user.uid}_statuses`;
      const value = JSON.stringify(statuses);
      if (lastStatusesRef.current !== value) {
        if (safeSetItem(key, value)) {
          lastStatusesRef.current = value;
        }
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [statuses, user, authLoading, isDemoActive]);

  const lastPresetsRef = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading || !user || isDemoActive) return; 
    const handler = setTimeout(() => {
      const key = `hub_user_${user.uid}_profile_presets`;
      const value = JSON.stringify(profilePresets);
      if (lastPresetsRef.current !== value) {
        if (safeSetItem(key, value)) {
          lastPresetsRef.current = value;
        }
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [profilePresets, user, authLoading, isDemoActive]);

  // Firestore DB Helpers
  const fbSet = useCallback(async (collectionName: string, id: string, data: any) => {
    if (isDemoActive) {
      console.log(`[Demo Mode] Skip fbSet: collection='${collectionName}', docId='${id}'`);
      return;
    }
    if (user && !isGuest) {
      try {
        console.log(`[Firestore Write Start] Sincronizando com Firestore: coleção='${collectionName}', docId='${id}'`, data);
        await setDoc(doc(db, 'users', user.uid, collectionName, id), data);
        console.log(`[Firestore Write Success] Sucesso ao persistir no Firestore: coleção='${collectionName}', docId='${id}'`);
      } catch (err) {
        console.error(`[Firestore Write Error] Falha ao persistir no Firestore: coleção='${collectionName}', docId='${id}'`, err);
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/${collectionName}/${id}`);
      }
    } else {
      console.log(`[Firestore Write Ignored] Ignorado (usuário visitante/não autenticado): coleção='${collectionName}', docId='${id}'`);
    }
  }, [isDemoActive, user, isGuest]);

  const fbDelete = useCallback(async (collectionName: string, id: string) => {
    if (isDemoActive) {
      console.log(`[Demo Mode] Skip fbDelete: collection='${collectionName}', docId='${id}'`);
      return;
    }
    if (user && !isGuest) {
      try {
        console.log(`[Firestore Delete Start] Deletando do Firestore: coleção='${collectionName}', docId='${id}'`);
        await deleteDoc(doc(db, 'users', user.uid, collectionName, id));
        console.log(`[Firestore Delete Success] Sucesso ao deletar do Firestore: coleção='${collectionName}', docId='${id}'`);
      } catch (err) {
        console.error(`[Firestore Delete Error] Falha ao deletar do Firestore: coleção='${collectionName}', docId='${id}'`, err);
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/${collectionName}/${id}`);
      }
    } else {
      console.log(`[Firestore Delete Ignored] Ignorado (usuário visitante/não autenticado): coleção='${collectionName}', docId='${id}'`);
    }
  }, [isDemoActive, user, isGuest]);

  // Tag CRUD (Optimistic local updates + async Firestore backup)
  const addTag = useCallback((tag: Omit<Tag, 'id'>) => {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newTag: Tag = { ...tag, id: `tag-${Date.now()}-${randomSuffix}` };
    setTags((prev) => [...prev, newTag]);
    fbSet('tags', newTag.id, newTag);
    return newTag;
  }, [fbSet]);

  const updateTag = useCallback((id: string, updated: Partial<Tag>) => {
    const currentTags = tagsRef.current;
    const tag = currentTags.find(t => t.id === id);
    if (!tag) return;
    
    const newTag = { ...tag, ...updated };
    setTags((prev) => prev.map((t) => (t.id === id ? newTag : t)));
    fbSet('tags', id, newTag);
  }, [fbSet]);

  const deleteTag = useCallback((id: string) => {
    setTags((prev) => prev.filter((tag) => tag.id !== id));
    fbDelete('tags', id);
  }, [fbDelete]);

  // Category CRUD
  const addCategory = useCallback((category: Omit<Category, 'id' | 'isCustom'>) => {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newCat: Category = { ...category, id: `cat-${Date.now()}-${randomSuffix}`, isCustom: true };
    setCategories((prev) => [...prev, newCat]);
    fbSet('categories', newCat.id, newCat);
    return newCat;
  }, [fbSet]);

  const updateCategory = useCallback((id: string, updated: Partial<Category>) => {
    const currentCats = categoriesRef.current;
    const cat = currentCats.find(c => c.id === id);
    if (!cat) return;

    const newCat = { ...cat, ...updated };
    setCategories((prev) => prev.map((c) => (c.id === id ? newCat : c)));
    fbSet('categories', id, newCat);
  }, [fbSet]);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    fbDelete('categories', id);
  }, [fbDelete]);

  // Platform CRUD
  const addPlatform = useCallback((platform: Omit<Platform, 'id' | 'profiles' | 'purchases'>) => {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newPlat: Platform = { 
      ...platform, 
      id: `plat-${Date.now()}-${randomSuffix}`, 
      profiles: [], 
      purchases: [],
      ownerId: user?.uid || ''
    };
    setPlatforms((prev) => {
      const next = [...prev, newPlat];
      platformsRef.current = next;
      return next;
    });
    fbSet('platforms', newPlat.id, newPlat);
    return newPlat;
  }, [fbSet, user?.uid]);

  const updatePlatform = useCallback((id: string, updated: Partial<Platform>) => {
    const currentPlatforms = platformsRef.current;
    const plat = currentPlatforms.find(p => p.id === id);
    if (!plat) return;

    const newPlat = { ...plat, ...updated };
    setPlatforms((prev) => {
      const next = prev.map((p) => (p.id === id ? newPlat : p));
      platformsRef.current = next;
      return next;
    });
    fbSet('platforms', id, newPlat);
  }, [fbSet]);

  const deletePlatform = useCallback((id: string) => {
    setPlatforms((prev) => {
      const next = prev.filter((plat) => plat.id !== id);
      platformsRef.current = next;
      return next;
    });
    fbDelete('platforms', id);
  }, [fbDelete]);

  // Profile CRUD within platform
  const addProfile = useCallback((platformId: string, profile: Omit<Profile, 'id'>) => {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newProfile: Profile = { ...profile, id: `prof-${Date.now()}-${randomSuffix}` };
    
    const currentPlatforms = platformsRef.current;
    const plat = currentPlatforms.find(p => p.id === platformId);
    if (!plat) return newProfile;

    const newPlat = { ...plat, profiles: [...(plat.profiles || []), newProfile] };
    setPlatforms((prev) => {
      const next = prev.map((p) => (p.id === platformId ? newPlat : p));
      platformsRef.current = next;
      return next;
    });
    fbSet('platforms', platformId, newPlat);
    
    return newProfile;
  }, [fbSet]);

  const updateProfile = useCallback((platformId: string, profileId: string, updated: Partial<Profile>) => {
    const currentPlatforms = platformsRef.current;
    const plat = currentPlatforms.find(p => p.id === platformId);
    if (!plat) return;

    const newProfiles = (plat.profiles || []).map((prof) => 
      prof.id === profileId ? { ...prof, ...updated } : prof
    );
    const newPlat = { ...plat, profiles: newProfiles };
    
    setPlatforms((prev) => {
      const next = prev.map((p) => (p.id === platformId ? newPlat : p));
      platformsRef.current = next;
      return next;
    });
    fbSet('platforms', platformId, newPlat);
  }, [fbSet]);

  const deleteProfile = useCallback((platformId: string, profileId: string) => {
    const currentPlatforms = platformsRef.current;
    const plat = currentPlatforms.find(p => p.id === platformId);
    if (!plat) return;

    const newProfiles = (plat.profiles || []).filter((prof) => prof.id !== profileId);
    const newPurchases = (plat.purchases || []).filter((pur) => pur.profileId !== profileId);
    const newPlat = { ...plat, profiles: newProfiles, purchases: newPurchases };

    setPlatforms((prev) => {
      const next = prev.map((p) => (p.id === platformId ? newPlat : p));
      platformsRef.current = next;
      return next;
    });
    fbSet('platforms', platformId, newPlat);
  }, [fbSet]);

  // Purchase CRUD
  const validatePurchaseData = useCallback((productName: string, originalPrice: number, finalPrice: number) => {
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
  }, []);

  const addPurchase = useCallback((platformId: string, purchase: Omit<Purchase, 'id'> & { date?: string }) => {
    validatePurchaseData(purchase.productName, purchase.originalPrice, purchase.finalPrice);

    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newPurchase: Purchase = { ...purchase, id: `pur-${Date.now()}-${randomSuffix}`, date: purchase.date || new Date().toISOString() };
    
    const currentPlatforms = platformsRef.current;
    const plat = currentPlatforms.find(p => p.id === platformId);
    if (!plat) return newPurchase;

    const newPlat = { ...plat, purchases: [...(plat.purchases || []), newPurchase] };
    setPlatforms((prev) => {
      const next = prev.map((p) => (p.id === platformId ? newPlat : p));
      platformsRef.current = next;
      return next;
    });
    fbSet('platforms', platformId, newPlat);
    
    return newPurchase;
  }, [fbSet, validatePurchaseData]);

  const updatePurchase = useCallback((platformId: string, purchaseId: string, updated: Partial<Purchase>) => {
    const currentPlatforms = platformsRef.current;
    const plat = currentPlatforms.find(p => p.id === platformId);
    if (!plat) return;

    const existingPur = plat.purchases.find(p => p.id === purchaseId);
    if (existingPur) {
      const mergedName = updated.productName !== undefined ? updated.productName : existingPur.productName;
      const mergedOriginal = updated.originalPrice !== undefined ? updated.originalPrice : existingPur.originalPrice;
      const mergedFinal = updated.finalPrice !== undefined ? updated.finalPrice : existingPur.finalPrice;
      validatePurchaseData(mergedName, mergedOriginal, mergedFinal);
    }
    
    const newPurchases = (plat.purchases || []).map((pur) => pur.id === purchaseId ? { ...pur, ...updated } : pur);
    const newPlat = { ...plat, purchases: newPurchases };

    setPlatforms((prev) => {
      const next = prev.map((p) => (p.id === platformId ? newPlat : p));
      platformsRef.current = next;
      return next;
    });
    fbSet('platforms', platformId, newPlat);
  }, [fbSet, validatePurchaseData]);

  const deletePurchase = useCallback((platformId: string, purchaseId: string) => {
    const currentPlatforms = platformsRef.current;
    const plat = currentPlatforms.find(p => p.id === platformId);
    if (!plat) return;

    const newPurchases = (plat.purchases || []).filter((pur) => pur.id !== purchaseId);
    const newPlat = { ...plat, purchases: newPurchases };

    setPlatforms((prev) => {
      const next = prev.map((p) => (p.id === platformId ? newPlat : p));
      platformsRef.current = next;
      return next;
    });
    fbSet('platforms', platformId, newPlat);
  }, [fbSet]);

  // Status CRUD
  const addStatus = useCallback((status: Omit<Status, 'id' | 'isCustom'>) => {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newStatus: Status = { ...status, id: `status-${Date.now()}-${randomSuffix}`, isCustom: true };
    setStatuses((prev) => [...prev, newStatus]);
    fbSet('statuses', newStatus.id, newStatus);
    return newStatus;
  }, [fbSet]);

  const updateStatus = useCallback((id: string, updated: Partial<Status>) => {
    const currentStatuses = statusesRef.current;
    const status = currentStatuses.find(s => s.id === id);
    if (!status) return;

    const newStatus = { ...status, ...updated };
    setStatuses((prev) => prev.map((s) => (s.id === id ? newStatus : s)));
    fbSet('statuses', id, newStatus);
  }, [fbSet]);

  const deleteStatus = useCallback((id: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== id));
    fbDelete('statuses', id);
  }, [fbDelete]);

  // Profile Presets CRUD
  const addProfilePreset = useCallback((preset: Omit<ProfilePreset, 'id'>) => {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newPreset: ProfilePreset = { ...preset, id: `preset-${Date.now()}-${randomSuffix}`, ownerId: user?.uid };
    setProfilePresets((prev) => [...prev, newPreset]);
    fbSet('profilePresets', newPreset.id, newPreset);
    return newPreset;
  }, [fbSet, user?.uid]);

  const updateProfilePreset = useCallback((id: string, updated: Partial<ProfilePreset>) => {
    const currentPresets = profilePresetsRef.current;
    const preset = currentPresets.find(p => p.id === id);
    if (!preset) return;

    const newPreset = { ...preset, ...updated };
    setProfilePresets((prev) => prev.map((p) => (p.id === id ? newPreset : p)));
    fbSet('profilePresets', id, newPreset);
  }, [fbSet]);

  const deleteProfilePreset = useCallback((id: string) => {
    setProfilePresets((prev) => prev.filter((p) => p.id !== id));
    fbDelete('profilePresets', id);
  }, [fbDelete]);

  const importData = useCallback(async (data: any) => {
    if (!user) return;
    isClearingRef.current = true;

    try {
      if (data.platforms) {
        for (const p of data.platforms) {
          const newP = { ...p, ownerId: user.uid };
          await fbSet('platforms', p.id, newP);
        }
      }
      if (data.profilePresets) {
        for (const pr of data.profilePresets) {
          const newPr = { ...pr, ownerId: user.uid };
          await fbSet('profilePresets', pr.id, newPr);
        }
      }
      if (data.categories) {
        for (const c of data.categories) {
          if (c.isCustom) await fbSet('categories', c.id, { ...c, ownerId: user.uid });
        }
      }
      addToast('Dados importados com sucesso! Sincronizando...', 'success');
    } catch (err) {
      console.error('Import failed:', err);
      addToast('Erro ao importar dados.', 'error');
    } finally {
      setTimeout(() => {
        isClearingRef.current = false;
      }, 3000);
    }
  }, [user, fbSet, addToast]);

  const clearAllData = useCallback(async () => {
    if (!user) return;

    isClearingRef.current = true;
    
    // 1. Reset local states IMMEDIATELY for instant UI feedback
    const userTags = tagsRef.current;
    const userCats = categoriesRef.current;
    const userPlats = platformsRef.current;
    const userStatuses = statusesRef.current;
    const userPresets = profilePresetsRef.current;

    setTags(DEFAULT_TAGS);
    setCategories(DEFAULT_CATEGORIES);
    setPlatforms([]);
    setStatuses(DEFAULT_STATUSES);
    setProfilePresets(DEFAULT_PROFILE_PRESETS);

    // Update refs immediately to avoid stale data backup
    tagsRef.current = DEFAULT_TAGS;
    categoriesRef.current = DEFAULT_CATEGORIES;
    platformsRef.current = [];
    statusesRef.current = DEFAULT_STATUSES;
    profilePresetsRef.current = DEFAULT_PROFILE_PRESETS;

    // 2. Clear localStorage IMMEDIATELY
    const keys = [
      'hub_tags', 'hub_categories', 'hub_platforms', 'hub_statuses',
      `hub_user_${user.uid}_tags`, `hub_user_${user.uid}_categories`,
      `hub_user_${user.uid}_platforms`, `hub_user_${user.uid}_statuses`,
      `hub_user_${user.uid}_profile_presets`
    ];
    keys.forEach(k => localStorage.removeItem(k));
    
    // Clear refs to avoid immediate re-save
    lastTagsRef.current = null;
    lastCategoriesRef.current = null;
    lastPlatformsRef.current = null;
    lastStatusesRef.current = null;
    lastPresetsRef.current = null;

    try {
      // 3. Delete everything from Firestore
      if (!isGuest) {
        const deletePromises: Promise<void>[] = [];
        
        userTags.forEach(t => deletePromises.push(fbDelete('tags', t.id)));
        userCats.filter(c => c.isCustom).forEach(c => deletePromises.push(fbDelete('categories', c.id)));
        userPlats.forEach(p => deletePromises.push(fbDelete('platforms', p.id)));
        userStatuses.filter(s => s.isCustom).forEach(s => deletePromises.push(fbDelete('statuses', s.id)));
        userPresets.forEach(p => deletePromises.push(fbDelete('profilePresets', p.id)));
        
        await Promise.all(deletePromises);
      }
    } finally {
      // Reset the flag after a delay to allow snapshots to settle
      setTimeout(() => {
        isClearingRef.current = false;
      }, 5000);
    }
  }, [user, isGuest, fbDelete]);

  return useMemo(() => ({
    tags, addTag, updateTag, deleteTag,
    categories, addCategory, updateCategory, deleteCategory,
    platforms, addPlatform, updatePlatform, deletePlatform,
    addProfile, updateProfile, deleteProfile,
    addPurchase, updatePurchase, deletePurchase,
    statuses, addStatus, updateStatus, deleteStatus,
    profilePresets, addProfilePreset, updateProfilePreset, deleteProfilePreset,
    importData,
    clearAllData,
    isDemoActive, setDemoActive,
  }), [
    tags, addTag, updateTag, deleteTag,
    categories, addCategory, updateCategory, deleteCategory,
    platforms, addPlatform, updatePlatform, deletePlatform,
    addProfile, updateProfile, deleteProfile,
    addPurchase, updatePurchase, deletePurchase,
    statuses, addStatus, updateStatus, deleteStatus,
    profilePresets, addProfilePreset, updateProfilePreset, deleteProfilePreset,
    importData,
    clearAllData,
    isDemoActive, setDemoActive
  ]);
}
