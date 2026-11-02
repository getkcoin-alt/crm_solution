import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SOURCE_DEFS, type SourceDef } from '@/data/leadSources';
import { useCRM, ME } from './crm';
import { useWhatsApp } from './whatsapp';
import { toast } from './ui';
import { MIN } from '@/lib/utils';

/**
 * Lead intake: every source feeds one pipeline —
 * capture → de-duplicate (phone/email) → score → route → instant follow-up.
 * Connections and incoming leads are simulated in this prototype.
 */
export interface IntakeEvent { id: string; at: number; sourceId: string; leadId: string; name: string; steps: string[]; duplicate: boolean }

interface Rules {
  dedupe: boolean;
  routing: 'round-robin' | 'territory' | 'source-owner';
  autoWhatsApp: boolean;
  callTask: boolean;
  slaMinutes: number;
}

interface Sources {
  connected: Record<string, { at: number; account: string }>;
  rules: Rules;
  feed: IntakeEvent[];
  open: string | null;
  connect: (id: string, account: string) => void;
  disconnect: (id: string) => void;
  setRules: (p: Partial<Rules>) => void;
  setOpen: (id: string | null) => void;
  ingest: (sourceId: string) => void;
}

const firsts = ['Rohit', 'Sneha', 'Aman', 'Pooja', 'Karan', 'Neha', 'Vikas', 'Ritu', 'Arjun', 'Meera', 'Sahil', 'Anjali', 'Farhan', 'Divya'];
const lasts = ['Sharma', 'Verma', 'Gupta', 'Iyer', 'Reddy', 'Mehta', 'Khan', 'Nair', 'Joshi', 'Patil', 'Bansal', 'Menon'];
let seq = 0;
const SDRS = ['rep_zara', 'rep_maya', 'rep_noah'];

export const useSources = create<Sources>()(
  persist(
    (set, get) => ({
      connected: {
        website: { at: Date.now() - 40 * 864e5, account: 'leadvico.com' },
        whatsapp: { at: Date.now() - 12 * 864e5, account: 'Scriwo' },
        csv: { at: Date.now() - 90 * 864e5, account: 'Manual' },
      },
      rules: { dedupe: true, routing: 'round-robin', autoWhatsApp: true, callTask: true, slaMinutes: 5 },
      feed: [],
      open: null,
      connect: (id, account) => set((s) => ({ connected: { ...s.connected, [id]: { at: Date.now(), account } } })),
      disconnect: (id) => set((s) => { const c = { ...s.connected }; delete c[id]; return { connected: c }; }),
      setRules: (p) => set((s) => ({ rules: { ...s.rules, ...p } })),
      setOpen: (open) => set({ open }),
      ingest: (sourceId) => {
        const def = SOURCE_DEFS.find((d) => d.id === sourceId) as SourceDef;
        const crm = useCRM.getState();
        const { rules } = get();
        const n = seq++;
        // Every third test lead is a repeat enquiry, to show de-duplication.
        const existing = rules.dedupe && n % 3 === 2 ? crm.leads.find((l) => l.status !== 'Unqualified' && l.source !== 'CSV import') : undefined;
        const steps: string[] = [`Captured from ${def.name}`];
        let leadId: string, name: string;
        if (existing) {
          leadId = existing.id; name = `${existing.firstName} ${existing.lastName}`;
          crm.addActivity({ type: 'note', at: Date.now(), repId: existing.ownerId ?? ME, ref: { type: 'lead', id: existing.id }, title: `Repeat enquiry via ${def.name}`, body: def.sample.need });
          steps.push('Duplicate found by phone — merged into existing lead', `Owner kept: ${crm.reps.find((r) => r.id === existing.ownerId)?.name ?? 'Unassigned'}`);
        } else {
          const first = firsts[n % firsts.length]!, last = lasts[(n * 7) % lasts.length]!;
          const owner = rules.routing === 'round-robin' ? SDRS[n % SDRS.length]! : rules.routing === 'territory' ? 'rep_maya' : 'rep_zara';
          const lead = crm.addLead({
            firstName: first, lastName: last, title: def.sample.title, company: def.sample.company === 'Unknown' ? `${first} ${last}` : def.sample.company,
            industry: 'Professional Services', employees: def.sample.employees, email: `${first.toLowerCase()}.${last.toLowerCase()}@example.in`,
            phone: `+91 9${String(8000000000 + n * 7919).slice(0, 4)} ${String(10000 + n * 37).slice(0, 5)}`, city: def.sample.city, country: 'India',
            source: def.source, status: 'New', ownerId: owner, estValue: def.sample.value, tags: [def.name],
          });
          leadId = lead.id; name = `${first} ${last}`;
          crm.addActivity({ type: 'note', at: Date.now(), repId: owner, ref: { type: 'lead', id: lead.id }, title: `Enquiry via ${def.name}`, body: def.sample.need });
          steps.push(`New lead created · score ${lead.score}`, `Routed to ${crm.reps.find((r) => r.id === owner)?.name} (${rules.routing.replace('-', ' ')})`);
          if (rules.callTask) {
            crm.addTask({ title: `Call new ${def.name} lead within ${rules.slaMinutes} min`, type: 'Call', dueAt: Date.now() + rules.slaMinutes * MIN, priority: 'High', ownerId: owner, ref: { type: 'lead', id: lead.id }, durationMin: 15 });
            steps.push(`Call task due in ${rules.slaMinutes} min`);
          }
          const wa = useWhatsApp.getState();
          if (rules.autoWhatsApp && wa.connected) {
            wa.send({ type: 'lead', id: lead.id }, `Hi ${first}, thanks for your enquiry on ${def.name}! I’m from leadVico — our team will call you in the next few minutes. 🙂`, { auto: true, silentReply: true });
            steps.push('WhatsApp auto-reply sent');
          } else if (rules.autoWhatsApp) steps.push('WhatsApp auto-reply skipped (WhatsApp not connected)');
        }
        set((s) => ({ feed: [{ id: `ev${Date.now()}${n}`, at: Date.now(), sourceId, leadId, name, steps, duplicate: !!existing }, ...s.feed].slice(0, 30) }));
        toast({ tone: 'success', title: existing ? `Repeat enquiry merged · ${name}` : `New lead from ${def.name}`, body: steps.slice(1).join(' · '), action: { label: 'Open lead', onClick: () => { window.location.hash = `#/leads/${leadId}`; } } });
      },
    }),
    { name: 'leadvico-sources', partialize: (s) => ({ connected: s.connected, rules: s.rules }) },
  ),
);
