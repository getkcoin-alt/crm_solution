import { create } from 'zustand';
import type { CallDirection, Disposition, EntityRef } from '@/types';
import { ME, resolveRef, useCRM } from './crm';
import { usePrefs } from './prefs';
import { toast } from './ui';

export type PhoneStatus = 'idle' | 'dialing' | 'ringing' | 'connected' | 'wrap-up';

export interface CallTarget { name: string; subtitle?: string; phone: string; ref?: EntityRef; hue?: number }

interface Phone {
  status: PhoneStatus;
  direction: CallDirection;
  target: CallTarget | null;
  requestedAt: number;
  connectedAt: number;
  endedAt: number;
  muted: boolean;
  onHold: boolean;
  recording: boolean;
  keypad: boolean;
  minimized: boolean;
  notes: string;
  transcript: { who: 'rep' | 'them'; text: string; at: number }[];
  dtmf: string;
  answered: boolean;

  dial: (t: CallTarget | EntityRef) => void;
  simulateIncoming: (t?: CallTarget | EntityRef) => void;
  answer: () => void;
  decline: () => void;
  hangup: () => void;
  set: (p: Partial<Phone>) => void;
  pushTranscript: (line: { who: 'rep' | 'them'; text: string }) => void;
  completeWrapUp: (o: { disposition: Disposition; notes: string; followUp?: { title: string; dueAt: number } }) => void;
  discardWrapUp: () => void;
}

let connectTimer: ReturnType<typeof setTimeout> | undefined;

const toTarget = (t: CallTarget | EntityRef): CallTarget | null => {
  if ('type' in t) {
    const p = resolveRef(t);
    return p ? { name: p.name, subtitle: p.subtitle, phone: p.phone, ref: t, hue: p.hue } : null;
  }
  return t;
};

const reset = { muted: false, onHold: false, keypad: false, minimized: false, notes: '', transcript: [], dtmf: '', answered: false };

export const usePhone = create<Phone>()((set, get) => ({
  status: 'idle',
  direction: 'outbound',
  target: null,
  requestedAt: 0,
  connectedAt: 0,
  endedAt: 0,
  recording: true,
  ...reset,

  dial: (t) => {
    if (get().status !== 'idle') { toast({ title: 'You are already on a call', body: 'End or wrap up the current call first.' }); return; }
    const target = toTarget(t);
    if (!target) return;
    set({ ...reset, status: 'dialing', direction: 'outbound', target, requestedAt: Date.now(), recording: usePrefs.getState().recordCalls });
    clearTimeout(connectTimer);
    connectTimer = setTimeout(() => {
      if (get().status === 'dialing') set({ status: 'connected', connectedAt: Date.now(), answered: true });
    }, 3200);
  },
  simulateIncoming: (t) => {
    if (get().status !== 'idle') return;
    let target = t ? toTarget(t) : null;
    if (!target) {
      const s = useCRM.getState();
      const hot = s.leads.filter((l) => l.score > 70 && l.status !== 'Unqualified');
      const l = hot[Math.floor(Math.random() * hot.length)] ?? s.leads[0]!;
      target = toTarget({ type: 'lead', id: l.id });
    }
    set({ ...reset, status: 'ringing', direction: 'inbound', target, requestedAt: Date.now(), recording: usePrefs.getState().recordCalls });
  },
  answer: () => set({ status: 'connected', connectedAt: Date.now(), answered: true, minimized: false }),
  decline: () => {
    const { target } = get();
    if (target?.ref)
      useCRM.getState().logCall({ direction: 'inbound', status: 'missed', ref: target.ref, repId: ME, phone: target.phone, startedAt: get().requestedAt, duration: 0, recorded: false, disposition: 'No answer', notes: 'Declined — sent “I’ll call you back” SMS.' });
    toast({ title: 'Call declined', body: `Quick reply sent to ${target?.name ?? 'caller'}: “In a meeting — I’ll call you back shortly.”` });
    set({ status: 'idle', target: null });
  },
  hangup: () => {
    clearTimeout(connectTimer);
    const s = get();
    if (s.status === 'dialing') { set({ status: 'wrap-up', endedAt: Date.now(), answered: false }); return; }
    set({ status: 'wrap-up', endedAt: Date.now(), keypad: false, minimized: false });
  },
  set: (p) => set(p),
  pushTranscript: (line) => set((s) => ({ transcript: [...s.transcript, { ...line, at: Date.now() }] })),
  completeWrapUp: ({ disposition, notes, followUp }) => {
    const s = get();
    const t = s.target;
    if (t?.ref) {
      const duration = s.answered ? Math.max(1, Math.round((s.endedAt - s.connectedAt) / 1000)) : 0;
      const status = s.answered ? 'completed' : disposition === 'Left voicemail' ? 'voicemail' : 'no-answer';
      const crm = useCRM.getState();
      crm.logCall({
        direction: s.direction, status, ref: t.ref, repId: ME, phone: t.phone, startedAt: s.requestedAt, duration,
        recorded: s.answered && s.recording, disposition, notes,
        sentiment: s.answered ? (disposition === 'Not interested' ? 'negative' : disposition === 'Call back later' ? 'neutral' : 'positive') : undefined,
        summary: s.answered && s.transcript.length > 3 ? 'Prospect confirmed ~40 seats and a key pain around manual call logging. Requirements: SSO and audit trail. Next step: technical demo with IT on Thursday at 2pm; send Enterprise proposal today.' : undefined,
      });
      if (followUp) crm.addTask({ title: followUp.title, type: 'Call', dueAt: followUp.dueAt, priority: 'High', ownerId: ME, ref: t.ref, durationMin: 15 });
      toast({ tone: 'success', title: 'Call logged', body: `${disposition}${followUp ? ' · follow-up scheduled' : ''} — added to ${t.name}’s timeline.` });
    }
    set({ status: 'idle', target: null, ...reset });
  },
  discardWrapUp: () => set({ status: 'idle', target: null, ...reset }),
}));
