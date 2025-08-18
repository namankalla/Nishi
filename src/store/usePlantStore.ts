import { create } from 'zustand';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format, differenceInCalendarDays } from 'date-fns';
import { useUserStore } from './useUserStore';

export interface Plant {
  id: string;
  userId: string;
  species: string;
  name: string;
  createdAt: string; // yyyy-MM-dd
  lastWateredOn: string; // yyyy-MM-dd
  growthDays: number;
  isDead: boolean;
  isTransplanted: boolean;
  transplantedAt?: string; // yyyy-MM-dd
  recoveredOn?: string; // yyyy-MM-dd, allows one watering after recovery
  waterCountOn?: string; // legacy yyyy-MM-dd (not used for cap)
  waterCountDay?: number; // 1..28 day index for the cap
  waterCount?: number; // number of times watered on waterCountDay
}

interface PlantComputed {
  missedDays: number;
  canWater: boolean;
  isDead: boolean;
}

interface PlantState {
  plants: Plant[];
  currentPlant: Plant | null;
  isLoading: boolean;
  error: string | null;
  loadPlants: (userId: string) => Promise<void>;
  loadPlant: (plantId: string) => Promise<void>;
  createPlant: (userId: string, species?: string, name?: string) => Promise<Plant>;
  getStatus: (plant: Plant, today?: Date) => PlantComputed;
  recoverMissedDays: (plantId: string) => Promise<void>;
  waterToday: (plantId: string, dayIndexOverride?: number) => Promise<void>;
  transplantPlant: (plantId: string) => Promise<void>;
  updatePlantName: (plantId: string, name: string) => Promise<void>;
  deletePlant: (plantId: string) => Promise<void>;
}

const todayStr = (d: Date = new Date()) => format(d, 'yyyy-MM-dd');

function computeDayIndex(now: Date, createdAt: string): number {
  const base = differenceInCalendarDays(now, new Date(createdAt)) + 1; // start at day 1
  return Math.max(1, Math.min(28, base));
}

