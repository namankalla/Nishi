import { create } from 'zustand';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserProfile {
  uid: string;
  points: number;
  displayName?: string;
  email?: string;
}

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  retroactivePointsNotification: string | null; // new notification state
  loadUser: (uid: string) => Promise<void>;
  ensureUserDoc: (uid: string) => Promise<void>;
  incrementPoints: (uid: string, delta: number) => Promise<void>;
  spendPoints: (uid: string, delta: number) => Promise<void>;
  setLocalPoints: (points: number) => void; // for demo/local adjustments
  calculateRetroactivePoints: (uid: string) => Promise<number>; // new function for retroactive points
  clearRetroactiveNotification: () => void; // clear notification
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,
  retroactivePointsNotification: null,

  loadUser: async (uid: string) => {
    if (!uid) return;
    set({ isLoading: true, error: null });
    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { uid, points: 0, retroactivePointsAwarded: false });
        set({ profile: { uid, points: 0 }, isLoading: false });
        // Automatically calculate retroactive points for new users
        setTimeout(() => get().calculateRetroactivePoints(uid), 1000);
        return;
      }
      const data = snap.data() as any;
      set({ profile: { uid, points: data.points ?? 0, displayName: data.displayName, email: data.email }, isLoading: false });
      
      // Automatically calculate retroactive points if not already awarded
      if (!data.retroactivePointsAwarded) {
        console.log('[RETROACTIVE POINTS] Auto-calculating for user:', uid);
        setTimeout(() => get().calculateRetroactivePoints(uid), 1000);
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to load user profile', isLoading: false });
    }
  },

  ensureUserDoc: async (uid: string) => {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { uid, points: 0, retroactivePointsAwarded: false });
    }
  },

  incrementPoints: async (uid: string, delta: number) => {
    if (!uid) return;
    try {
      if (uid === 'demo-user') {
        const current = get().profile?.points ?? 0;
        set({ profile: { uid, points: current + delta } as UserProfile });
        return;
      }
      await get().ensureUserDoc(uid);
      const ref = doc(db, 'users', uid);
      await updateDoc(ref, { points: increment(delta) });
      const current = get().profile?.points ?? 0;
      set({ profile: { ...(get().profile || { uid, points: 0 }), points: current + delta } as UserProfile });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update points' });
    }
  },

  spendPoints: async (uid: string, delta: number) => {
    if (!uid) return;
    const current = get().profile?.points ?? 0;
    if (current < delta) throw new Error('Not enough points');
    try {
      if (uid === 'demo-user') {
        set({ profile: { uid, points: current - delta } as UserProfile });
        return;
      }
      const ref = doc(db, 'users', uid);
      await updateDoc(ref, { points: increment(-delta) });
      set({ profile: { ...(get().profile || { uid, points: 0 }), points: current - delta } as UserProfile });
    } catch (error: any) {
      set({ error: error.message || 'Failed to spend points' });
    }
  },

  setLocalPoints: (points: number) => {
    const uid = get().profile?.uid || 'demo-user';
    set({ profile: { uid, points } as UserProfile });
  },

  calculateRetroactivePoints: async (uid: string) => {
    if (!uid) return 0;
    try {
      console.log('[RETROACTIVE POINTS] Starting calculation for user:', uid);
      
      // Check if user has already received retroactive points
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { uid, points: 0, retroactivePointsAwarded: false });
        return 0;
      }
      
      const data = snap.data() as any;
      
      // If retroactive points were already awarded, don't award again
      if (data.retroactivePointsAwarded) {
        console.log('[RETROACTIVE POINTS] Already awarded for user:', uid);
        return 0;
      }
      
      let totalRetroactivePoints = 0;
      
      // Count existing journal entries (5 points each)
      try {
        const { getDocs, collection, query, where } = await import('firebase/firestore');
        const entriesQuery = query(collection(db, 'entries'), where('userId', '==', uid));
        const entriesSnapshot = await getDocs(entriesQuery);
        const entryCount = entriesSnapshot.size;
        const entryPoints = entryCount * 5;
        totalRetroactivePoints += entryPoints;
        console.log('[RETROACTIVE POINTS] Found', entryCount, 'journal entries, awarding', entryPoints, 'points');
      } catch (error) {
        console.error('[RETROACTIVE POINTS] Error counting journal entries:', error);
      }
      
      // Count existing time capsules (10 points each)
      try {
        const { getDocs, collection, query, where } = await import('firebase/firestore');
        const capsulesQuery = query(collection(db, 'timeCapsules'), where('userId', '==', uid));
        const capsulesSnapshot = await getDocs(capsulesQuery);
        const capsuleCount = capsulesSnapshot.size;
        const capsulePoints = capsuleCount * 10;
        totalRetroactivePoints += capsulePoints;
        console.log('[RETROACTIVE POINTS] Found', capsuleCount, 'time capsules, awarding', capsulePoints, 'points');
      } catch (error) {
        console.error('[RETROACTIVE POINTS] Error counting time capsules:', error);
      }
      
      if (totalRetroactivePoints > 0) {
        // Award the retroactive points
        await updateDoc(ref, { 
          points: increment(totalRetroactivePoints),
          retroactivePointsAwarded: true 
        });
        
        // Update local state
        const currentProfile = get().profile;
        if (currentProfile) {
          set({ 
            profile: { 
              ...currentProfile, 
              points: currentProfile.points + totalRetroactivePoints 
            },
            retroactivePointsNotification: `🎉 Awarded ${totalRetroactivePoints} retroactive points for your existing content!`
          });
        }
        
        console.log('[RETROACTIVE POINTS] Awarded', totalRetroactivePoints, 'retroactive points to user:', uid);
      }
      
      return totalRetroactivePoints;
    } catch (error: any) {
      console.error('[RETROACTIVE POINTS] Failed to calculate retroactive points:', error);
      return 0;
    }
  },

  clearRetroactiveNotification: () => {
    set({ retroactivePointsNotification: null });
  }
}));


