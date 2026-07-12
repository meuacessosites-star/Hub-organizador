import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBgqyIUrrxENw7swhs5OtksKnEPEA-ytXI",
  authDomain: "gen-lang-client-0404933506.firebaseapp.com",
  projectId: "gen-lang-client-0404933506",
  storageBucket: "gen-lang-client-0404933506.firebasestorage.app",
  messagingSenderId: "813562009552",
  appId: "1:813562009552:web:1ba2b615134867e7ef8bd5",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with settings for better connectivity in preview environments
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, "ai-studio-huborganizado-edd714da-b874-48ca-b9ed-bb951625499c");
