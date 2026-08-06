import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import firebaseConfigJson from "../../firebase-applet-config.json";

// Helper to safely get environment variables in both Vite and Node environments
const getEnvVar = (key: string): string | undefined => {
  try {
    const meta = import.meta as any;
    if (typeof meta !== 'undefined' && meta.env && meta.env[key]) {
      return meta.env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch {}
  return undefined;
};

export const firebaseConfig = {
  apiKey: getEnvVar("VITE_FIREBASE_API_KEY") || firebaseConfigJson.apiKey,
  authDomain: getEnvVar("VITE_FIREBASE_AUTH_DOMAIN") || firebaseConfigJson.authDomain,
  projectId: getEnvVar("VITE_FIREBASE_PROJECT_ID") || firebaseConfigJson.projectId,
  storageBucket: getEnvVar("VITE_FIREBASE_STORAGE_BUCKET") || firebaseConfigJson.storageBucket,
  messagingSenderId: getEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID") || firebaseConfigJson.messagingSenderId,
  appId: getEnvVar("VITE_FIREBASE_APP_ID") || firebaseConfigJson.appId
};

export const TARGET_DATABASE_ID = getEnvVar("VITE_FIREBASE_DATABASE_ID") || firebaseConfigJson.firestoreDatabaseId || "(default)";

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Ensure auth persistence is set to LOCAL so users stay logged in across multiple devices/browsers without unexpected logouts
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Auth persistence error:", err);
});

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, TARGET_DATABASE_ID);


