import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Briefcase, CalendarPlus, Contact2 } from 'lucide-react';
import { Modal } from './ui/overlay';
import { Button } from './ui/primitives';
import { Field, Input, Select, Textarea, Segmented } from './ui/form';
import { RepSelect } from './shared';
import { ME, resolveRef, useCRM } from '@/store/crm';
import { useUI, toast } from '@/store/ui';
import { ALL_SOURCES, type EntityRef, type LeadSource, type Stage, type TaskType } from '@/types';
import { DAY, HOUR, fromCurrency, startOfDay } from '@/lib/utils';
import { usePrefs } from '@/store/prefs';

const SOURCES: LeadSource[] = ALL_SOURCES;
const INDUSTRIES = ['Software', 'Healthcare', 'Financial Services', 'Logistics', 'Retail', 'Manufacturing', 'Media', 'Energy', 'Life Sciences', 'Professional Services', 'Telecommunications', 'Consumer Goods'];

function LeadModal({ onClose }: { onClose: () => void }) {
  const addLead = useCRM((s) => s.addLead);
  const nav = useNavigate();
  const cur = usePrefs((s) => s.currency);
  const [f, setF] = useState({ firstName: '', lastName: '', title: '', company: '', email: '', phone: '', industry: 'Software', source: 'Website' as LeadSource, ownerId: ME as string | null, employees: '250', estValue: '24000', city: 'New York', country: 'United States' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const valid = f.firstName && f.lastName && f.company;
  const submit = () => {
    const l = addLead({
      firstName: f.firstName, lastName: f.lastName, title: f.title || 'Unknown title', company: f.company, industry: f.industry, employees: Number(f.employees) || 50,
      email: f.email || `${f.firstName.toLowerCase()}@${f.company.toLowerCase().replace(/\s/g, '')}.com`, phone: f.phone || '+1 (212) 555-0199', city: f.city, country: f.country,
      source: f.source, status: 'New', ownerId: f.ownerId, estValue: fromCurrency(Number(f.estValue) || 0), tags: ['Manual'],
    });
    toast({ tone: 'success', title: 'Lead created', body: `${l.firstName} ${l.lastName} · scored ${l.score}`, action: { label: 'Open profile', onClick: () => nav(`/leads/${l.id}`) } });
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="New lead" description="Leads are automatically scored and routed." icon={<UserPlus />} width={580}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!valid} onClick={submit}>Create lead</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name"><Input autoFocus value={f.firstName} onChange={set('firstName')} placeholder="Jordan" /></Field>
        <Field label="Last name"><Input value={f.lastName} onChange={set('lastName')} placeholder="Avery" /></Field>
        <Field label="Job title"><Input value={f.title} onChange={set('title')} placeholder="VP of Operations" /></Field>
        <Field label="Company"><Input value={f.company} onChange={set('company')} placeholder="Acme Logistics" /></Field>
        <Field label="Email"><Input type="email" value={f.email} onChange={set('email')} placeholder="jordan@company.com" /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={set('phone')} placeholder="+1 (212) 555-0123" /></Field>
        <Field label="Industry"><Select value={f.industry} onChange={(v) => setF({ ...f, industry: v })} options={INDUSTRIES.map((i) => ({ value: i, label: i }))} /></Field>
        <Field label="Source"><Select value={f.source} onChange={(v) => setF({ ...f, source: v })} options={SOURCES.map((i) => ({ value: i, label: i }))} /></Field>
        <Field label="Employees"><Input type="number" value={f.employees} onChange={set('employees')} /></Field>
        <Field label={`Estimated value (${cur})`}><Input type="number" value={f.estValue} onChange={set('estValue')} /></Field>
        <Field label="Owner" className="col-span-2"><RepSelect value={f.ownerId} onChange={(v) => setF({ ...f, ownerId: v })} allowUnassigned /></Field>
      </div>
    </Modal>
  );
}

function DealModal({ onClose, leadId }: { onClose: () => void; leadId?: string }) {
  const { companies, contacts, stages, addDeal } = useCRM();
  const nav = useNavigate();
  const cur = usePrefs((s) => s.currency);
  const [f, setF] = useState({ name: '', companyId: companies[0]!.id, stage: 'Discovery' as Stage, value: '48000', ownerId: ME as string | null, close: '45', product: 'Platform · Enterprise', priority: 'Medium' as 'High' | 'Medium' | 'Low' });
  const cts = contacts.filter((c) => c.companyId === f.companyId);
  const submit = () => {
    const co = companies.find((c) => c.id === f.companyId)!;
    const d = addDeal({
      name: f.name || `${co.name.split(' ')[0]} — New opportunity`, companyId: f.companyId, contactId: cts[0]?.id ?? contacts[0]!.id, ownerId: f.ownerId ?? ME,
      stage: f.stage, value: fromCurrency(Number(f.value) || 0), closeDate: Date.now() + Number(f.close) * DAY, product: f.product, priority: f.priority, nextStep: 'Schedule discovery call', leadId,
    });
    toast({ tone: 'success', title: 'Deal created', body: `${d.name} added to ${d.stage}`, action: { label: 'View pipeline', onClick: () => nav(`/pipeline?deal=${d.id}`) } });
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="New deal" description="Add an opportunity to the pipeline." icon={<Briefcase />} width={560}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={submit}>Create deal</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Deal name" className="col-span-2"><Input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Northwind — Contact center rollout" /></Field>
        <Field label="Company"><Select value={f.companyId} onChange={(v) => setF({ ...f, companyId: v })} options={companies.map((c) => ({ value: c.id, label: c.name }))} width={260} /></Field>
        <Field label="Stage"><Select value={f.stage} onChange={(v) => setF({ ...f, stage: v })} options={stages.map((s) => ({ value: s.id, label: s.id, hint: `${s.probability * 100}%`, icon: <span className="block size-2 rounded-full" style={{ background: s.color }} /> }))} /></Field>
        <Field label={`Value (${cur})`}><Input type="number" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
        <Field label="Expected close"><Select value={f.close} onChange={(v) => setF({ ...f, close: v })} options={[['14', 'In 2 weeks'], ['30', 'In 30 days'], ['45', 'In 45 days'], ['60', 'In 60 days'], ['90', 'Next quarter']].map(([v, l]) => ({ value: v!, label: l! }))} /></Field>
        <Field label="Product"><Select value={f.product} onChange={(v) => setF({ ...f, product: v })} options={['Platform · Enterprise', 'Platform · Growth', 'Voice & Calling Add-on', 'Revenue Analytics Suite', 'Data Connectors Pack', 'Onboarding & Services'].map((p) => ({ value: p, label: p }))} /></Field>
        <Field label="Priority"><Segmented value={f.priority} onChange={(v) => setF({ ...f, priority: v })} options={(['High', 'Medium', 'Low'] as const).map((p) => ({ value: p, label: p }))} /></Field>
        <Field label="Owner" className="col-span-2"><RepSelect value={f.ownerId} onChange={(v) => setF({ ...f, ownerId: v })} /></Field>
      </div>
    </Modal>
  );
}

export function TaskModal({ onClose, refProp, type: initialType }: { onClose: () => void; refProp?: EntityRef; type?: string }) {
  const addTask = useCRM((s) => s.addTask);
  const leads = useCRM((s) => s.leads);
  const party = refProp ? resolveRef(refProp) : undefined;
  const [f, setF] = useState({ title: party ? `Follow up with ${party.name.split(' ')[0]}` : '', type: (initialType as TaskType) ?? 'Follow-up', day: '1', time: '10:00', priority: 'Medium' as 'High' | 'Medium' | 'Low', ownerId: ME as string | null, refId: refProp?.id ?? '', notes: '' });
  const submit = () => {
    const [h, m] = f.time.split(':').map(Number);
    const dueAt = startOfDay() + Number(f.day) * DAY + h! * HOUR + m! * 60_000;
    const ref = refProp ?? (f.refId ? { type: 'lead' as const, id: f.refId } : undefined);
    addTask({ title: f.title || `${f.type} task`, type: f.type, dueAt, priority: f.priority, ownerId: f.ownerId ?? ME, ref, notes: f.notes || undefined, durationMin: f.type === 'Meeting' || f.type === 'Demo' ? 45 : undefined });
    toast({ tone: 'success', title: 'Follow-up scheduled', body: `${f.title || f.type} · ${new Date(dueAt).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}` });
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Schedule follow-up" description={party ? `For ${party.name} · ${party.company ?? ''}` : 'Create a task or reminder.'} icon={<CalendarPlus />} width={520}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={submit}>Schedule</Button></>}>
      <div className="space-y-3">
        <Field label="Title"><Input autoFocus value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Follow up on proposal" /></Field>
        <Field label="Type"><Segmented value={f.type} onChange={(v) => setF({ ...f, type: v })} options={(['Call', 'Email', 'Meeting', 'Follow-up', 'Demo'] as const).map((t) => ({ value: t, label: t }))} className="flex w-full [&>button]:flex-1 [&>button]:justify-center" /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Due"><Select value={f.day} onChange={(v) => setF({ ...f, day: v })} options={[['0', 'Today'], ['1', 'Tomorrow'], ['2', 'In 2 days'], ['3', 'In 3 days'], ['7', 'Next week'], ['14', 'In 2 weeks']].map(([v, l]) => ({ value: v!, label: l! }))} /></Field>
          <Field label="Time"><Input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
          <Field label="Priority"><Select value={f.priority} onChange={(v) => setF({ ...f, priority: v })} options={(['High', 'Medium', 'Low'] as const).map((p) => ({ value: p, label: p }))} /></Field>
        </div>
        {!refProp && <Field label="Related lead"><Select value={f.refId} onChange={(v) => setF({ ...f, refId: v })} placeholder="Optional — link to a lead" width={300} options={leads.slice(0, 60).map((l) => ({ value: l.id, label: `${l.firstName} ${l.lastName}`, hint: l.company }))} /></Field>}
        <Field label="Assignee"><RepSelect value={f.ownerId} onChange={(v) => setF({ ...f, ownerId: v })} /></Field>
        <Field label="Notes"><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Context for the follow-up…" /></Field>
      </div>
    </Modal>
  );
}

function ContactModal({ onClose }: { onClose: () => void }) {
  const { companies, addContact } = useCRM();
  const [f, setF] = useState({ firstName: '', lastName: '', title: '', companyId: companies[0]!.id, email: '', phone: '' });
  const submit = () => {
    const c = addContact({ ...f, ownerId: ME, tags: [], timezone: 'America/New_York', persona: 'Influencer', title: f.title || 'Contact' });
    toast({ tone: 'success', title: 'Contact added', body: `${c.firstName} ${c.lastName}` });
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="New contact" icon={<Contact2 />} width={520}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!f.firstName || !f.lastName} onClick={submit}>Add contact</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name"><Input autoFocus value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></Field>
        <Field label="Last name"><Input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></Field>
        <Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Company"><Select value={f.companyId} onChange={(v) => setF({ ...f, companyId: v })} options={companies.map((c) => ({ value: c.id, label: c.name }))} width={260} /></Field>
        <Field label="Email"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

export function GlobalModals() {
  const modal = useUI((s) => s.modal);
  const close = () => useUI.getState().open(null);
  if (!modal) return null;
  if (modal.kind === 'lead') return <LeadModal onClose={close} />;
  if (modal.kind === 'deal') return <DealModal onClose={close} leadId={modal.leadId} />;
  if (modal.kind === 'task') return <TaskModal onClose={close} refProp={modal.ref} type={modal.type} />;
  if (modal.kind === 'contact') return <ContactModal onClose={close} />;
  return null;
}
