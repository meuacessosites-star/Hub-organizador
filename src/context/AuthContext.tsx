import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  linkWithCredential
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

import { handleFirestoreError, OperationType } from '../utils/firebaseErrors';

export interface UserProfileData {
  displayName?: string;
  photoURL?: string;
  avatar?: {
    type: 'color' | 'emoji' | 'image' | 'google';
    value: string;
    bgColor?: string;
    zoom?: number;
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  isGuest: boolean;
  authError: string | null;
  linkSuccessMessage: string | null;
  enterAsGuest: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  linkPasswordToAccount: (password: string) => Promise<void>;
  clearLinkSuccessMessage: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isGuest: false,
  authError: null,
  linkSuccessMessage: null,
  enterAsGuest: () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  resetPassword: async () => {},
  linkPasswordToAccount: async () => {},
  clearLinkSuccessMessage: () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [linkSuccessMessage, setLinkSuccessMessage] = useState<string | null>(null);
  const pendingLinkRef = useRef<{ email: string; password: string; displayName: string } | null>(null);

  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('hub_guest_mode') === 'true';
  });

  const clearLinkSuccessMessage = () => setLinkSuccessMessage(null);

  const syncUserToUsuariosCollection = async (u: User) => {
    try {
      const userDocRef = doc(db, 'usuarios', u.uid);
      const nowIso = new Date().toISOString();
      const updatePayload: Record<string, any> = {
        uid: u.uid,
        email: u.email || '',
        displayName: u.displayName || u.email?.split('@')[0] || '',
        origem: 'Hub Organizador',
        origem_app: 'Hub Organizador',
        lastLogin: nowIso,
        lastLoginAt: serverTimestamp(),
        updatedAt: nowIso
      };
      const photoFromUser = u.photoURL || u.providerData?.find(p => p.photoURL)?.photoURL;
      if (photoFromUser) {
        updatePayload.photoURL = photoFromUser;
      }
      await setDoc(userDocRef, updatePayload, { merge: true });
      console.log(`[Usuarios Sync] Sucesso ao atualizar usuário ${u.uid} na coleção 'usuarios' com origem_app: 'Hub Organizador'`);
    } catch (error) {
      console.error(`[Usuarios Sync Error] Falha ao atualizar documento em 'usuarios':`, error);
    }
  };

  // Helper to handle pending email/password link after Google Auth
  const handlePendingAccountLink = async (currentUser: User) => {
    if (pendingLinkRef.current && currentUser.email?.toLowerCase() === pendingLinkRef.current.email.toLowerCase()) {
      const { email: pendingEmail, password: pendingPassword, displayName: pendingName } = pendingLinkRef.current;
      try {
        const cred = EmailAuthProvider.credential(pendingEmail, pendingPassword);
        await linkWithCredential(currentUser, cred);
        console.log(`[AuthContext] Senha vinculada com sucesso à conta do Google (${currentUser.email})`);
        if (pendingName && (!currentUser.displayName || currentUser.displayName === currentUser.email?.split('@')[0])) {
          await updateProfile(currentUser, { displayName: pendingName });
        }
        setLinkSuccessMessage('Sua senha foi vinculada com sucesso à sua conta do Google! Agora você pode entrar usando o Google ou Email e Senha.');
      } catch (linkErr: any) {
        console.warn('[AuthContext] Erro/Aviso ao vincular senha:', linkErr);
        if (linkErr.code === 'auth/provider-already-linked' || linkErr.code === 'auth/credential-already-in-use') {
          setLinkSuccessMessage('Sua conta do Google já está vinculada e pronta para uso com e-mail e senha!');
        } else {
          setAuthError(`Não foi possível vincular a senha: ${linkErr.message || 'Erro desconhecido'}`);
        }
      } finally {
        pendingLinkRef.current = null;
      }
    }
  };

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

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setAuthError(null);
        localStorage.removeItem('hub_guest_mode');
        setIsGuest(false);
        setUser(u);
        setLoading(false);
        
        // Save or update user document in 'usuarios' collection with origin tags
        await syncUserToUsuariosCollection(u);

        // Check and link any pending email/password credential to this Google user
        await handlePendingAccountLink(u);

        // Listen for profile changes in the background (NON-BLOCKING)
        unsubscribeProfile = onSnapshot(doc(db, 'usuarios', u.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfileData);
          } else {
            setUserProfile(null);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `usuarios/${u.uid}`);
        });
      } else {
        setUserProfile(null);
        setLoading(false);
        if (unsubscribeProfile) unsubscribeProfile();
      }
    });

    // Handle Redirect Result for Google Sign-In
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          console.log('AuthContext: redirect login successful', result.user.email);
          setAuthError(null);
          await syncUserToUsuariosCollection(result.user);
          await handlePendingAccountLink(result.user);
        }
      })
      .catch((err) => {
        console.warn('AuthContext: getRedirectResult warning:', err);
        const code = err?.code;
        const msg = err?.message || '';
        if (code === 'auth/unauthorized-domain') {
          setAuthError('Domínio não autorizado. Verifique se ' + window.location.hostname + ' está na lista de "Domínios Autorizados" no Firebase.');
        } else if (code === 'auth/api-key-not-valid' || msg.includes('api-key-not-valid')) {
          // Do not display passive startup api-key error on screen automatically; log warning only
          console.warn('Firebase API key is invalid or not yet configured.');
        } else if (code && code !== 'auth/null-user') {
          setAuthError(msg);
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
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      // Try popup first (faster and better user experience for web)
      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        setAuthError(null);
        await syncUserToUsuariosCollection(result.user);
        await handlePendingAccountLink(result.user);
        return;
      }
    } catch (popupErr: any) {
      console.warn('AuthContext: signInWithPopup failed or blocked, attempting signInWithRedirect:', popupErr);
      
      const code = popupErr?.code;
      const msg = popupErr?.message || '';

      // If error is related to popup blocked or closed, try redirect
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr: any) {
          console.error('AuthContext: signInWithRedirect Error:', redirectErr);
        }
      }

      let finalError = `Erro ao entrar com Google: ${msg}`;

      if (code === 'auth/api-key-not-valid' || msg.includes('api-key-not-valid')) {
        finalError = 'A chave de API do Firebase precisa ser ativada para login com Google. No Console do Firebase, certifique-se que o login do Google está ativo e o domínio ' + window.location.hostname + ' está em Domínios Autorizados.';
      } else if (code === 'auth/operation-not-allowed') {
        finalError = 'O login com Google não está ativado no Console do Firebase. Ative em Authentication > Sign-in method.';
      } else if (code === 'auth/unauthorized-domain') {
        finalError = 'Domínio não autorizado. Adicione ' + window.location.hostname + ' aos "Domínios Autorizados" em Authentication > Configurações no Console do Firebase.';
      } else if (code === 'auth/popup-closed-by-user') {
        finalError = 'A janela de login do Google foi fechada antes de concluir.';
      }

      setAuthError(finalError);
      throw new Error(finalError);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods && methods.includes('google.com') && !methods.includes('password')) {
            const customErr: any = new Error('ACCOUNT_EXISTS_GOOGLE_ONLY');
            customErr.code = 'auth/account-exists-google-only';
            throw customErr;
          }
        } catch (methodsErr: any) {
          if (methodsErr.code === 'auth/account-exists-google-only') {
            throw methodsErr;
          }
        }
      }
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods && methods.includes('google.com')) {
            pendingLinkRef.current = { email, password, displayName };
            const customErr: any = new Error('ACCOUNT_EXISTS_GOOGLE');
            customErr.code = 'auth/account-exists-google';
            throw customErr;
          }
        } catch (methodsErr: any) {
          if (methodsErr.code === 'auth/account-exists-google') {
            throw methodsErr;
          }
        }
      }
      throw err;
    }
  };

  const linkPasswordToAccount = async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('Nenhum usuário logado para vincular a senha.');
    }
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, password);
      await linkWithCredential(auth.currentUser, cred);
      setLinkSuccessMessage('Sua senha foi vinculada à sua conta com sucesso! Agora você pode entrar com Google ou com e-mail e senha.');
    } catch (err: any) {
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
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
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      isGuest, 
      authError, 
      linkSuccessMessage,
      enterAsGuest, 
      signInWithGoogle, 
      signInWithEmail, 
      signUpWithEmail, 
      resetPassword, 
      linkPasswordToAccount,
      clearLinkSuccessMessage,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
