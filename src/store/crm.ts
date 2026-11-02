import { create } from 'zustand';
import * as seed from '@/data/seed';
import type { Activity, Call, Contact, Deal, EntityRef, Lead, Notification, Rep, Stage, Task } from '@/types';
import { uid } from '@/lib/utils';

interface CRM {
  reps: Rep[];
  companies: typeof seed.companies;
  contacts: Contact[];
  leads: Lead[];
  deals: Deal[];
  calls: Call[];
  tasks: Task[];
  activities: Activity[];
  notifications: Notification[];
  stages: typeof seed.STAGES;

  addLead: (l: Omit<Lead, 'id' | 'createdAt' | 'lastActivityAt' | 'score' | 'scoreFactors'>) => Lead;
  updateLead: (id: string, patch: Partial<Lead>, opts?: { silent?: boolean }) => void;
  bulkUpdateLeads: (ids: string[], patch: Partial<Lead>) => void;
  deleteLeads: (ids: string[]) => void;
  convertLead: (id: string) => Deal | undefined;

  addDeal: (d: Omit<Deal, 'id' | 'createdAt' | 'stageChangedAt' | 'probability'>) => Deal;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  moveDeal: (id: string, stage: Stage) => void;

  addContact: (c: Omit<Contact, 'id' | 'createdAt' | 'lastContactedAt'>) => Contact;
  updateContact: (id: string, patch: Partial<Contact>) => void;

  addTask: (t: Omit<Task, 'id' | 'done'>) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  addActivity: (a: Omit<Activity, 'id'>) => void;
  logCall: (c: Omit<Call, 'id'>) => Call;

  updateRep: (id: string, patch: Partial<Rep>) => void;
  inviteRep: (r: Omit<Rep, 'id' | 'joinedAt' | 'hue' | 'presence'>) => void;

  pushNotification: (n: Omit<Notification, 'id' | 'at' | 'read'>) => void;
  markAllRead: () => void;
}

const me = seed.CURRENT_USER_ID;

