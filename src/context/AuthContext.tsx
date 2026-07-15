import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

import { handleFirestoreError, OperationType } from '../utils/firebaseErrors';

export interface UserProfileData {
  displayName?: string;
  avatar?: {
    type: 'color' | 'emoji' | 'image' | 'google';
    value: string;
    bgColor?: string;
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  isGuest: boolean;
  enterAsGuest: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isGuest: false,
  enterAsGuest: () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  resetPassword: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('hub_guest_mode') === 'true';
  });

  // Unique guest ID per device
  const getGuestId = () => {
    let id = localStorage.getItem('hub_guest_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('hub_guest_id', id);
    }
    return id;
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    if (isGuest) {
      const guestId = getGuestId();
      setUser({
        uid: `guest_${guestId}`,
        displayName: 'Visitante',
        email: `guest_${guestId}@huborganizado.local`,
        photoURL: null,
        emailVerified: true,
        isAnonymous: true,
      } as unknown as User);

      const savedProfile = localStorage.getItem('hub_guest_profile');
      if (savedProfile) {
        try {
          setUserProfile(JSON.parse(savedProfile));
        } catch {
          setUserProfile({ displayName: 'Visitante' });
        }
      } else {
        setUserProfile({ displayName: 'Visitante' });
      }
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        localStorage.removeItem('hub_guest_mode');
        setIsGuest(false);
        setUser(u);
        
        // Listen for profile changes
        unsubscribeProfile = onSnapshot(doc(db, 'users', u.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfileData);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setLoading(false);
        if (unsubscribeProfile) unsubscribeProfile();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [isGuest]);

  const enterAsGuest = () => {
    localStorage.setItem('hub_guest_mode', 'true');
    setIsGuest(true);
  };

  const signInWithGoogle = async () => {
    console.log('AuthContext: starting signInWithGoogle');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('AuthContext: calling signInWithPopup');
      const result = await signInWithPopup(auth, provider);
      console.log('AuthContext: signInWithPopup successful', result.user.email);
    } catch (err: any) {
      setLoading(false);
      console.error('AuthContext: Google Sign-In Error Full Object:', err);
      
      const errorCode = err?.code;
      const errorMessage = err?.message;

      if (errorCode === 'auth/popup-blocked') {
        throw new Error('O pop-up foi bloqueado! Procure por um ícone de "janela bloqueada" na barra de endereços do seu navegador (no topo) e selecione "Sempre permitir pop-ups".');
      } else if (errorCode === 'auth/operation-not-allowed') {
        throw new Error('O login com Google não está ativado no Console do Firebase. Ative-o em Authentication > Sign-in method.');
      } else if (errorCode === 'auth/unauthorized-domain') {
        throw new Error('Domínio não autorizado. Adicione ' + window.location.hostname + ' aos "Domínios Autorizados" no Console do Firebase.');
      } else if (errorCode === 'auth/popup-closed-by-user') {
        throw new Error('A janela de login foi fechada. Tente clicar no botão novamente.');
      } else if (errorCode === 'auth/internal-error') {
        throw new Error('Erro interno do Firebase. Tente recarregar a página.');
      }
      
      throw new Error(`Erro (${errorCode || 'unknown'}): ${errorMessage || 'Falha ao entrar com Google'}`);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    const isActuallyGuest = isGuest;
    const guestId = localStorage.getItem('hub_guest_id');

    localStorage.removeItem('hub_guest_mode');
    setIsGuest(false);
    setUser(null);
    setUserProfile(null);

    // Security: Clear all user-specific data from localStorage for REGISTERED users
    // For GUESTS, we preserve data for device persistence as requested
    Object.keys(localStorage).forEach(key => {
      const isGuestKey = key.startsWith('hub_guest_') || (guestId && key.startsWith(`hub_user_guest_${guestId}`));
      
      if (
        key.startsWith('hub_user_') ||
        key.startsWith('hub_guest_') ||
        key === 'hub_tags' ||
        key === 'hub_categories' ||
        key === 'hub_platforms' ||
        key === 'hub_statuses' ||
        key === 'hub_profile_names' ||
        key === 'hub_custom_presets'
      ) {
        // Only clear if it's NOT a guest key we want to preserve
        // OR if the current session was NOT a guest session (registered user logout)
        if (!isActuallyGuest) {
          if (key !== 'hub_guest_id' && !isGuestKey) {
            localStorage.removeItem(key);
          }
        } else {
          // If we are guest, we only clear the current mode, keeping the data for next time
          // This is handled by removeItem('hub_guest_mode') above
        }
      }
    });

    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isGuest, enterAsGuest, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
