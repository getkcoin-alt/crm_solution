import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Phone, Mail, X, Building2, Clock3, Download, UserRound, Briefcase } from 'lucide-react';
import { useScope, useCan } from '@/lib/access';
import { useCRM } from '@/store/crm';
import { usePhone } from '@/store/phone';
import { useUI, toast } from '@/store/ui';
import { PageHeader, RepChip, StageBadge } from '@/components/shared';
import { Avatar, Badge, Button, Card, CompanyLogo, IconButton, EmptyState, type Tone } from '@/components/ui/primitives';
import { FilterChip, SearchInput } from '@/components/ui/form';
import { Drawer } from '@/components/ui/overlay';
import { Timeline } from '@/components/Timeline';
import { downloadCSV, money, relTime } from '@/lib/utils';
import type { Contact } from '@/types';

const personaTone: Record<Contact['persona'], Tone> = { 'Decision maker': 'brand', Champion: 'success', Influencer: 'violet', 'End user': 'neutral', Blocker: 'danger' };
const PAGE = 20;

export default function Contacts() {
  const { companies, reps } = useCRM();
  const scope = useScope();
  const can = useCan();
  const contacts = scope.contacts;
  const dial = usePhone((s) => s.dial);
  const open = useUI((s) => s.open);
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [persona, setPersona] = useState<string[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [cos, setCos] = useState<string[]>([]);
  const [limit, setLimit] = useState(PAGE);
  const id = params.get('id');

  const rows = useMemo(() => contacts.filter((c) => {
    const co = companies.find((x) => x.id === c.companyId);
    return (!q || `${c.firstName} ${c.lastName} ${c.email} ${c.title} ${co?.name}`.toLowerCase().includes(q.toLowerCase()))
      && (!persona.length || persona.includes(c.persona)) && (!owners.length || owners.includes(c.ownerId)) && (!cos.length || cos.includes(c.companyId));
  }).sort((a, b) => b.lastContactedAt - a.lastContactedAt), [contacts, companies, q, persona, owners, cos]);

  return (
    <div>
      <PageHeader title="Contacts" subtitle={`${contacts.length} people across ${companies.length} accounts`}
        actions={<>
          {can('export') && <Button icon={<Download />} onClick={() => downloadCSV('leadvico-contacts.csv', rows.map((c) => ({ name: `${c.firstName} ${c.lastName}`, title: c.title, company: companies.find((x) => x.id === c.companyId)?.name, email: c.email, phone: c.phone, persona: c.persona })))}>Export</Button>}
          <Button variant="primary" icon={<Plus />} onClick={() => open({ kind: 'contact' })}>New contact</Button>
        </>} />
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5">
          <SearchInput value={q} onChange={setQ} placeholder="Search people, titles, companies…" className="w-full sm:w-72" />
          <FilterChip label="Role" values={persona} onChange={setPersona} options={(['Decision maker', 'Champion', 'Influencer', 'End user', 'Blocker'] as const).map((p) => ({ value: p, label: p }))} />
          <FilterChip label="Company" icon={<Building2 />} values={cos} onChange={setCos} options={scope.companies.map((c) => ({ value: c.id, label: c.name, icon: <CompanyLogo name={c.name} hue={c.hue} size={16} /> }))} />
          <FilterChip label="Owner" values={owners} onChange={setOwners} options={(scope.admin ? reps : scope.teamReps).map((r) => ({ value: r.id, label: r.name, icon: <Avatar name={r.name} hue={r.hue} size={16} /> }))} />
          <span className="num ml-auto text-xs text-muted">{rows.length} contacts</span>
        </div>
        <div className="scroll-x">
          <table className="w-full min-w-[1000px]">
            <thead className="border-b bg-surface-2 text-left text-[11.5px] text-muted">
              <tr>{['Name', 'Company', 'Buying role', 'Phone', 'Owner', 'Last contacted', ''].map((h) => <th key={h} className="h-9 px-3 font-medium first:pl-4">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((c) => {
                const co = companies.find((x) => x.id === c.companyId);
                return (
                  <tr key={c.id} onClick={() => setParams({ id: c.id })} className="group h-[52px] cursor-pointer border-b border-line/70 last:border-0 hover:bg-surface-2">
                    <td className="pl-4 pr-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={`${c.firstName} ${c.lastName}`} hue={co?.hue} size={30} />
                        <div className="min-w-0"><div className="text-[13px] font-medium">{c.firstName} {c.lastName}</div><div className="max-w-[220px] truncate text-xs text-muted">{c.title}</div></div>
                      </div>
                    </td>
                    <td className="px-3"><span className="flex items-center gap-2 whitespace-nowrap text-[13px] text-fg-2">{co && <CompanyLogo name={co.name} hue={co.hue} size={20} />}{co?.name}</span></td>
                    <td className="px-3"><Badge tone={personaTone[c.persona]}>{c.persona}</Badge></td>
                    <td className="num whitespace-nowrap px-3 text-[13px] text-fg-2">{c.phone}</td>
                    <td className="px-3"><RepChip id={c.ownerId} /></td>
                    <td className="whitespace-nowrap px-3 text-xs text-muted">{relTime(c.lastContactedAt)}</td>
                    <td className="pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <IconButton label="Email" size="sm" variant="secondary" onClick={() => toast({ title: 'Email composer opened', body: c.email })}><Mail className="size-3.5" /></IconButton>
                        <IconButton label="Call" size="sm" variant="secondary" onClick={() => dial({ type: 'contact', id: c.id })}><Phone className="size-3.5" /></IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length && <EmptyState icon={<UserRound />} title="No contacts found" />}
        </div>
        {rows.length > limit && <div className="border-t p-3 text-center"><Button size="sm" variant="ghost" onClick={() => setLimit(limit + PAGE)}>Show more</Button></div>}
      </Card>
      {id && <ContactDrawer id={id} onClose={() => setParams({})} />}
    </div>
  );
}

export function ContactDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const c = useCRM((s) => s.contacts.find((x) => x.id === id));
  const co = useCRM((s) => s.companies.find((x) => x.id === c?.companyId));
  const allDeals = useCRM((s) => s.deals);
  const deals = useMemo(() => allDeals.filter((d) => d.contactId === id), [allDeals, id]);
  const dial = usePhone((s) => s.dial);
  const open = useUI((s) => s.open);
  const nav = useNavigate();
  if (!c) return null;
  const name = `${c.firstName} ${c.lastName}`;
  return (
    <Drawer open onClose={onClose} width={600}>
      <div className="relative border-b px-5 pb-4 pt-5">
        <div className="absolute right-3 top-3"><IconButton label="Close" onClick={onClose}><X className="size-4" /></IconButton></div>
        <div className="flex items-center gap-3.5">
          <Avatar name={name} hue={co?.hue} size={52} />
          <div className="min-w-0">
            <div className="text-[17px] font-semibold tracking-[-0.01em]">{name}</div>
            <div className="text-xs text-muted">{c.title} · {co?.name}</div>
            <div className="mt-1.5 flex gap-1.5"><Badge tone={personaTone[c.persona]}>{c.persona}</Badge>{c.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" icon={<Phone />} onClick={() => dial({ type: 'contact', id: c.id })}>Call</Button>
          <Button size="sm" icon={<Mail />} onClick={() => toast({ title: 'Email composer opened', body: c.email })}>Email</Button>
          <Button size="sm" icon={<Clock3 />} onClick={() => open({ kind: 'task', ref: { type: 'contact', id: c.id } })}>Follow-up</Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b px-5 py-4 text-[13px]">
          {[['Email', c.email], ['Phone', c.phone], ['Timezone', c.timezone.replace('_', ' ')], ['Owner', <RepChip key="o" id={c.ownerId} />], ['Last contacted', relTime(c.lastContactedAt)], ['Company', co ? <button key="c" onClick={() => nav(`/companies?id=${co.id}`)} className="flex items-center gap-1.5 font-medium hover:underline"><CompanyLogo name={co.name} hue={co.hue} size={16} />{co.name}</button> : '—']].map(([k, v]) => (
            <div key={k as string} className="min-w-0"><div className="text-[11px] text-faint">{k}</div><div className="mt-0.5 truncate font-medium">{v}</div></div>
          ))}
        </div>
        {deals.length > 0 && (
          <div className="border-b px-5 py-4">
            <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold"><Briefcase className="size-4 text-muted" />Deals</div>
            {deals.map((d) => (
              <button key={d.id} onClick={() => nav(`/pipeline?deal=${d.id}`)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-sunken">
                <span className="text-[13px] font-medium">{d.name}</span>
                <span className="flex items-center gap-2"><StageBadge stage={d.stage} /><span className="num text-[13px] font-semibold">{money(d.value, { compact: true })}</span></span>
              </button>
            ))}
          </div>
        )}
        <div className="px-5 py-4"><Timeline entity={{ type: 'contact', id: c.id }} stickyTop="top-0" /></div>
      </div>
    </Drawer>
  );
}

