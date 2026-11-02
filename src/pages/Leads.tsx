import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, MessageCircle, Phone, Plus, Download, Upload, Star, ArrowUpDown, ArrowUp, ArrowDown, UserCheck, Trash2, Tag, Users2, SlidersHorizontal, Flame, Mail, X, CircleDot, Globe2, Gauge, MoreHorizontal, CalendarPlus, Briefcase } from 'lucide-react';
import { useCRM, ME } from '@/store/crm';
import { useScope, useCan } from '@/lib/access';
import { useWhatsApp } from '@/store/whatsapp';
import { BroadcastModal } from '@/components/whatsapp/BroadcastModal';
import { usePhone } from '@/store/phone';
import { useUI, toast } from '@/store/ui';
import { PageHeader, LeadStatusBadge, RepChip, LEAD_STATUSES } from '@/components/shared';
import { Avatar, Badge, Button, Card, IconButton, ScoreRing, scoreTone, EmptyState } from '@/components/ui/primitives';
import { Checkbox, FilterChip, SearchInput, Select, Tabs } from '@/components/ui/form';
import { Menu, Modal } from '@/components/ui/overlay';
import { cn, DAY, downloadCSV, money, relTime } from '@/lib/utils';
import { ALL_SOURCES, type Lead, type LeadSource, type LeadStatus } from '@/types';

type View = 'all' | 'mine' | 'hot' | 'unassigned' | 'new';
type SortKey = 'name' | 'score' | 'company' | 'estValue' | 'lastActivityAt' | 'createdAt';
const PAGE = 15;

