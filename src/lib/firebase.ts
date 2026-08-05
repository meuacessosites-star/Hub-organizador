import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyBgqyIURrxENw7swhs50tksKnEPEA-ytXI",
  authDomain: "gen-lang-client-0404933506.firebaseapp.com",
  projectId: "gen-lang-client-0404933506",
  storageBucket: "gen-lang-client-0404933506.firebasestorage.app",
  messagingSenderId: "813562009552",
  appId: "1:813562009552:web:4a0b37dbebaac50bef8bd5"
};

export const TARGET_DATABASE_ID = "ai-studio-vitrinedeofertas-fe9194d9-264f-425d-ab2f-b0df2472505f";

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Force Firestore connection exclusively to the central database ID: ai-studio-vitrinedeofertas-fe9194d9-264f-425d-ab2f-b0df2472505f
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, TARGET_DATABASE_ID);
