import { create } from 'zustand';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { setDoc, doc, getDocs, collection } from 'firebase/firestore';
import { useJournalStore } from './useJournalStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  initialize: () => void;
  updateDisplayName: (displayName: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Do not set user/isAuthenticated here; let onAuthStateChanged handle it
    } catch (error: any) {
      let message = error.message || 'Failed to sign in';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        message = 'Invalid email or password. Please try again.';
      }
      set({ 
        error: message, 
        isLoading: false 
      });
      throw error;
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (result.user) {
        await updateProfile(result.user, { displayName });
        // Add user to Firestore 'users' collection
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: displayName
        });
      }
      // Do not set user/isAuthenticated here; let onAuthStateChanged handle it
    } catch (error: any) {
      let message = error.message || 'Failed to create account';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already in use. Please use a different email or sign in.';
      }
      set({ 
        error: message, 
        isLoading: false 
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await signOut(auth);
      useJournalStore.getState().clearEntries();
      // Do not set user/isAuthenticated here; let onAuthStateChanged handle it
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to sign out', 
        isLoading: false 
      });
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email);
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to send reset email', 
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  initialize: () => {
    onAuthStateChanged(auth, (user) => {
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      });
    });
  },

  updateDisplayName: async (displayName: string) => {
    const { user } = get();
    if (!user) throw new Error('No user logged in');
    set({ isLoading: true, error: null });
    try {
      await updateProfile(user, { displayName });
      // Update Firestore user document as well
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName
      }, { merge: true });
      // Update local user state
      set({ user: { ...user, displayName }, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update display name', isLoading: false });
      throw error;
    }
  }
}));

export const fetchAllUsers = async () => {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  return usersSnapshot.docs.map(doc => doc.data());
};