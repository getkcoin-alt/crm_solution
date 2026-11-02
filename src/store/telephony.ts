import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { providerById, type CallMode, type ProviderId, type ProviderNumber } from '@/data/providers';

/**
 * Telephony integration state. In this prototype credentials never leave the
 * browser and are not stored — only the non-secret connection summary is kept.
 */
interface Telephony {
  provider: ProviderId | null;
  accountLabel: string;
  connectedAt: number;
  numbers: ProviderNumber[];
  defaultNumber: string | null;
  mode: CallMode;
  myMobile: string | null;
  mobileVerified: boolean;
  wizard: boolean;
  wizardProvider: ProviderId | null;

  openWizard: (p?: ProviderId) => void;
  closeWizard: () => void;
  connect: (o: { provider: ProviderId; accountLabel: string; numbers: ProviderNumber[]; defaultNumber: string; mode: CallMode; myMobile: string | null }) => void;
  disconnect: () => void;
  set: (p: Partial<Telephony>) => void;
}

export const useTelephony = create<Telephony>()(
  persist(
    (set) => ({
      provider: null,
      accountLabel: '',
      connectedAt: 0,
      numbers: [],
      defaultNumber: null,
      mode: 'bridge',
      myMobile: null,
      mobileVerified: false,
      wizard: false,
      wizardProvider: null,
      openWizard: (p) => set({ wizard: true, wizardProvider: p ?? null }),
      closeWizard: () => set({ wizard: false, wizardProvider: null }),
      connect: (o) => set({ ...o, connectedAt: Date.now(), mobileVerified: !!o.myMobile }),
      disconnect: () => set({ provider: null, accountLabel: '', connectedAt: 0, numbers: [], defaultNumber: null }),
      set: (p) => set(p),
    }),
    { name: 'leadvico-telephony', partialize: (s) => ({ provider: s.provider, accountLabel: s.accountLabel, connectedAt: s.connectedAt, numbers: s.numbers, defaultNumber: s.defaultNumber, mode: s.mode, myMobile: s.myMobile, mobileVerified: s.mobileVerified }) },
  ),
);

export const useActiveProvider = () => providerById(useTelephony((s) => s.provider));