export const usePlantStore = create<PlantState>((set, get) => ({
  plants: [],
  currentPlant: null,
  isLoading: false,
  error: null,

  loadPlants: async (userId: string) => {
    if (!userId) return;
    set({ isLoading: true, error: null });
    try {
      const q = query(collection(db, 'plants'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const plants: Plant[] = [];
      querySnapshot.forEach((doc) => {
        plants.push({ id: doc.id, ...doc.data() } as Plant);
      });
      set({ plants, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load plants', isLoading: false });
    }
  },

  loadPlant: async (plantId: string) => {
    if (!plantId) return;
    set({ isLoading: true, error: null });
    try {
      const ref = doc(db, 'plants', plantId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        set({ currentPlant: null, isLoading: false });
        return;
      }
      const plant = { id: snap.id, ...snap.data() } as Plant;
      set({ currentPlant: plant, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load plant', isLoading: false });
    }
  },

      createPlant: async (userId: string, species: string = 'monstera', name: string = 'My Plant') => {
    const created = todayStr();
    const plantData = {
      userId,
      species,
      name,
      createdAt: created,
      lastWateredOn: created,
      growthDays: 0,
      isDead: false,
      isTransplanted: false,
      recoveredOn: '',
      waterCountOn: created,
      waterCountDay: 1,
      waterCount: 0
    };
    const plantRef = doc(collection(db, 'plants'));
    await setDoc(plantRef, plantData);
    const newPlant: Plant = { id: plantRef.id, ...plantData };
    
    // Update local state
    set(state => ({
      plants: [...state.plants, newPlant],
      currentPlant: newPlant
    }));
    
    return newPlant;
  },

  getStatus: (plant: Plant, now: Date = new Date()) => {
    if (!plant) return { missedDays: 0, canWater: false, isDead: false };
    // Transplanted plants are considered fully grown and require no watering.
    // Hide all watering logic by reporting zero missed days and no watering capability.
    if (plant.isTransplanted) {
      return { missedDays: 0, canWater: false, isDead: false };
    }
    const last = new Date(plant.lastWateredOn);
    const missedDays = Math.max(0, differenceInCalendarDays(now, last));
    const wateredToday = format(now, 'yyyy-MM-dd') === plant.lastWateredOn;
    const isDead = plant.isDead || missedDays >= 10;
    const recoveredToday = plant.recoveredOn === todayStr(now);

    // Use on-screen day index for cap
    const dayIndex = computeDayIndex(now, plant.createdAt);
    const countToday = plant.waterCountDay === dayIndex ? (plant.waterCount || 0) : 0;
    const underLimit = countToday < 5;

    // Policy:
    // - If recovered today -> can water once even if already marked as watered today, and still capped by daily limit
    // - Else if missedDays >= 2 -> must recover first (cannot water)
    // - Else (missedDays <= 1) -> can water if under daily limit and not already watered today
    const canWater = !isDead && underLimit && (
      recoveredToday || (missedDays <= 1 && !wateredToday)
    );
    return { missedDays, canWater, isDead };
  },

  recoverMissedDays: async (plantId: string) => {
    const plant = get().currentPlant;
    if (!plant) throw new Error('No plant');
    // No recovery for transplanted plants
    if (plant.isTransplanted) return;
    const { missedDays, isDead } = get().getStatus(plant);
    if (isDead) throw new Error('Plant is dead');
    if (missedDays <= 0) return;
    // Spend points
    await useUserStore.getState().spendPoints(plant.userId, missedDays);
    const now = new Date();
    const today = todayStr(now);
    const dayIndex = computeDayIndex(now, plant.createdAt);
    // Mark as recovered up to today and allow one watering today
    const updated: Plant = { 
      ...plant, 
      lastWateredOn: today, 
      recoveredOn: today,
      waterCountDay: dayIndex,
      // keep current count for that day index
      waterCount: plant.waterCountDay === dayIndex ? (plant.waterCount || 0) : 0
    };
    await setDoc(doc(db, 'plants', plantId), updated, { merge: false });
    set(state => ({
      currentPlant: updated,
      plants: state.plants.map(p => p.id === plantId ? updated : p)
    }));
  },

  waterToday: async (plantId: string, dayIndexOverride?: number) => {
    const plant = get().currentPlant;
    if (!plant) throw new Error('No plant');
    // Transplanted plants do not require watering; skip silently.
    if (plant.isTransplanted) return;
    const now = new Date();
    const today = todayStr(now);

    const missedDays = Math.max(0, differenceInCalendarDays(now, new Date(plant.lastWateredOn)));
    // const wateredToday = today === plant.lastWateredOn; // not used anymore
    const recoveredToday = plant.recoveredOn === today;

    if (plant.isDead || missedDays >= 10) throw new Error('Plant is dead');

    // Determine on-screen day index for daily cap
    const dayIndex = Math.max(1, Math.min(28, dayIndexOverride ?? computeDayIndex(now, plant.createdAt)));
    const countToday = plant.waterCountDay === dayIndex ? (plant.waterCount || 0) : 0;
    if (countToday >= 5) {
      throw new Error('Already watered 5 times today');
    }

    // Enforce recovery policy
    if (!recoveredToday) {
      if (missedDays >= 2) throw new Error('Recover missed days first');
    }

    const updated: Plant = {
      ...plant,
      lastWateredOn: today,
      // growthDays not incremented; visual growth is by calendar days since createdAt
      growthDays: plant.growthDays,
      recoveredOn: '',
      waterCountDay: dayIndex,
      waterCount: countToday + 1
    };
    await setDoc(doc(db, 'plants', plantId), updated, { merge: false });
    set(state => ({
      currentPlant: updated,
      plants: state.plants.map(p => p.id === plantId ? updated : p)
    }));
  },

  transplantPlant: async (plantId: string) => {
    const plant = get().currentPlant;
    if (!plant) throw new Error('No plant');
    
    const transplanted = todayStr();
    const updated: Plant = {
      ...plant,
      isTransplanted: true,
      transplantedAt: transplanted,
      createdAt: transplanted,
      lastWateredOn: transplanted,
      growthDays: 0,
      isDead: false,
      recoveredOn: '',
      waterCountOn: transplanted,
      waterCountDay: 1,
      waterCount: 0
    };
    await setDoc(doc(db, 'plants', plantId), updated, { merge: false });
    set(state => ({
      currentPlant: updated,
      plants: state.plants.map(p => p.id === plantId ? updated : p)
    }));
  },

  updatePlantName: async (plantId: string, name: string) => {
    const plant = get().currentPlant;
    if (!plant) throw new Error('No plant');
    
    const updated: Plant = {
      ...plant,
      name: name.trim() || 'My Plant'
    };
    await setDoc(doc(db, 'plants', plantId), updated, { merge: false });
    set(state => ({
      currentPlant: updated,
      plants: state.plants.map(p => p.id === plantId ? updated : p)
    }));
  },

  deletePlant: async (plantId: string) => {
    await deleteDoc(doc(db, 'plants', plantId));
    set(state => ({
      plants: state.plants.filter(p => p.id !== plantId),
      currentPlant: state.currentPlant?.id === plantId ? null : state.currentPlant
    }));
  }
}));


