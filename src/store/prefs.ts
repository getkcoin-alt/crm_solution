import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Currency } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';
interface Prefs {
  theme: Theme;
  currency: Currency;
  sidebarCollapsed: boolean;
  recordCalls: boolean;
  liveTranscript: boolean;
  setTheme: (t: Theme) => void;
  setCurrency: (c: Currency) => void;
  toggleSidebar: () => void;
  set: (p: Partial<Omit<Prefs, 'set'>>) => void;
}

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      theme: 'system',
      currency: 'USD',
      sidebarCollapsed: false,
      recordCalls: true,
      liveTranscript: true,
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      set: (p) => set(p),
    }),
    { name: 'leadvico-prefs' },
  ),
);

export function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}
