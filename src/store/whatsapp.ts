import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EntityRef } from '@/types';
import { leads, contacts, NOW } from '@/data/seed';
import { ME, useCRM, resolveRef } from './crm';
import { DAY, HOUR, MIN, uid } from '@/lib/utils';

/**
 * WhatsApp via Scriwo (scriwo.com). Scriwo links a normal WhatsApp number by QR
 * code — no Meta Business API — and exposes scoped API keys (`wpp_…`) plus
 * signed webhooks (message.received, message.status, contact.renamed).
 * In this prototype the connection and delivery receipts are simulated.
 */
export type Ack = 0 | 1 | 2 | 3; // pending · sent · delivered · read (Scriwo ACK levels)
export interface WaMessage { id: string; dir: 'in' | 'out'; text: string; at: number; ack: Ack; repId?: string; auto?: boolean }
export interface WaThread { ref: EntityRef; messages: WaMessage[]; unread: number; assignee: string | null; label?: 'Hot' | 'Follow-up' | 'Pricing' | 'Demo' }
export interface WaNumber { number: string; name: string; status: 'online' | 'offline'; linkedAt: number }

export const SCRIWO_API = 'https://app.scriwo.com';
export const SCRIWO_EVENTS = ['message.received', 'message.status', 'contact.renamed'] as const;

/* ───────────────────────── Seeded conversations ───────────────────────── */
type Line = [dir: 'in' | 'out', text: string, minsAgo: number];
const scripts: Line[][] = [
  [['out', 'Hi {first}, thanks for joining the webinar yesterday! Sharing the recording + deck 📎', 1460], ['in', 'Thanks! The calling workspace part was really interesting.', 1400], ['out', 'Glad to hear. Would a 30-min demo for your ops team help?', 1395], ['in', 'Yes — can we do Thursday 3pm?', 42], ['in', 'Also please send pricing for ~40 seats 🙏', 41]],
  [['in', 'Hello, I filled the form on your pricing page. Is there an India data-residency option?', 180], ['out', 'Hi {first}! Yes — we host in Mumbai (ap-south-1). Happy to share our security pack.', 172], ['in', 'Perfect, please send it over.', 12]],
  [['out', 'Hi {first}, following up on the proposal I emailed on Monday. Any questions?', 2900], ['in', 'Reviewing with finance this week. Can you do 10% for a 2-year term?', 300], ['out', 'Let me check with my manager and revert today.', 290]],
  [['in', 'Hi, can you share the brochure for the calling add-on?', 95], ['out', 'Sure {first} — here it is. Recording, transcription and Vico AI summaries are included.', 90], ['in', 'Great 👍', 88]],
  [['out', 'Reminder: our demo is tomorrow at 11:00 AM. Link: meet.leadvico.com/demo', 1500], ['in', 'Confirmed, I’ll bring our IT head as well.', 1490], ['in', 'Can you make it 11:30 instead?', 25]],
  [['in', 'We’re comparing you with two other vendors. What makes your dialer different?', 600], ['out', 'Great question! Calls go through your own carrier (Exotel/Twilio), every call is auto-logged with recording + AI summary, and there’s no per-minute markup.', 590]],
  [['out', 'Hi {first}, it’s been a while! We just launched WhatsApp + calling in one workspace. Worth a quick look?', 4300], ['in', 'Not right now, maybe next quarter.', 4200]],
  [['in', 'Signed the order form ✅ What are the next steps for onboarding?', 70], ['out', 'Amazing, welcome aboard {first}! 🎉 Our onboarding lead will WhatsApp you within the hour.', 66]],
  [['in', 'Is there a mobile app for the field team?', 230]],
  [['out', 'Hi {first}, sharing the ROI calculator we discussed: 26 hrs saved per rep / month.', 3000], ['in', 'This is helpful. Forwarded to our COO.', 2950], ['in', 'He wants a call this week — what times work?', 150]],
  [['in', 'Hey! Got a missed call from this number — who is this?', 18]],
  [['out', 'Thanks for your time today {first}. Recap: 40 seats, SSO + audit trail, demo with IT on Thursday.', 400], ['in', 'Correct. Looking forward to it.', 380]],
];
const labels: WaThread['label'][] = ['Demo', 'Hot', 'Pricing', undefined, 'Demo', 'Hot', undefined, undefined, 'Follow-up', 'Hot', undefined, 'Follow-up'];