export const useCRM = create<CRM>()((set, get) => ({
  reps: seed.reps,
  companies: seed.companies,
  contacts: seed.contacts,
  leads: seed.leads,
  deals: seed.deals,
  calls: seed.calls,
  tasks: seed.tasks,
  activities: seed.activities,
  notifications: seed.notifications,
  stages: seed.STAGES,

  addLead: (l) => {
    const now = Date.now();
    const { score, factors } = seed.computeScore({ ...l, lastActivityAt: now });
    const lead: Lead = { ...l, id: uid('ld'), createdAt: now, lastActivityAt: now, score, scoreFactors: factors };
    set((s) => ({ leads: [lead, ...s.leads] }));
    get().addActivity({ type: 'created', at: now, repId: me, ref: { type: 'lead', id: lead.id }, title: `Lead created manually`, body: `Source: ${lead.source}` });
    return lead;
  },
  updateLead: (id, patch, opts) => {
    const prev = get().leads.find((l) => l.id === id);
    if (!prev) return;
    set((s) => ({
      leads: s.leads.map((l) => {
        if (l.id !== id) return l;
        const next = { ...l, ...patch };
        if (patch.status || patch.source) {
          const { score, factors } = seed.computeScore(next);
          next.score = score; next.scoreFactors = factors;
        }
        return next;
      }),
    }));
    if (opts?.silent) return;
    const ref: EntityRef = { type: 'lead', id };
    if (patch.status && patch.status !== prev.status)
      get().addActivity({ type: 'status', at: Date.now(), repId: me, ref, title: `Status changed to ${patch.status}`, body: `Previously ${prev.status}` });
    if (patch.ownerId !== undefined && patch.ownerId !== prev.ownerId) {
      const rep = get().reps.find((r) => r.id === patch.ownerId);
      get().addActivity({ type: 'status', at: Date.now(), repId: me, ref, title: rep ? `Assigned to ${rep.name}` : 'Unassigned' });
    }
  },
  bulkUpdateLeads: (ids, patch) => ids.forEach((id) => get().updateLead(id, patch)),
  deleteLeads: (ids) => set((s) => ({ leads: s.leads.filter((l) => !ids.includes(l.id)) })),
  convertLead: (id) => {
    const lead = get().leads.find((l) => l.id === id);
    if (!lead) return;
    // Create (or reuse) a company + contact so the deal is fully linked.
    let company = get().companies.find((c) => c.name === lead.company);
    if (!company) {
      company = {
        id: uid('co'), name: lead.company, domain: lead.email.split('@')[1] ?? '', industry: lead.industry, employees: lead.employees,
        revenue: lead.employees * 180_000, city: lead.city, country: lead.country, ownerId: lead.ownerId ?? me,
        tier: lead.employees > 4000 ? 'Strategic' : lead.employees > 1000 ? 'Key' : 'Standard', hue: (lead.company.length * 37) % 360,
        health: 72, description: `${lead.industry} organisation converted from lead.`, createdAt: Date.now(),
      };
      set((s) => ({ companies: [company!, ...s.companies] }));
    }
    const contact = get().addContact({
      firstName: lead.firstName, lastName: lead.lastName, title: lead.title, companyId: company.id, email: lead.email, phone: lead.phone,
      ownerId: lead.ownerId ?? me, tags: ['Converted lead'], timezone: 'America/New_York', persona: 'Champion',
    });
    const deal = get().addDeal({
      name: `${lead.company.split(' ')[0]} — New business`, companyId: company.id, contactId: contact.id, ownerId: lead.ownerId ?? me,
      stage: 'Discovery', value: lead.estValue, closeDate: Date.now() + 45 * 864e5, product: 'Platform · Growth', priority: lead.score > 75 ? 'High' : 'Medium',
      nextStep: 'Run discovery call', leadId: lead.id,
    });
    get().updateLead(id, { status: 'Converted', dealId: deal.id });
    get().addActivity({ type: 'deal', at: Date.now(), repId: me, ref: { type: 'lead', id }, title: `Converted to deal · ${deal.name}`, body: 'Contact and company records created' });
    return deal;
  },

  addDeal: (d) => {
    const now = Date.now();
    const deal: Deal = { ...d, id: uid('dl'), createdAt: now, stageChangedAt: now, probability: get().stages.find((s) => s.id === d.stage)!.probability };
    set((s) => ({ deals: [deal, ...s.deals] }));
    return deal;
  },
  updateDeal: (id, patch) => set((s) => ({ deals: s.deals.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
  moveDeal: (id, stage) => {
    const d = get().deals.find((x) => x.id === id);
    if (!d || d.stage === stage) return;
    const st = get().stages.find((s) => s.id === stage)!;
    set((s) => ({
      deals: s.deals.map((x) => (x.id === id ? { ...x, stage, probability: st.probability, stageChangedAt: Date.now(), closeDate: stage.startsWith('Closed') ? Date.now() : x.closeDate } : x)),
    }));
    if (stage === 'Closed Won') get().pushNotification({ kind: 'deal', title: 'Closed Won 🎉', body: `${d.name} was marked as won`, href: '/pipeline' });
  },

  addContact: (c) => {
    const contact: Contact = { ...c, id: uid('ct'), createdAt: Date.now(), lastContactedAt: Date.now() };
    set((s) => ({ contacts: [contact, ...s.contacts] }));
    return contact;
  },
  updateContact: (id, patch) => set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

  addTask: (t) => {
    const task: Task = { ...t, id: uid('tk'), done: false };
    set((s) => ({ tasks: [task, ...s.tasks] }));
    if (t.ref) get().addActivity({ type: 'task', at: Date.now(), repId: me, ref: t.ref, title: `Task scheduled · ${t.title}`, body: new Date(t.dueAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) });
    return task;
  },
  updateTask: (id, patch) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  toggleTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : undefined } : t)) })),
  deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  addActivity: (a) => {
    set((s) => ({ activities: [{ ...a, id: uid('ac') }, ...s.activities] }));
    if (a.ref.type === 'lead') set((s) => ({ leads: s.leads.map((l) => (l.id === a.ref.id ? { ...l, lastActivityAt: Math.max(l.lastActivityAt, a.at) } : l)) }));
    else set((s) => ({ contacts: s.contacts.map((c) => (c.id === a.ref.id ? { ...c, lastContactedAt: Math.max(c.lastContactedAt, a.at) } : c)) }));
  },
  logCall: (c) => {
    const call: Call = { ...c, id: uid('cl') };
    set((s) => ({ calls: [call, ...s.calls] }));
    get().addActivity({
      type: 'call', at: c.startedAt, repId: c.repId, ref: c.ref, callId: call.id,
      title: c.status === 'completed' ? `${c.direction === 'inbound' ? 'Inbound' : 'Outbound'} call · ${c.disposition}` : c.status === 'missed' ? 'Missed inbound call' : c.status === 'voicemail' ? 'Left voicemail' : 'Call not answered',
      body: c.notes || undefined,
    });
    if (c.ref.type === 'lead') {
      const l = get().leads.find((x) => x.id === c.ref.id);
      if (l && l.status === 'New' && c.status === 'completed') get().updateLead(l.id, { status: 'Contacted' });
    }
    return call;
  },

  updateRep: (id, patch) => set((s) => ({ reps: s.reps.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  inviteRep: (r) => set((s) => ({ reps: [...s.reps, { ...r, id: uid('rep'), joinedAt: Date.now(), hue: (s.reps.length * 53) % 360, presence: 'offline' }] })),

  pushNotification: (n) => set((s) => ({ notifications: [{ ...n, id: uid('n'), at: Date.now(), read: false }, ...s.notifications] })),
  markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
}));

/* ───────────────────────── Selectors / helpers ───────────────────────── */
export const ME = me;

export function useRep(id?: string | null) {
  return useCRM((s) => (id ? s.reps.find((r) => r.id === id) : undefined));
}

export interface Party { name: string; subtitle: string; phone: string; href: string; ref: EntityRef; hue: number; company?: string }
export function resolveRef(ref: EntityRef, s = useCRM.getState()): Party | undefined {
  if (ref.type === 'lead') {
    const l = s.leads.find((x) => x.id === ref.id);
    if (!l) return;
    return { name: `${l.firstName} ${l.lastName}`, subtitle: `${l.title} · ${l.company}`, company: l.company, phone: l.phone, href: `/leads/${l.id}`, ref, hue: (l.company.length * 41) % 360 };
  }
  const c = s.contacts.find((x) => x.id === ref.id);
  if (!c) return;
  const co = s.companies.find((x) => x.id === c.companyId);
  return { name: `${c.firstName} ${c.lastName}`, subtitle: `${c.title} · ${co?.name ?? ''}`, company: co?.name, phone: c.phone, href: `/contacts?id=${c.id}`, ref, hue: co?.hue ?? 200 };
}

export function quarterRevenue(deals: Deal[], ownerId?: string) {
  return deals
    .filter((d) => d.stage === 'Closed Won' && d.closeDate >= seed.QUARTER_START && (!ownerId || d.ownerId === ownerId))
    .reduce((s, d) => s + d.value, 0);
}
