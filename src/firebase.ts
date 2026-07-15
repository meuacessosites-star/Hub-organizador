import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Log config for debugging (safely)
console.log("Firebase Auth Domain:", firebaseConfig.authDomain);

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with settings for better connectivity in preview environments
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || "(default)");