function seedThreads(): WaThread[] {
  const hot = leads.filter((l) => l.status !== 'Unqualified' && l.status !== 'Converted').sort((a, b) => b.score - a.score);
  const picks: EntityRef[] = [
    ...hot.filter((_, i) => i % 3 === 0).slice(0, 9).map((l) => ({ type: 'lead' as const, id: l.id })),
    ...contacts.filter((_, i) => i % 11 === 0).slice(0, 3).map((c) => ({ type: 'contact' as const, id: c.id })),
  ];
  // Make sure every demo persona has chats in their own book.
  for (const owner of ['rep_marcus', 'rep_zara', 'rep_daniel']) {
    const l = leads.find((x) => x.ownerId === owner && x.status !== 'Unqualified' && !picks.some((p) => p.id === x.id));
    if (l) picks.splice(2, 0, { type: 'lead', id: l.id });
  }
  return picks.slice(0, scripts.length).map((ref, i) => {
    const owner = ref.type === 'lead' ? leads.find((l) => l.id === ref.id)?.ownerId : contacts.find((c) => c.id === ref.id)?.ownerId;
    const first = ref.type === 'lead' ? leads.find((l) => l.id === ref.id)!.firstName : contacts.find((c) => c.id === ref.id)!.firstName;
    const msgs = scripts[i]!.map(([dir, text, mins], k) => ({ id: `wm_${i}_${k}`, dir, text: text.replace('{first}', first), at: NOW - mins * MIN, ack: (dir === 'out' ? 3 : 0) as Ack, repId: dir === 'out' ? owner ?? undefined : undefined }));
    const trailingIn = [...msgs].reverse().findIndex((m) => m.dir === 'out');
    const unread = msgs[msgs.length - 1]!.dir === 'in' && NOW - msgs[msgs.length - 1]!.at < 3 * HOUR ? (trailingIn === -1 ? msgs.length : trailingIn) : 0;
    return { ref, messages: msgs, unread, assignee: owner ?? null, label: labels[i] };
  });
}

const autoReplies = ['Thanks! Let me check with my team and get back to you.', 'Sounds good 👍', 'Perfect, that works for us.', 'Can we do Thursday 3pm instead?', 'Got it, thank you!', 'Could you also share a case study from our industry?'];
let replyIdx = 0;

interface WhatsApp {
  connected: boolean;
  workspace: string;
  keyPrefix: string;
  connectedAt: number;
  numbers: WaNumber[];
  autoLog: boolean;
  autoCreateLeads: boolean;
  autoAssign: boolean;
  recapAfterCalls: boolean;
  wizard: boolean;
  threads: WaThread[];
  drawer: EntityRef | null;
  typing: string | null;
  connect: (o: { workspace: string; keyPrefix: string; numbers: WaNumber[] }) => void;
  disconnect: () => void;
  set: (p: Partial<WhatsApp>) => void;
  openChat: (ref: EntityRef) => void;
  send: (ref: EntityRef, text: string, opts?: { auto?: boolean; silentReply?: boolean }) => void;
  markRead: (refId: string) => void;
  broadcast: (refs: EntityRef[], template: string) => number;
}

