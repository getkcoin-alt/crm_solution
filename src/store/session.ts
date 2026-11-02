import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CURRENT_USER_ID } from '@/data/seed';
import type { Role } from '@/types';
import { setME } from './crm';

export type PermKey = 'viewAllLeads' | 'editOthers' | 'delete' | 'export' | 'managePipeline' | 'recordings' | 'monitor' | 'teamReports' | 'manageUsers';

export const PERMISSIONS: { key: PermKey; label: string; desc: string }[] = [
  { key: 'viewAllLeads', label: 'View all leads', desc: 'See leads owned by anyone, not just their scope' },
  { key: 'editOthers', label: 'Edit & reassign others’ records', desc: 'Change owner and edit records they don’t own' },
  { key: 'delete', label: 'Delete records', desc: 'Delete leads and tasks' },
  { key: 'export', label: 'Export data', desc: 'Download CSV exports' },
  { key: 'managePipeline', label: 'Manage pipeline stages', desc: 'Edit stages and win probabilities' },
  { key: 'recordings', label: 'Listen to teammates’ recordings', desc: 'Own recordings are always available' },
  { key: 'monitor', label: 'Live call monitoring', desc: 'Listen in and whisper-coach live calls' },
  { key: 'teamReports', label: 'View team reports', desc: 'Access the Reports area' },
  { key: 'manageUsers', label: 'Manage users, telephony & billing', desc: 'Workspace administration' },
];

const all = (v: boolean) => Object.fromEntries(PERMISSIONS.map((p) => [p.key, v])) as Record<PermKey, boolean>;
export const DEFAULT_MATRIX: Record<Role, Record<PermKey, boolean>> = {
  Admin: all(true),
  'Sales Manager': { ...all(false), editOthers: true, export: true, managePipeline: true, recordings: true, monitor: true, teamReports: true },
  'Account Executive': { ...all(false), export: true },
  SDR: all(false),
};

export const PERSONAS: { repId: string; blurb: string; email: string }[] = [
  { repId: 'rep_aisha', blurb: 'Full access — every team, settings, telephony & billing', email: 'aisha@leadvico.com' },
  { repId: 'rep_daniel', blurb: 'Enterprise team — pipeline, forecast & live coaching', email: 'daniel@leadvico.com' },
  { repId: 'rep_marcus', blurb: 'Own deals, leads, calls & personal quota', email: 'marcus@leadvico.com' },
  { repId: 'rep_zara', blurb: 'Prospecting — power dialer, new leads & meetings', email: 'zara@leadvico.com' },
];

interface Session {
  viewAs: string;
  signedIn: boolean;
  matrix: Record<Role, Record<PermKey, boolean>>;
  switchTo: (repId: string) => void;
  signOut: () => void;
  setPerm: (role: Role, key: PermKey, v: boolean) => void;
  resetMatrix: () => void;
}

export const useSession = create<Session>()(
  persist(
    (set) => ({
      viewAs: CURRENT_USER_ID,
      signedIn: true,
      matrix: DEFAULT_MATRIX,
      switchTo: (repId) => { setME(repId); set({ viewAs: repId, signedIn: true }); },
      signOut: () => set({ signedIn: false }),
      setPerm: (role, key, v) => set((s) => ({ matrix: { ...s.matrix, [role]: { ...s.matrix[role], [key]: v } } })),
      resetMatrix: () => set({ matrix: DEFAULT_MATRIX }),
    }),
    { name: 'leadvico-session', version: 1 },
  ),
);

// Align the CRM's "current user" with the persisted session on load.
setME(useSession.getState().viewAs);
