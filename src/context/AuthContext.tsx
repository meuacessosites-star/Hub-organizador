import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail 
} from 'firebase/auth';
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
  authError: string | null;
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
  authError: null,
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
  const [authError, setAuthError] = useState<string | null>(null);
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
        setAuthError(null);
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

    // Handle Redirect Result for Google Sign-In
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log('AuthContext: redirect login successful', result.user.email);
          setAuthError(null);
        }
      })
      .catch((err) => {
        console.error('AuthContext: getRedirectResult error:', err);
        if (err?.code === 'auth/unauthorized-domain') {
          setAuthError('Domínio não autorizado. Verifique se ' + window.location.hostname + ' está na lista de "Domínios Autorizados" no Firebase.');
        } else {
          setAuthError(err.message);
        }
      });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [isGuest]);

  const enterAsGuest = () => {
    setAuthError(null);
    localStorage.setItem('hub_guest_mode', 'true');
    setIsGuest(true);
  };

  const signInWithGoogle = async () => {
    console.log('AuthContext: starting signInWithGoogle');
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        console.log('AuthContext: calling signInWithRedirect (mobile detected)');
        await signInWithRedirect(auth, provider);
      } else {
        try {
          console.log('AuthContext: calling signInWithPopup');
          const result = await signInWithPopup(auth, provider);
          console.log('AuthContext: signInWithPopup successful', result.user.email);
        } catch (popupErr: any) {
          if (popupErr.code === 'auth/popup-blocked') {
            console.log('AuthContext: popup blocked, falling back to redirect');
            await signInWithRedirect(auth, provider);
          } else {
            throw popupErr;
          }
        }
      }
    } catch (err: any) {
      setLoading(false);
      console.error('AuthContext: Google Sign-In Error Full Object:', err);
      
      const errorCode = err?.code;
      const errorMessage = err?.message;

      let finalError = `Erro (${errorCode || 'unknown'}): ${errorMessage || 'Falha ao entrar com Google'}`;

      if (errorCode === 'auth/operation-not-allowed') {
        finalError = 'O login com Google não está ativado no Console do Firebase. Ative-o em Authentication > Sign-in method.';
      } else if (errorCode === 'auth/unauthorized-domain') {
        finalError = 'Domínio não autorizado. Adicione ' + window.location.hostname + ' aos "Domínios Autorizados" no Console do Firebase.';
      } else if (errorCode === 'auth/popup-closed-by-user') {
        finalError = 'A janela de login foi fechada. Tente clicar no botão novamente.';
      } else if (errorCode === 'auth/internal-error') {
        finalError = 'Erro interno do Firebase. Tente recarregar a página.';
      }
      
      setAuthError(finalError);
      throw new Error(finalError);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    setAuthError(null);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    setAuthError(null);
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
    <AuthContext.Provider value={{ user, userProfile, loading, isGuest, authError, enterAsGuest, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
