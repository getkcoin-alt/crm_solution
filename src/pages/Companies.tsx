import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutGrid, Table2, X, Globe, MapPin, Users2, Phone, Building2, HeartPulse, Briefcase, Factory } from 'lucide-react';
import { useScope } from '@/lib/access';
import { useCRM } from '@/store/crm';
import { usePhone } from '@/store/phone';
import { PageHeader, RepChip, StageBadge } from '@/components/shared';
import { Avatar, AvatarStack, Badge, Button, Card, CompanyLogo, IconButton, Progress } from '@/components/ui/primitives';
import { FilterChip, SearchInput, Segmented } from '@/components/ui/form';
import { Drawer } from '@/components/ui/overlay';
import { money, num, sum } from '@/lib/utils';

const tierTone = { Strategic: 'brand', Key: 'violet', Standard: 'neutral' } as const;
const healthTone = (h: number) => (h >= 75 ? 'success' : h >= 55 ? 'warning' : 'danger') as 'success' | 'warning' | 'danger';

export default function Companies() {
  const scope = useScope();
  const { companies, deals, contacts } = scope;
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [q, setQ] = useState('');
  const [tier, setTier] = useState<string[]>([]);
  const [ind, setInd] = useState<string[]>([]);
  const id = params.get('id');
  const industries = [...new Set(companies.map((c) => c.industry))].sort();

  const rows = useMemo(() => companies.filter((c) => (!q || `${c.name} ${c.industry} ${c.city}`.toLowerCase().includes(q.toLowerCase())) && (!tier.length || tier.includes(c.tier)) && (!ind.length || ind.includes(c.industry)))
    .map((c) => {
      const ds = deals.filter((d) => d.companyId === c.id);
      return { c, open: sum(ds.filter((d) => !d.stage.startsWith('Closed')), (d) => d.value), won: sum(ds.filter((d) => d.stage === 'Closed Won'), (d) => d.value), deals: ds.length, people: contacts.filter((p) => p.companyId === c.id) };
    }).sort((a, b) => b.open + b.won - (a.open + a.won)), [companies, deals, contacts, q, tier, ind]);

  return (
    <div>
      <PageHeader title="Companies" subtitle={`${companies.length} accounts · ${companies.filter((c) => c.tier === 'Strategic').length} strategic`}
        actions={<Segmented value={view} onChange={setView} options={[{ value: 'grid', label: 'Cards', icon: <LayoutGrid /> }, { value: 'table', label: 'Table', icon: <Table2 /> }]} />} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search accounts…" className="w-full sm:w-64" />
        <FilterChip label="Tier" values={tier} onChange={setTier} options={['Strategic', 'Key', 'Standard'].map((t) => ({ value: t, label: t }))} />
        <FilterChip label="Industry" icon={<Factory />} values={ind} onChange={setInd} options={industries.map((i) => ({ value: i, label: i }))} />
      </div>
      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {rows.map(({ c, open, won, deals: n, people }) => (
            <button key={c.id} onClick={() => setParams({ id: c.id })} className="card group p-4 text-left transition hover:-translate-y-px hover:shadow-pop">
              <div className="flex items-start gap-3">
                <CompanyLogo name={c.name} hue={c.hue} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold">{c.name}</div>
                  <div className="truncate text-xs text-muted">{c.industry} · {c.city}</div>
                </div>
                <Badge tone={tierTone[c.tier]}>{c.tier}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-sunken p-2.5">
                <div><div className="text-[10.5px] text-faint">Open</div><div className="num text-[13px] font-semibold">{money(open, { compact: true })}</div></div>
                <div><div className="text-[10.5px] text-faint">Won</div><div className="num text-[13px] font-semibold">{money(won, { compact: true })}</div></div>
                <div><div className="text-[10.5px] text-faint">Deals</div><div className="num text-[13px] font-semibold">{n}</div></div>
              </div>
              <div className="mt-3.5 flex items-center justify-between">
                <AvatarStack people={people.map((p) => ({ name: `${p.firstName} ${p.lastName}`, hue: c.hue }))} />
                <div className="flex w-28 items-center gap-2"><HeartPulse className={{ success: 'size-3.5 text-success', warning: 'size-3.5 text-warning', danger: 'size-3.5 text-danger' }[healthTone(c.health)]} /><Progress value={c.health / 100} tone={healthTone(c.health)} height={5} /><span className="num text-[11px] text-muted">{c.health}</span></div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="scroll-x">
            <table className="w-full min-w-[960px]">
              <thead className="border-b bg-surface-2 text-left text-[11.5px] text-muted"><tr>{['Account', 'Industry', 'Tier', 'Employees', 'Open pipeline', 'Won', 'Health', 'Owner'].map((h) => <th key={h} className="h-9 px-3 font-medium first:pl-4">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map(({ c, open, won }) => (
                  <tr key={c.id} onClick={() => setParams({ id: c.id })} className="h-12 cursor-pointer border-b border-line/70 last:border-0 hover:bg-surface-2">
                    <td className="pl-4 pr-3"><span className="flex items-center gap-2.5 text-[13px] font-medium"><CompanyLogo name={c.name} hue={c.hue} size={24} />{c.name}</span></td>
                    <td className="px-3 text-[13px] text-fg-2">{c.industry}</td>
                    <td className="px-3"><Badge tone={tierTone[c.tier]}>{c.tier}</Badge></td>
                    <td className="num px-3 text-[13px]">{num(c.employees)}</td>
                    <td className="num px-3 text-[13px] font-medium">{money(open, { compact: true })}</td>
                    <td className="num px-3 text-[13px] font-medium">{money(won, { compact: true })}</td>
                    <td className="px-3"><div className="flex w-24 items-center gap-2"><Progress value={c.health / 100} tone={healthTone(c.health)} height={5} /><span className="num text-[11px]">{c.health}</span></div></td>
                    <td className="px-3"><RepChip id={c.ownerId} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {id && <CompanyDrawer id={id} onClose={() => setParams({})} />}
    </div>
  );
}

function CompanyDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const c = useCRM((s) => s.companies.find((x) => x.id === id));
  const allDeals = useCRM((s) => s.deals);
  const allContacts = useCRM((s) => s.contacts);
  const deals = useMemo(() => allDeals.filter((d) => d.companyId === id), [allDeals, id]);
  const people = useMemo(() => allContacts.filter((d) => d.companyId === id), [allContacts, id]);
  const dial = usePhone((s) => s.dial);
  const nav = useNavigate();
  if (!c) return null;
  return (
    <Drawer open onClose={onClose} width={600}>
      <div className="relative overflow-hidden border-b px-5 pb-5 pt-5">
        <div className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(90% 120% at 0% 0%, hsl(${c.hue} 70% 55% / .18), transparent 60%)` }} />
        <div className="absolute right-3 top-3"><IconButton label="Close" onClick={onClose}><X className="size-4" /></IconButton></div>
        <div className="relative flex items-center gap-3.5">
          <CompanyLogo name={c.name} hue={c.hue} size={52} />
          <div>
            <div className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.01em]">{c.name}<Badge tone={tierTone[c.tier]}>{c.tier}</Badge></div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
              <span className="flex items-center gap-1"><Globe className="size-3" />{c.domain}</span>
              <span className="flex items-center gap-1"><MapPin className="size-3" />{c.city}, {c.country}</span>
              <span className="flex items-center gap-1"><Building2 className="size-3" />{c.industry}</span>
            </div>
          </div>
        </div>
        <p className="relative mt-3 text-[13px] leading-[1.5] text-fg-2">{c.description}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {[['Employees', num(c.employees)], ['Revenue', money(c.revenue, { compact: true })], ['Open pipeline', money(sum(deals.filter((d) => !d.stage.startsWith('Closed')), (d) => d.value), { compact: true })], ['Health score', `${c.health}/100`]].map(([k, v]) => (
            <div key={k} className="bg-surface px-5 py-3"><div className="text-[11px] text-faint">{k}</div><div className="num mt-0.5 text-[15px] font-semibold">{v}</div></div>
          ))}
        </div>
        <div className="border-y px-5 py-4">
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold"><Users2 className="size-4 text-muted" />People <span className="text-faint">{people.length}</span></div>
          {people.map((p) => (
            <div key={p.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-sunken">
              <Avatar name={`${p.firstName} ${p.lastName}`} hue={c.hue} size={30} />
              <button onClick={() => nav(`/contacts?id=${p.id}`)} className="min-w-0 flex-1 text-left"><div className="text-[13px] font-medium hover:underline">{p.firstName} {p.lastName}</div><div className="truncate text-xs text-muted">{p.title} · {p.persona}</div></button>
              <Button size="sm" icon={<Phone />} onClick={() => dial({ type: 'contact', id: p.id })}>Call</Button>
            </div>
          ))}
        </div>
        <div className="px-5 py-4">
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold"><Briefcase className="size-4 text-muted" />Deals <span className="text-faint">{deals.length}</span></div>
          {deals.map((d) => (
            <button key={d.id} onClick={() => nav(`/pipeline?deal=${d.id}`)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-sunken">
              <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-medium">{d.name}</div><div className="text-xs text-muted">{d.product}</div></div>
              <StageBadge stage={d.stage} />
              <span className="num w-20 text-right text-[13px] font-semibold">{money(d.value, { compact: true })}</span>
            </button>
          ))}
          {!deals.length && <div className="px-2 text-xs text-muted">No deals yet.</div>}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted">Account owner <RepChip id={c.ownerId} /></div>
        </div>
      </div>
    </Drawer>
  );
}
