import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // These would be your actual Firebase config values
  apiKey: "AIzaSyALvRfSchvdCMSyOWgoY4SDvngW7ZaMwvY",
  authDomain: "nishi-b0003.firebaseapp.com",
  projectId: "nishi-b0003",
  storageBucket: "nishi-b0003.firebasestorage.app",
  messagingSenderId: "363365208077",
  appId: "1:363365208077:web:c49dbb3f9eb4faa3a48544"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);