export const useWhatsApp = create<WhatsApp>()(
  persist(
    (set, get) => ({
      connected: false,
      workspace: '',
      keyPrefix: '',
      connectedAt: 0,
      numbers: [],
      autoLog: true,
      autoCreateLeads: true,
      autoAssign: true,
      recapAfterCalls: true,
      wizard: false,
      threads: seedThreads(),
      drawer: null,
      typing: null,
      connect: (o) => set({ ...o, connected: true, connectedAt: Date.now() }),
      disconnect: () => set({ connected: false, workspace: '', keyPrefix: '', numbers: [] }),
      set: (p) => set(p),
      openChat: (ref) => { set({ drawer: ref }); get().markRead(ref.id); },
      markRead: (refId) => set((s) => ({ threads: s.threads.map((t) => (t.ref.id === refId ? { ...t, unread: 0 } : t)) })),
      send: (ref, text, opts) => {
        const id = uid('wm');
        const msg: WaMessage = { id, dir: 'out', text, at: Date.now(), ack: 0, repId: ME, auto: opts?.auto };
        set((s) => {
          const exists = s.threads.some((t) => t.ref.id === ref.id);
          const threads = exists
            ? s.threads.map((t) => (t.ref.id === ref.id ? { ...t, messages: [...t.messages, msg], unread: 0 } : t))
            : [{ ref, messages: [msg], unread: 0, assignee: ME }, ...s.threads];
          return { threads };
        });
        if (get().autoLog) useCRM.getState().addActivity({ type: 'whatsapp', at: Date.now(), repId: ME, ref, title: opts?.auto ? 'WhatsApp recap sent' : 'WhatsApp message sent', body: text });
        // Delivery receipts as Scriwo reports them via message.status webhooks.
        const ack = (a: Ack) => set((s) => ({ threads: s.threads.map((t) => (t.ref.id === ref.id ? { ...t, messages: t.messages.map((m) => (m.id === id ? { ...m, ack: a } : m)) } : t)) }));
        setTimeout(() => ack(1), 500);
        setTimeout(() => ack(2), 1300);
        setTimeout(() => ack(3), 2600);
        if (opts?.silentReply) return;
        // Demo: the customer replies (message.received webhook).
        setTimeout(() => set({ typing: ref.id }), 3200);
        setTimeout(() => {
          const reply: WaMessage = { id: uid('wm'), dir: 'in', text: autoReplies[replyIdx++ % autoReplies.length]!, at: Date.now(), ack: 0 };
          const open = get().drawer?.id === ref.id || window.location.hash.includes('/whatsapp');
          set((s) => ({ typing: null, threads: s.threads.map((t) => (t.ref.id === ref.id ? { ...t, messages: [...t.messages, reply], unread: open ? 0 : t.unread + 1 } : t)) }));
          if (get().autoLog) useCRM.getState().addActivity({ type: 'whatsapp', at: Date.now(), repId: ME, ref, title: 'WhatsApp message received', body: reply.text });
        }, 6200);
      },
      broadcast: (refs, template) => {
        const s = useCRM.getState();
        refs.forEach((ref, i) => {
          const p = resolveRef(ref, s);
          const text = template.replace(/\{\{\s*first_name\s*\}\}/g, p?.name.split(' ')[0] ?? 'there').replace(/\{\{\s*company\s*\}\}/g, p?.company ?? 'your team');
          setTimeout(() => get().send(ref, text, { silentReply: true }), i * 120);
        });
        return refs.length;
      },
    }),
    {
      name: 'leadvico-whatsapp',
      partialize: (s) => ({ connected: s.connected, workspace: s.workspace, keyPrefix: s.keyPrefix, connectedAt: s.connectedAt, numbers: s.numbers, autoLog: s.autoLog, autoCreateLeads: s.autoCreateLeads, autoAssign: s.autoAssign, recapAfterCalls: s.recapAfterCalls }),
    },
  ),
);

export const totalUnread = (threads: WaThread[], visible?: Set<string>) => threads.filter((t) => !visible || visible.has(t.ref.id)).reduce((s, t) => s + t.unread, 0);
export const lastMessage = (t: WaThread) => t.messages[t.messages.length - 1]!;
export const DEMO_NUMBERS: WaNumber[] = [
  { number: '+91 98450 10100', name: 'leadVico Sales', status: 'online', linkedAt: NOW - 34 * DAY },
  { number: '+91 99860 22011', name: 'leadVico Support', status: 'online', linkedAt: NOW - 12 * DAY },
];

// Seeded chats also appear on each record's activity timeline.
useCRM.setState((s) => ({
  activities: [
    ...useWhatsApp.getState().threads.flatMap((t) => t.messages.map((m) => ({
      id: `ac_${m.id}`, type: 'whatsapp' as const, at: m.at, repId: m.repId ?? t.assignee ?? ME, ref: t.ref,
      title: m.dir === 'out' ? 'WhatsApp message sent' : 'WhatsApp message received', body: m.text,
    }))),
    ...s.activities,
  ].sort((a, b) => b.at - a.at),
}));
