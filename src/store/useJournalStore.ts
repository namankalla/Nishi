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
  Timestamp,
  setDoc,
  getDoc,
  deleteDoc as deleteFirestoreDoc,
  doc as firestoreDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useUserStore } from './useUserStore';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tags: string[];
  attachments: string[];
  mood?: string;
  weather?: string;
  mediaElements?: any[];
  stickies?: any[];
  drawingData?: any;
}

interface JournalState {
  entries: JournalEntry[];
  currentEntry: JournalEntry | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedDate: Date;
  
  // Actions
  loadEntries: (userId: string) => Promise<void>;
  createEntry: (userId: string, entry: Partial<JournalEntry>) => Promise<void>;
  updateEntry: (entryId: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  setCurrentEntry: (entry: JournalEntry | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedDate: (date: Date) => void;
  getFilteredEntries: () => JournalEntry[];
  getEntryByDate: (date: Date) => JournalEntry | null;
  clearError: () => void;
  clearEntries: () => void;
}

export const useJournalStore = create<JournalState & {
  saveDraft: (userId: string, draftId: string, data: any) => Promise<void>;
  loadDraft: (userId: string, draftId: string) => Promise<any | null>;
  deleteDraft: (userId: string, draftId: string) => Promise<void>;
}>(
  (set, get) => ({
  entries: [],
  currentEntry: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedDate: new Date(),

  loadEntries: async (userId: string) => {
    if (!userId) return;
    set({ isLoading: true, error: null });
    try {
      console.log('[NISHI DEBUG] loadEntries userId:', userId);
      // Try without orderBy first
      const q = query(
        collection(db, 'entries'),
        where('userId', '==', userId)
        // orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      console.log('[NISHI DEBUG] Firestore returned', querySnapshot.size, 'docs');
      const entries: JournalEntry[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('[NISHI DEBUG] Entry doc:', doc.id, data);
        console.log('[NISHI DEBUG] Media elements in doc:', data.mediaElements);
        console.log('[NISHI DEBUG] Stickies in doc:', data.stickies);
        entries.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : data.date,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
        } as JournalEntry);
      });
      set({ entries, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to load entries', 
        isLoading: false 
      });
    }
  },

  createEntry: async (userId: string, entryData: Partial<JournalEntry>) => {
    set({ isLoading: true, error: null });
    
    try {
      const now = new Date();
      const entry = {
        title: entryData.title || 'Untitled Entry',
        content: entryData.content || '',
        date: entryData.date || now,
        createdAt: now,
        updatedAt: now,
        userId,
        tags: entryData.tags || [],
        attachments: entryData.attachments || [],
        mood: entryData.mood,
        weather: entryData.weather,
        mediaElements: entryData.mediaElements || [],
        stickies: entryData.stickies || [],
        drawingData: entryData.drawingData
      };
      
      console.log('[NISHI DEBUG] Creating entry with data:', entry);
      
      if (userId === 'demo-user') {
        const newEntry: JournalEntry = {
          id: Date.now().toString(),
          ...entry
        };
        
        set(state => ({
          entries: [newEntry, ...state.entries],
          currentEntry: newEntry,
          isLoading: false
        }));
        // Award points for demo user
        try { useUserStore.getState().incrementPoints(userId, 5); } catch {}
        return;
      }
      
      const docRef = await addDoc(collection(db, 'entries'), {
        ...entry,
        date: Timestamp.fromDate(entry.date),
        createdAt: Timestamp.fromDate(entry.createdAt),
        updatedAt: Timestamp.fromDate(entry.updatedAt)
      });
      
      const newEntry: JournalEntry = {
        id: docRef.id,
        ...entry
      };
      
      set(state => ({
        entries: [newEntry, ...state.entries],
        currentEntry: newEntry,
        isLoading: false
      }));
      // Award points
      try { useUserStore.getState().incrementPoints(userId, 5); } catch {}
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to create entry', 
        isLoading: false 
      });
    }
  },

  updateEntry: async (entryId: string, updates: Partial<JournalEntry>) => {
    set({ isLoading: true, error: null });
    
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      // Handle demo user
      if (get().entries.find(e => e.id === entryId && e.userId === 'demo-user')) {
        set(state => ({
          entries: state.entries.map(entry =>
            entry.id === entryId ? { ...entry, ...updateData } : entry
          ),
          currentEntry: state.currentEntry?.id === entryId 
            ? { ...state.currentEntry, ...updateData }
            : state.currentEntry,
          isLoading: false
        }));
        return;
      }
      
      await updateDoc(doc(db, 'entries', entryId), {
        ...updateData,
        updatedAt: Timestamp.fromDate(updateData.updatedAt!)
      });
      
      set(state => ({
        entries: state.entries.map(entry =>
          entry.id === entryId ? { ...entry, ...updateData } : entry
        ),
        currentEntry: state.currentEntry?.id === entryId 
          ? { ...state.currentEntry, ...updateData }
          : state.currentEntry,
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to update entry', 
        isLoading: false 
      });
    }
  },

  deleteEntry: async (entryId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Handle demo user
      if (get().entries.find(e => e.id === entryId && e.userId === 'demo-user')) {
        set(state => ({
          entries: state.entries.filter(entry => entry.id !== entryId),
          currentEntry: state.currentEntry?.id === entryId ? null : state.currentEntry,
          isLoading: false
        }));
        return;
      }
      
      await deleteDoc(doc(db, 'entries', entryId));
      
      set(state => ({
        entries: state.entries.filter(entry => entry.id !== entryId),
        currentEntry: state.currentEntry?.id === entryId ? null : state.currentEntry,
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to delete entry', 
        isLoading: false 
      });
    }
  },

  setCurrentEntry: (entry: JournalEntry | null) => {
    set({ currentEntry: entry });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
  },

  getFilteredEntries: () => {
    const { entries, searchQuery } = get();
    
    if (!searchQuery.trim()) {
      return entries;
    }
    
    const query = searchQuery.toLowerCase();
    return entries.filter(entry =>
      entry.title.toLowerCase().includes(query) ||
      entry.content.toLowerCase().includes(query) ||
      entry.tags.some(tag => tag.toLowerCase().includes(query))
    );
  },

  getEntryByDate: (date: Date) => {
    const { entries } = get();
    return entries.find(entry => 
      entry.date.toDateString() === date.toDateString()
    ) || null;
  },

  clearError: () => set({ error: null }),

  clearEntries: () => set({ entries: [] }),

  saveDraft: async (userId: string, draftId: string, data: any) => {
    if (!userId || !draftId) return;
    const ref = firestoreDoc(db, 'drafts', `${userId}-${draftId}`);
    await setDoc(ref, { ...data, userId, draftId, updatedAt: new Date() });
  },

  loadDraft: async (userId: string, draftId: string) => {
    if (!userId || !draftId) return null;
    const ref = firestoreDoc(db, 'drafts', `${userId}-${draftId}`);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
    return null;
  },

  deleteDraft: async (userId: string, draftId: string) => {
    if (!userId || !draftId) return;
    const ref = firestoreDoc(db, 'drafts', `${userId}-${draftId}`);
    await deleteFirestoreDoc(ref);
  }
}));