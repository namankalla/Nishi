import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeType = 'sunset' | 'ocean' | 'forest' | 'lavender' | 'autumn' | 'midnight';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
}

interface ThemeState {
  currentTheme: ThemeType;
  customWallpaper: string | null;
  setTheme: (theme: ThemeType) => void;
  setCustomWallpaper: (wallpaper: string | null) => void;
  getThemeColors: () => ThemeColors;
  getThemeClasses: () => {
    background: string;
    text: string;
    accent: string;
    card: string;
    font: string;
  };
}

const themes: Record<ThemeType, ThemeColors> = {
  sunset: {
    primary: '#FFE16D',
    secondary: '#6EABC6',
    accent: '#253E4C',
    background: 'bg-gradient-to-br from-yellow-50 to-orange-50',
    surface: 'bg-white',
    text: 'text-slate-800',
    textSecondary: 'text-slate-600'
  },
  ocean: {
    primary: '#6EABC6',
    secondary: '#FFE16D',
    accent: '#253E4C',
    background: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    surface: 'bg-white',
    text: 'text-slate-800',
    textSecondary: 'text-slate-600'
  },
  forest: {
    primary: '#4ADE80',
    secondary: '#FFE16D',
    accent: '#253E4C',
    background: 'bg-gradient-to-br from-green-50 to-emerald-50',
    surface: 'bg-white',
    text: 'text-slate-800',
    textSecondary: 'text-slate-600'
  },
  lavender: {
    primary: '#C084FC',
    secondary: '#FFE16D',
    accent: '#253E4C',
    background: 'bg-gradient-to-br from-purple-50 to-pink-50',
    surface: 'bg-white',
    text: 'text-slate-800',
    textSecondary: 'text-slate-600'
  },
  autumn: {
    primary: '#FB923C',
    secondary: '#6EABC6',
    accent: '#253E4C',
    background: 'bg-gradient-to-br from-orange-50 to-red-50',
    surface: 'bg-white',
    text: 'text-slate-800',
    textSecondary: 'text-slate-600'
  },
  midnight: {
    primary: '#253E4C',
    secondary: '#6EABC6',
    accent: '#FFE16D',
    background: 'bg-gradient-to-br from-slate-900 to-slate-800',
    surface: 'bg-slate-800',
    text: 'text-white',
    textSecondary: 'text-slate-300'
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: 'sunset',
      customWallpaper: null,

      setTheme: (theme: ThemeType) => {
        set({ currentTheme: theme });
      },

      setCustomWallpaper: (wallpaper: string | null) => {
        set({ customWallpaper: wallpaper });
      },

      getThemeColors: () => {
        const { currentTheme } = get();
        return themes[currentTheme];
      },

      getThemeClasses: () => {
        const { currentTheme } = get();
        const theme = themes[currentTheme];
        
        return {
          background: theme.background,
          text: theme.text,
          accent: `text-[${theme.primary}]`,
          card: theme.surface,
          font: 'font-sans'
        };
      }
    }),
    {
      name: 'nishi-theme-storage'
    }
  )
);