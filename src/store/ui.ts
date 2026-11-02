import { create } from 'zustand';
import type { EntityRef } from '@/types';

export interface Toast { id: number; title: string; body?: string; tone?: 'default' | 'success' | 'danger'; action?: { label: string; onClick: () => void } }

type Modal =
  | { kind: 'lead' }
  | { kind: 'deal'; leadId?: string }
  | { kind: 'task'; ref?: EntityRef; type?: string }
  | { kind: 'contact' }
  | null;

interface UI {
  toasts: Toast[];
  cmdk: boolean;
  mobileNav: boolean;
  modal: Modal;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
  setCmdk: (v: boolean) => void;
  setMobileNav: (v: boolean) => void;
  open: (m: Modal) => void;
}

let n = 0;
export const useUI = create<UI>()((set) => ({
  toasts: [],
  cmdk: false,
  mobileNav: false,
  modal: null,
  toast: (t) => {
    const id = ++n;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  setCmdk: (cmdk) => set({ cmdk }),
  setMobileNav: (mobileNav) => set({ mobileNav }),
  open: (modal) => set({ modal }),
}));

export const toast = (t: Omit<Toast, 'id'>) => useUI.getState().toast(t);