export default function Leads() {
  const scope = useScope();
  const can = useCan();
  const { leads, reps, updateLead, bulkUpdateLeads, deleteLeads, toggleStar } = { ...useCRM(), leads: scope.leads, toggleStar: (l: Lead) => useCRM.getState().updateLead(l.id, { starred: !l.starred }, { silent: true }) };
  const dial = usePhone((s) => s.dial);
  const open = useUI((s) => s.open);
  const nav = useNavigate();
  const [view, setView] = useState<View>('all');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<LeadStatus[]>([]);
  const [source, setSource] = useState<LeadSource[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [temp, setTemp] = useState<string[]>([]);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'score', dir: -1 });
  const [sel, setSel] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [broadcast, setBroadcast] = useState<string[] | null>(null);

  const views: Record<View, (l: Lead) => boolean> = {
    all: () => true,
    mine: (l) => l.ownerId === ME,
    hot: (l) => l.score >= 75 && !['Unqualified', 'Converted'].includes(l.status),
    unassigned: (l) => !l.ownerId,
    new: (l) => l.createdAt > Date.now() - 7 * DAY,
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const r = leads.filter((l) =>
      views[view](l) &&
      (!term || `${l.firstName} ${l.lastName} ${l.company} ${l.email} ${l.title} ${l.city}`.toLowerCase().includes(term)) &&
      (!status.length || status.includes(l.status)) &&
      (!source.length || source.includes(l.source)) &&
      (!owners.length || owners.includes(l.ownerId ?? '__none')) &&
      (!temp.length || temp.includes(scoreTone(l.score).label)),
    );
    const get = (l: Lead): string | number => sort.key === 'name' ? `${l.firstName} ${l.lastName}` : (l[sort.key] as string | number);
    return r.sort((a, b) => { const x = get(a), y = get(b); return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, q, status, source, owners, temp, sort, view]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const pg = Math.min(page, pages - 1);
  const rows = filtered.slice(pg * PAGE, pg * PAGE + PAGE);
  const allOnPage = rows.length > 0 && rows.every((r) => sel.includes(r.id));
  const counts = (Object.keys(views) as View[]).reduce((a, v) => ({ ...a, [v]: leads.filter(views[v]).length }), {} as Record<View, number>);
  const activeFilters = status.length + source.length + owners.length + temp.length;

  const th = (key: SortKey, label: string, cls?: string) => (
    <th className={cn('h-9 whitespace-nowrap px-3 text-left text-[11.5px] font-medium text-muted', cls)}>
      <button onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }))} className="group inline-flex items-center gap-1 hover:text-fg">
        {label}
        {sort.key === key ? (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-0 group-hover:opacity-60" />}
      </button>
    </th>
  );

  const exportRows = (list: Lead[]) => downloadCSV('leadvico-leads.csv', list.map((l) => ({ name: `${l.firstName} ${l.lastName}`, title: l.title, company: l.company, email: l.email, phone: l.phone, status: l.status, score: l.score, source: l.source, owner: reps.find((r) => r.id === l.ownerId)?.name ?? '', est_value_usd: l.estValue })));

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={`${leads.length} leads · ${counts.hot} hot · ${counts.unassigned} awaiting assignment`}
        actions={<>
          {scope.role !== 'Account Executive' && scope.role !== 'SDR' && <Button icon={<Radio />} onClick={() => nav('/sources')}>Sources</Button>}
          {scope.role !== 'Account Executive' && scope.role !== 'SDR' && <Button icon={<Upload />} onClick={() => setImportOpen(true)}>Import</Button>}
          {can('export') && <Button icon={<Download />} onClick={() => { exportRows(filtered); toast({ tone: 'success', title: 'Export ready', body: `${filtered.length} leads exported to CSV` }); }}>Export</Button>}
          <Button variant="primary" icon={<Plus />} onClick={() => open({ kind: 'lead' })}>New lead</Button>
        </>}
      />

      <Card className="overflow-hidden">
        <Tabs
          className="px-3"
          value={view}
          onChange={(v) => { setView(v); setPage(0); }}
          tabs={[
            { value: 'all', label: 'All leads', count: counts.all },
            { value: 'mine', label: 'My leads', count: counts.mine },
            { value: 'hot', label: 'Hot', count: counts.hot, icon: <Flame className="!size-3.5 text-danger" /> },
            { value: 'unassigned', label: 'Unassigned', count: counts.unassigned },
            { value: 'new', label: 'Added this week', count: counts.new },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Search name, company, email…" className="w-full sm:w-64" />
          <FilterChip label="Status" icon={<CircleDot />} values={status} onChange={(v) => { setStatus(v); setPage(0); }} options={LEAD_STATUSES.map((s) => ({ value: s.value, label: s.value, hint: String(leads.filter((l) => l.status === s.value).length) }))} />
          <FilterChip label="Score" icon={<Gauge />} values={temp} onChange={(v) => { setTemp(v); setPage(0); }} options={[{ value: 'Hot', label: 'Hot (75+)' }, { value: 'Warm', label: 'Warm (50–74)' }, { value: 'Cold', label: 'Cold (<50)' }]} />
          <FilterChip label="Source" icon={<Globe2 />} values={source} onChange={(v) => { setSource(v); setPage(0); }} options={ALL_SOURCES.filter((x) => leads.some((l) => l.source === x)).map((x) => ({ value: x, label: x, hint: String(leads.filter((l) => l.source === x).length) }))} />
          <FilterChip label="Owner" icon={<Users2 />} values={owners} onChange={(v) => { setOwners(v); setPage(0); }} options={[{ value: '__none', label: 'Unassigned' }, ...(scope.admin ? reps : scope.peers).map((r) => ({ value: r.id, label: r.name, icon: <Avatar name={r.name} hue={r.hue} size={16} /> }))]} />
          {activeFilters > 0 && <button onClick={() => { setStatus([]); setSource([]); setOwners([]); setTemp([]); }} className="text-xs font-medium text-muted hover:text-fg">Clear all</button>}
          <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted md:flex"><SlidersHorizontal className="size-3.5" />{filtered.length} results</span>
        </div>

        {sel.length > 0 && (
          <div className="flex animate-fade-in flex-wrap items-center gap-2 border-b bg-brand/[.05] px-3 py-2">
            <span className="text-xs font-semibold text-brand">{sel.length} selected</span>
            <span className="mx-1 h-4 w-px bg-line-strong" />
            {can('editOthers') && <Menu align="start" trigger={({ toggle }) => <Button size="sm" icon={<UserCheck />} onClick={toggle}>Assign</Button>}
              items={reps.map((r) => ({ label: r.name, icon: <Avatar name={r.name} hue={r.hue} size={16} />, onClick: () => { bulkUpdateLeads(sel, { ownerId: r.id }); toast({ tone: 'success', title: `${sel.length} leads assigned`, body: `Routed to ${r.name}` }); setSel([]); } }))} />}
            <Menu align="start" trigger={({ toggle }) => <Button size="sm" icon={<Tag />} onClick={toggle}>Set status</Button>}
              items={LEAD_STATUSES.map((s) => ({ label: s.value, onClick: () => { bulkUpdateLeads(sel, { status: s.value }); toast({ tone: 'success', title: 'Status updated', body: `${sel.length} leads → ${s.value}` }); setSel([]); } }))} />
            <Button size="sm" icon={<MessageCircle className="!text-[#1fa855]" />} onClick={() => setBroadcast(sel)}>WhatsApp</Button>
            <Button size="sm" icon={<Mail />} onClick={() => { toast({ title: 'Sequence enrolled', body: `${sel.length} leads added to “Q4 Re-engagement” sequence` }); setSel([]); }}>Add to sequence</Button>
            {can('export') && <Button size="sm" icon={<Download />} onClick={() => exportRows(leads.filter((l) => sel.includes(l.id)))}>Export</Button>}
            {can('delete') && <Button size="sm" variant="ghost" className="!text-danger" icon={<Trash2 />} onClick={() => { const ids = sel; deleteLeads(ids); setSel([]); toast({ title: `${ids.length} leads deleted` }); }}>Delete</Button>}
            <button onClick={() => setSel([])} className="ml-auto rounded p-1 text-muted hover:bg-sunken"><X className="size-3.5" /></button>
          </div>
        )}

        <div className="scroll-x">
          <table className="w-full min-w-[1180px] border-collapse">
            <thead className="border-b bg-surface-2">
              <tr>
                <th className="w-10 pl-4"><Checkbox checked={allOnPage} indeterminate={!allOnPage && rows.some((r) => sel.includes(r.id))} onChange={(v) => setSel(v ? [...new Set([...sel, ...rows.map((r) => r.id)])] : sel.filter((id) => !rows.find((r) => r.id === id)))} /></th>
                {th('name', 'Lead')}
                {th('company', 'Company')}
                {th('score', 'Score')}
                <th className="px-3 text-left text-[11.5px] font-medium text-muted">Status</th>
                <th className="px-3 text-left text-[11.5px] font-medium text-muted">Source</th>
                {th('estValue', 'Est. value', 'text-right')}
                <th className="px-3 text-left text-[11.5px] font-medium text-muted">Owner</th>
                {th('lastActivityAt', 'Last activity')}
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const on = sel.includes(l.id);
                return (
                  <tr key={l.id} onClick={() => nav(`/leads/${l.id}`)} className={cn('group h-[52px] cursor-pointer border-b border-line/70 transition-colors last:border-0', on ? 'bg-brand/[.04]' : 'hover:bg-surface-2')}>
                    <td className="pl-4" onClick={(e) => e.stopPropagation()}><Checkbox checked={on} onChange={(v) => setSel(v ? [...sel, l.id] : sel.filter((x) => x !== l.id))} /></td>
                    <td className="px-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={`${l.firstName} ${l.lastName}`} hue={(l.company.length * 41) % 360} size={30} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-[13px] font-medium">
                            {l.firstName} {l.lastName}
                            <button onClick={(e) => { e.stopPropagation(); toggleStar(l); }} className={cn('transition', l.starred ? 'text-warning' : 'text-faint opacity-0 group-hover:opacity-100')}><Star className={cn('size-3.5', l.starred && 'fill-current')} /></button>
                          </div>
                          <div className="max-w-[200px] truncate text-xs text-muted">{l.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3">
                      <div className="whitespace-nowrap text-[13px] text-fg-2">{l.company}</div>
                      <div className="whitespace-nowrap text-xs text-faint">{l.industry} · {l.city}</div>
                    </td>
                    <td className="px-3">
                      <div className="flex items-center gap-2"><ScoreRing score={l.score} size={30} /><Badge tone={scoreTone(l.score).tone}>{scoreTone(l.score).label}</Badge></div>
                    </td>
                    <td className="px-3" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={l.status}
                        onChange={(v) => { updateLead(l.id, { status: v }); toast({ title: 'Status updated', body: `${l.firstName} ${l.lastName} → ${v}` }); }}
                        options={LEAD_STATUSES.map((s) => ({ value: s.value, label: s.value }))}
                        renderValue={() => <LeadStatusBadge status={l.status} />}
                        className="!h-7 !w-auto !bg-transparent !px-1 !shadow-none hover:!bg-sunken"
                        width={180}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 text-[13px] text-fg-2">{l.source}</td>
                    <td className="num px-3 text-right text-[13px] font-medium">{money(l.estValue, { compact: true })}</td>
                    <td className="px-3"><RepChip id={l.ownerId} /></td>
                    <td className="whitespace-nowrap px-3 text-xs text-muted">{relTime(l.lastActivityAt)}</td>
                    <td className="pr-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <IconButton label="Call" size="sm" variant="secondary" onClick={() => dial({ type: 'lead', id: l.id })}><Phone className="size-3.5" /></IconButton>
                        <Menu trigger={({ toggle }) => <IconButton label="More" size="sm" onClick={toggle}><MoreHorizontal className="size-4" /></IconButton>}
                          items={[
                            { label: 'Schedule follow-up', icon: <CalendarPlus />, onClick: () => open({ kind: 'task', ref: { type: 'lead', id: l.id } }) },
                            { label: 'Send WhatsApp', icon: <MessageCircle />, onClick: () => useWhatsApp.getState().openChat({ type: 'lead', id: l.id }) },
                            { label: 'Send email', icon: <Mail />, onClick: () => toast({ title: 'Email composer opened', body: `To: ${l.email}` }) },
                            { label: 'Convert to deal', icon: <Briefcase />, onClick: () => { const d = useCRM.getState().convertLead(l.id); if (d) toast({ tone: 'success', title: 'Converted to deal', body: d.name, action: { label: 'View', onClick: () => nav(`/pipeline?deal=${d.id}`) } }); } },
                            ...(can('delete') ? [{ divider: true }, { label: 'Delete lead', icon: <Trash2 />, danger: true, onClick: () => { deleteLeads([l.id]); toast({ title: 'Lead deleted' }); } }] : [])
                          ]} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState icon={<Users2 />} title="No leads match these filters" body="Try a different search term or clear filters." action={<Button onClick={() => { setQ(''); setStatus([]); setSource([]); setOwners([]); setTemp([]); setView('all'); }}>Reset filters</Button>} />}
        </div>
        <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted">
          <span className="num">{filtered.length ? `${pg * PAGE + 1}–${Math.min(filtered.length, (pg + 1) * PAGE)} of ${filtered.length}` : '0 results'}</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" disabled={pg === 0} onClick={() => setPage(pg - 1)}>Previous</Button>
            <span className="num px-2">Page {pg + 1} / {pages}</span>
            <Button size="sm" variant="ghost" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>Next</Button>
          </div>
        </div>
      </Card>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      {broadcast && <BroadcastModal refs={broadcast.map((id) => ({ type: 'lead' as const, id }))} onClose={() => { setBroadcast(null); setSel([]); }} />}
    </div>
  );
}

function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const close = () => { onClose(); setTimeout(() => setStep(0), 200); };
  return (
    <Modal open={open} onClose={close} title="Import leads" description="CSV, Excel or a connected source" icon={<Upload />}
      footer={step === 0 ? <Button variant="ghost" onClick={close}>Cancel</Button> : step === 1 ? <><Button variant="ghost" onClick={() => setStep(0)}>Back</Button><Button variant="primary" onClick={() => setStep(2)}>Import 248 leads</Button></> : <Button variant="primary" onClick={close}>Done</Button>}>
      {step === 0 && (
        <button onClick={() => setStep(1)} className="flex w-full flex-col items-center rounded-xl border-2 border-dashed border-line-strong px-6 py-10 text-center transition hover:border-brand hover:bg-brand/[.03]">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand"><Upload className="size-5" /></span>
          <span className="mt-3 text-sm font-semibold">Drop a file or click to browse</span>
          <span className="mt-1 text-xs text-muted">Demo: click to simulate uploading <span className="font-mono">webinar-attendees-oct.csv</span></span>
        </button>
      )}
      {step === 1 && (
        <div className="space-y-2">
          <div className="text-xs text-muted">We matched 6 of 7 columns automatically.</div>
          {[['Full Name', 'First + last name'], ['Work Email', 'Email'], ['Company', 'Company'], ['Job Title', 'Title'], ['Phone', 'Phone'], ['Country', 'Country'], ['Notes', '— Skip —']].map(([a, b]) => (
            <div key={a} className="flex items-center gap-3 rounded-lg bg-sunken px-3 py-2 text-[13px]">
              <span className="w-32 font-mono text-xs text-fg-2">{a}</span><span className="text-faint">→</span><span className={cn('font-medium', b!.startsWith('—') && 'text-faint')}>{b}</span>
            </div>
          ))}
          <div className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">12 duplicates detected — they’ll be merged with existing records.</div>
        </div>
      )}
      {step === 2 && (
        <div className="py-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10 text-success"><UserCheck className="size-6" /></div>
          <div className="mt-3 text-sm font-semibold">248 leads imported</div>
          <div className="mt-1 text-xs text-muted">Scored and routed round-robin to the SDR team. 12 duplicates merged.</div>
        </div>
      )}
    </Modal>
  );
}
