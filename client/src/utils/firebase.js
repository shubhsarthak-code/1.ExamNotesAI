import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "notesai-e8aed.firebaseapp.com",
  projectId: "notesai-e8aed",
  storageBucket: "notesai-e8aed.firebasestorage.app",
  messagingSenderId: "936196409187",
  appId: "1:936196409187:web:c40ebb9b51269609b43556",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export { auth, provider };
