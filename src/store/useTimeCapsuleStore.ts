import { create } from 'zustand';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useUserStore } from './useUserStore';

export interface TimeCapsule {
  id: string;
  title: string;
  content: string;
  openDate: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  mood?: string;
  weather?: string;
  mediaElements?: any[];
  stickies?: any[];
  drawingData?: any;
  isOpened?: boolean;
}

interface TimeCapsuleState {
  capsules: TimeCapsule[];
  currentCapsule: TimeCapsule | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  
  // Actions
  loadCapsules: (userId: string) => Promise<void>;
  createCapsule: (userId: string, capsule: Partial<TimeCapsule>) => Promise<void>;
  updateCapsule: (capsuleId: string, updates: Partial<TimeCapsule>) => Promise<void>;
  deleteCapsule: (capsuleId: string) => Promise<void>;
  setCurrentCapsule: (capsule: TimeCapsule | null) => void;
  setSearchQuery: (query: string) => void;
  getFilteredCapsules: () => TimeCapsule[];
  markAsOpened: (capsuleId: string) => Promise<void>;
  clearError: () => void;
  clearCapsules: () => void;
}

export const useTimeCapsuleStore = create<TimeCapsuleState>((set, get) => ({
  capsules: [],
  currentCapsule: null,
  isLoading: false,
  error: null,
  searchQuery: '',

  loadCapsules: async (userId: string) => {
    if (!userId) return;
    set({ isLoading: true, error: null });
    try {
      console.log('[TIME CAPSULE] Loading capsules for user:', userId);
      
      // First try the compound query (userId + orderBy openDate)
      try {
        const q = query(
          collection(db, 'timeCapsules'),
          where('userId', '==', userId),
          orderBy('openDate', 'asc')
        );
        const querySnapshot = await getDocs(q);
        console.log('[TIME CAPSULE] Firestore returned', querySnapshot.size, 'capsules');
        
        const capsules: TimeCapsule[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('[TIME CAPSULE] Capsule doc:', doc.id, data);
          capsules.push({
            id: doc.id,
            ...data,
            openDate: data.openDate?.toDate ? data.openDate.toDate() : data.openDate,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
          } as TimeCapsule);
        });
        set({ capsules, isLoading: false });
      } catch (indexError: any) {
        // If compound query fails due to missing index, fall back to simple query
        if (indexError.code === 'failed-precondition' || indexError.message?.includes('index')) {
          console.log('[TIME CAPSULE] Compound query failed, falling back to simple query and client-side sorting');
          
          const q = query(
            collection(db, 'timeCapsules'),
            where('userId', '==', userId)
          );
          const querySnapshot = await getDocs(q);
          console.log('[TIME CAPSULE] Firestore returned', querySnapshot.size, 'capsules (simple query)');
          
          const capsules: TimeCapsule[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('[TIME CAPSULE] Capsule doc:', doc.id, data);
            capsules.push({
              id: doc.id,
              ...data,
              openDate: data.openDate?.toDate ? data.openDate.toDate() : data.openDate,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
            } as TimeCapsule);
          });
          
          // Sort on client side
          capsules.sort((a, b) => a.openDate.getTime() - b.openDate.getTime());
          
          set({ 
            capsules, 
            isLoading: false,
            error: 'Note: Using client-side sorting. For better performance, create a Firestore composite index for userId + openDate.'
          });
        } else {
          throw indexError;
        }
      }
    } catch (error: any) {
      console.error('[TIME CAPSULE] Load error:', error);
      set({ 
        error: error.message || 'Failed to load time capsules', 
        isLoading: false 
      });
    }
  },

  createCapsule: async (userId: string, capsuleData: Partial<TimeCapsule>) => {
    set({ isLoading: true, error: null });
    
    try {
      const now = new Date();
      const capsule = {
        title: capsuleData.title || 'Untitled Time Capsule',
        content: capsuleData.content || '',
        openDate: capsuleData.openDate || new Date(),
        createdAt: now,
        updatedAt: now,
        userId,
        mood: capsuleData.mood,
        weather: capsuleData.weather,
        mediaElements: capsuleData.mediaElements || [],
        stickies: capsuleData.stickies || [],
        drawingData: capsuleData.drawingData,
        isOpened: false
      };
      
      console.log('[TIME CAPSULE] Creating capsule with data:', capsule);
      
      if (userId === 'demo-user') {
        const newCapsule: TimeCapsule = {
          id: Date.now().toString(),
          ...capsule
        };
        
        set(state => ({
          capsules: [...state.capsules, newCapsule].sort((a, b) => a.openDate.getTime() - b.openDate.getTime()),
          currentCapsule: newCapsule,
          isLoading: false
        }));
        // Award points for demo user
        try { useUserStore.getState().incrementPoints(userId, 10); } catch {}
        return;
      }
      
      const docRef = await addDoc(collection(db, 'timeCapsules'), {
        ...capsule,
        openDate: Timestamp.fromDate(capsule.openDate),
        createdAt: Timestamp.fromDate(capsule.createdAt),
        updatedAt: Timestamp.fromDate(capsule.updatedAt)
      });
      
      const newCapsule: TimeCapsule = {
        id: docRef.id,
        ...capsule
      };
      
      set(state => ({
        capsules: [...state.capsules, newCapsule].sort((a, b) => a.openDate.getTime() - b.openDate.getTime()),
        currentCapsule: newCapsule,
        isLoading: false
      }));
      // Award points
      try { useUserStore.getState().incrementPoints(userId, 10); } catch {}
    } catch (error: any) {
      console.error('[TIME CAPSULE] Create error:', error);
      set({ 
        error: error.message || 'Failed to create time capsule', 
        isLoading: false 
      });
    }
  },

  updateCapsule: async (capsuleId: string, updates: Partial<TimeCapsule>) => {
    set({ isLoading: true, error: null });
    
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      // Handle demo user
      if (get().capsules.find(c => c.id === capsuleId && c.userId === 'demo-user')) {
        set(state => ({
          capsules: state.capsules.map(capsule =>
            capsule.id === capsuleId ? { ...capsule, ...updateData } : capsule
          ).sort((a, b) => a.openDate.getTime() - b.openDate.getTime()),
          currentCapsule: state.currentCapsule?.id === capsuleId 
            ? { ...state.currentCapsule, ...updateData }
            : state.currentCapsule,
          isLoading: false
        }));
        return;
      }
      
      const updatePayload: any = { ...updateData };
      if (updateData.openDate) {
        updatePayload.openDate = Timestamp.fromDate(updateData.openDate);
      }
      if (updateData.updatedAt) {
        updatePayload.updatedAt = Timestamp.fromDate(updateData.updatedAt);
      }
      
      await updateDoc(doc(db, 'timeCapsules', capsuleId), updatePayload);
      
      set(state => ({
        capsules: state.capsules.map(capsule =>
          capsule.id === capsuleId ? { ...capsule, ...updateData } : capsule
        ).sort((a, b) => a.openDate.getTime() - b.openDate.getTime()),
        currentCapsule: state.currentCapsule?.id === capsuleId 
          ? { ...state.currentCapsule, ...updateData }
          : state.currentCapsule,
        isLoading: false
      }));
    } catch (error: any) {
      console.error('[TIME CAPSULE] Update error:', error);
      set({ 
        error: error.message || 'Failed to update time capsule', 
        isLoading: false 
      });
    }
  },

  deleteCapsule: async (capsuleId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Handle demo user
      if (get().capsules.find(c => c.id === capsuleId && c.userId === 'demo-user')) {
        set(state => ({
          capsules: state.capsules.filter(capsule => capsule.id !== capsuleId),
          currentCapsule: state.currentCapsule?.id === capsuleId ? null : state.currentCapsule,
          isLoading: false
        }));
        return;
      }
      
      await deleteDoc(doc(db, 'timeCapsules', capsuleId));
      
      set(state => ({
        capsules: state.capsules.filter(capsule => capsule.id !== capsuleId),
        currentCapsule: state.currentCapsule?.id === capsuleId ? null : state.currentCapsule,
        isLoading: false
      }));
    } catch (error: any) {
      console.error('[TIME CAPSULE] Delete error:', error);
      set({ 
        error: error.message || 'Failed to delete time capsule', 
        isLoading: false 
      });
    }
  },

  markAsOpened: async (capsuleId: string) => {
    try {
      const capsule = get().capsules.find(c => c.id === capsuleId);
      if (!capsule) return;
      
      await get().updateCapsule(capsuleId, { isOpened: true });
    } catch (error: any) {
      console.error('[TIME CAPSULE] Mark as opened error:', error);
    }
  },

  setCurrentCapsule: (capsule: TimeCapsule | null) => {
    set({ currentCapsule: capsule });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  getFilteredCapsules: () => {
    const { capsules, searchQuery } = get();
    
    if (!searchQuery.trim()) {
      return capsules;
    }
    
    const query = searchQuery.toLowerCase();
    return capsules.filter(capsule =>
      capsule.title.toLowerCase().includes(query) ||
      capsule.content.toLowerCase().includes(query)
    );
  },

  clearError: () => set({ error: null }),

  clearCapsules: () => set({ capsules: [] })
})); 