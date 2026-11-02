import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, LayoutGrid, Table2, CalendarDays, Flag, Phone, Mail, Building2, User2, X, Trophy, Clock3, Target, Check, ArrowUpRight, Users2, AlertTriangle } from 'lucide-react';
import { useCRM, resolveRef } from '@/store/crm';
import { usePhone } from '@/store/phone';
import { useUI, toast } from '@/store/ui';
import { PageHeader, RepChip, RepSelect, StageBadge } from '@/components/shared';
import { Avatar, Badge, Button, Card, CompanyLogo, IconButton, Progress } from '@/components/ui/primitives';
import { FilterChip, SearchInput, Segmented, Select, Textarea } from '@/components/ui/form';
import { Drawer, Modal } from '@/components/ui/overlay';
import { Timeline } from '@/components/Timeline';
import { cn, DAY, fmtDate, money, pct, sum } from '@/lib/utils';
import type { Deal, Stage } from '@/types';

const prioTone = { High: 'danger', Medium: 'warning', Low: 'neutral' } as const;

function DealCard({ d, onOpen, dragging, onDragStart, onDragEnd }: { d: Deal; onOpen: () => void; dragging: boolean; onDragStart: () => void; onDragEnd: () => void }) {
  const co = useCRM((s) => s.companies.find((c) => c.id === d.companyId));
  const days = Math.floor((Date.now() - d.stageChangedAt) / DAY);
  const overdue = !d.stage.startsWith('Closed') && d.closeDate < Date.now();
  const stale = !d.stage.startsWith('Closed') && days > 18;
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', d.id); e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={cn(
        'group cursor-grab select-none rounded-[10px] bg-surface p-3 shadow-[0_1px_2px_rgb(var(--shadow)/.06),0_0_0_1px_rgb(var(--line-strong))] transition-[box-shadow,transform,opacity] hover:shadow-[0_6px_16px_-6px_rgb(var(--shadow)/.18),0_0_0_1px_rgb(var(--faint)/.5)] active:cursor-grabbing',
        dragging && 'rotate-[1.5deg] opacity-40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="line-clamp-2 text-[13px] font-medium leading-[1.35]">{d.name}</div>
        <Flag className={cn('mt-0.5 size-3.5 shrink-0', d.priority === 'High' ? 'fill-danger text-danger' : d.priority === 'Medium' ? 'text-warning' : 'text-faint')} />
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        {co && <CompanyLogo name={co.name} hue={co.hue} size={16} />}<span className="truncate">{co?.name}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="num text-[14px] font-semibold tracking-[-0.01em]">{money(d.value)}</span>
        <RepChip id={d.ownerId} showName={false} size={20} />
      </div>
      <div className="mt-2.5 flex items-center gap-2 border-t border-dashed pt-2.5 text-[11px]">
        <span className={cn('flex items-center gap-1', overdue ? 'font-medium text-danger' : 'text-muted')}><CalendarDays className="size-3" />{fmtDate(d.closeDate)}</span>
        {stale ? <span className="flex items-center gap-1 text-warning"><AlertTriangle className="size-3" />{days}d idle</span> : <span className="flex items-center gap-1 text-faint"><Clock3 className="size-3" />{days}d in stage</span>}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const { deals, stages, reps, moveDeal, companies } = useCRM();
  const open = useUI((s) => s.open);
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<'board' | 'table'>('board');
  const [q, setQ] = useState('');
  const [owners, setOwners] = useState<string[]>([]);
  const [prio, setPrio] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [lostFor, setLostFor] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const openId = params.get('deal');

  const filtered = useMemo(() => deals.filter((d) => {
    const co = companies.find((c) => c.id === d.companyId);
    return (!q || `${d.name} ${co?.name}`.toLowerCase().includes(q.toLowerCase())) && (!owners.length || owners.includes(d.ownerId)) && (!prio.length || prio.includes(d.priority));
  }), [deals, q, owners, prio, companies]);

  const open_ = filtered.filter((d) => !d.stage.startsWith('Closed'));
  const total = sum(open_, (d) => d.value);
  const weighted = sum(open_, (d) => d.value * d.probability);

  const drop = (stage: Stage) => {
    const id = dragId; setOver(null); setDragId(null);
    if (!id) return;
    const d = deals.find((x) => x.id === id);
    if (!d || d.stage === stage) return;
    if (stage === 'Closed Lost') { setLostFor(id); return; }
    moveDeal(id, stage);
    if (stage === 'Closed Won') { setCelebrate(d.name); setTimeout(() => setCelebrate(null), 2600); }
    toast({ tone: stage === 'Closed Won' ? 'success' : 'default', title: stage === 'Closed Won' ? 'Deal won 🎉' : `Moved to ${stage}`, body: `${d.name} · ${money(d.value)}`, action: { label: 'Undo', onClick: () => useCRM.getState().moveDeal(id, d.stage) } });
  };

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle={<><span className="num font-medium text-fg">{money(total)}</span> open across {open_.length} deals · <span className="num">{money(weighted)}</span> weighted</>}
        actions={<>
          <Segmented value={view} onChange={setView} options={[{ value: 'board', label: 'Board', icon: <LayoutGrid /> }, { value: 'table', label: 'Table', icon: <Table2 /> }]} />
          <Button variant="primary" icon={<Plus />} onClick={() => open({ kind: 'deal' })}>New deal</Button>
        </>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search deals or companies…" className="w-full sm:w-64" />
        <FilterChip label="Owner" icon={<Users2 />} values={owners} onChange={setOwners} options={reps.filter((r) => r.role !== 'SDR').map((r) => ({ value: r.id, label: r.name, icon: <Avatar name={r.name} hue={r.hue} size={16} /> }))} />
        <FilterChip label="Priority" icon={<Flag />} values={prio} onChange={setPrio} options={['High', 'Medium', 'Low'].map((p) => ({ value: p, label: p }))} />
        <div className="ml-auto hidden items-center gap-4 text-xs text-muted lg:flex">
          <span className="flex items-center gap-1.5"><Target className="size-3.5" />Avg. deal <b className="num font-semibold text-fg">{money(total / Math.max(1, open_.length), { compact: true })}</b></span>
          <span className="flex items-center gap-1.5"><Trophy className="size-3.5" />Won this quarter <b className="num font-semibold text-fg">{money(sum(filtered.filter((d) => d.stage === 'Closed Won'), (d) => d.value), { compact: true })}</b></span>
        </div>
      </div>

      {view === 'board' ? (
        <div className="scroll-x -mx-4 px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex min-w-max gap-3">
            {stages.map((st) => {
              const items = filtered.filter((d) => d.stage === st.id).sort((a, b) => b.value - a.value);
              const v = sum(items, (d) => d.value);
              const isOver = over === st.id && dragId && deals.find((d) => d.id === dragId)?.stage !== st.id;
              return (
                <div
                  key={st.id}
                  onDragOver={(e) => { e.preventDefault(); setOver(st.id); }}
                  onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
                  onDrop={(e) => { e.preventDefault(); drop(st.id); }}
                  className={cn('flex w-[284px] shrink-0 flex-col rounded-xl bg-sunken/70 p-2 shadow-[inset_0_0_0_1px_rgb(var(--line))] transition-[background,box-shadow]', isOver && 'bg-brand/[.06] shadow-[inset_0_0_0_1.5px_rgb(var(--brand)/.5)]')}
                >
                  <div className="px-1.5 pb-2.5 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ background: st.color }} />
                      <span className="text-[13px] font-semibold">{st.id}</span>
                      <span className="num rounded bg-surface px-1.5 text-[11px] font-medium text-muted shadow-[0_0_0_1px_rgb(var(--line))]">{items.length}</span>
                      <button onClick={() => open({ kind: 'deal' })} className="ml-auto rounded p-0.5 text-faint hover:bg-surface hover:text-fg"><Plus className="size-3.5" /></button>
                    </div>
                    <div className="mt-1.5 flex items-baseline justify-between text-xs">
                      <span className="num font-semibold text-fg-2">{money(v, { compact: true })}</span>
                      <span className="text-faint">{Math.round(st.probability * 100)}% · {money(v * st.probability, { compact: true })} wtd</span>
                    </div>
                    <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-line"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (v / Math.max(1, total)) * 220)}%`, background: st.color }} /></div>
                  </div>
                  <div className="flex min-h-[120px] flex-1 flex-col gap-2">
                    {items.map((d) => (
                      <DealCard key={d.id} d={d} dragging={dragId === d.id} onDragStart={() => setDragId(d.id)} onDragEnd={() => { setDragId(null); setOver(null); }} onOpen={() => setParams({ deal: d.id })} />
                    ))}
                    {isOver && <div className="h-16 rounded-[10px] border-2 border-dashed border-brand/40 bg-brand/[.04]" />}
                    {!items.length && !isOver && <div className="flex h-24 items-center justify-center rounded-[10px] border border-dashed border-line-strong text-xs text-faint">Drop deals here</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="scroll-x">
            <table className="w-full min-w-[980px]">
              <thead className="border-b bg-surface-2 text-left text-[11.5px] text-muted">
                <tr>{['Deal', 'Company', 'Stage', 'Value', 'Probability', 'Close date', 'Priority', 'Owner'].map((h) => <th key={h} className={cn('h-9 px-3 font-medium', h === 'Value' && 'text-right')}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => stages.findIndex((s) => s.id === a.stage) - stages.findIndex((s) => s.id === b.stage) || b.value - a.value).map((d) => {
                  const co = companies.find((c) => c.id === d.companyId);
                  return (
                    <tr key={d.id} onClick={() => setParams({ deal: d.id })} className="h-12 cursor-pointer border-b border-line/70 last:border-0 hover:bg-surface-2">
                      <td className="px-3 text-[13px] font-medium">{d.name}</td>
                      <td className="px-3"><span className="flex items-center gap-2 whitespace-nowrap text-[13px] text-fg-2">{co && <CompanyLogo name={co.name} hue={co.hue} size={20} />}{co?.name}</span></td>
                      <td className="px-3" onClick={(e) => e.stopPropagation()}>
                        <Select value={d.stage} onChange={(v) => { if (v === 'Closed Lost') setLostFor(d.id); else { moveDeal(d.id, v); toast({ title: `Moved to ${v}`, body: d.name }); } }} options={stages.map((s) => ({ value: s.id, label: s.id, icon: <span className="block size-2 rounded-full" style={{ background: s.color }} /> }))} renderValue={() => <StageBadge stage={d.stage} />} className="!h-7 !w-auto !bg-transparent !px-1 !shadow-none hover:!bg-sunken" width={200} />
                      </td>
                      <td className="num px-3 text-right text-[13px] font-semibold">{money(d.value)}</td>
                      <td className="px-3"><div className="flex w-28 items-center gap-2"><Progress value={d.probability} height={5} /><span className="num text-xs text-muted">{pct(d.probability)}</span></div></td>
                      <td className={cn('whitespace-nowrap px-3 text-[13px]', !d.stage.startsWith('Closed') && d.closeDate < Date.now() ? 'text-danger' : 'text-fg-2')}>{fmtDate(d.closeDate, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-3"><Badge tone={prioTone[d.priority]}>{d.priority}</Badge></td>
                      <td className="px-3"><RepChip id={d.ownerId} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {openId && <DealDrawer id={openId} onClose={() => setParams({})} onLost={() => setLostFor(openId)} />}
      {lostFor && <LostModal id={lostFor} onClose={() => setLostFor(null)} />}
      {celebrate && (
        <div className="pointer-events-none fixed inset-0 z-[96] flex items-center justify-center">
          <div className="animate-pop-in rounded-2xl bg-surface px-8 py-6 text-center shadow-float">
            <div className="text-4xl">🏆</div>
            <div className="mt-2 text-base font-semibold">Closed Won!</div>
            <div className="mt-0.5 text-xs text-muted">{celebrate}</div>
          </div>
          {Array.from({ length: 36 }).map((_, i) => (
            <span key={i} className="absolute size-2 rounded-sm" style={{ left: `${50 + Math.cos(i) * 8}%`, top: '50%', background: ['#5856ee', '#22a06b', '#e8a23b', '#e8508a', '#2584eb'][i % 5], animation: `confetti${i % 4} 1.6s cubic-bezier(.2,.7,.3,1) forwards`, transform: `rotate(${i * 30}deg)` }} />
          ))}
          <style>{`
            @keyframes confetti0 { to { transform: translate(-240px, -260px) rotate(540deg); opacity: 0 } }
            @keyframes confetti1 { to { transform: translate(260px, -220px) rotate(-420deg); opacity: 0 } }
            @keyframes confetti2 { to { transform: translate(-180px, 240px) rotate(380deg); opacity: 0 } }
            @keyframes confetti3 { to { transform: translate(220px, 260px) rotate(-500deg); opacity: 0 } }
          `}</style>
        </div>
      )}
    </div>
  );
}

function LostModal({ id, onClose }: { id: string; onClose: () => void }) {
  const d = useCRM((s) => s.deals.find((x) => x.id === id));
  const [reason, setReason] = useState('Chose competitor');
  const [note, setNote] = useState('');
  if (!d) return null;
  return (
    <Modal open onClose={onClose} title="Mark deal as lost" description={d.name} icon={<X />}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={() => { useCRM.getState().moveDeal(id, 'Closed Lost'); useCRM.getState().updateDeal(id, { lostReason: reason }); toast({ title: 'Deal marked as lost', body: `${reason} — added to win/loss analysis` }); onClose(); }}>Mark as lost</Button></>}>
      <div className="space-y-3">
        <div>
          <div className="label">Loss reason</div>
          <div className="flex flex-wrap gap-1.5">
            {['Chose competitor', 'No budget', 'Went dark', 'Built in-house', 'Timing', 'Missing feature'].map((r) => (
              <button key={r} onClick={() => setReason(r)} className={cn('h-8 rounded-lg px-3 text-xs font-medium', reason === r ? 'bg-fg text-bg' : 'bg-sunken text-fg-2 hover:bg-line')}>{r}</button>
            ))}
          </div>
        </div>
        <div><div className="label">Notes for the team</div><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What could we have done differently?" /></div>
      </div>
    </Modal>
  );
}

function DealDrawer({ id, onClose, onLost }: { id: string; onClose: () => void; onLost: () => void }) {
  const d = useCRM((s) => s.deals.find((x) => x.id === id));
  const { stages, moveDeal, updateDeal } = useCRM();
  const co = useCRM((s) => s.companies.find((c) => c.id === d?.companyId));
  const ct = useCRM((s) => s.contacts.find((c) => c.id === d?.contactId));
  const dial = usePhone((s) => s.dial);
  const nav = useNavigate();
  const [next, setNext] = useState(d?.nextStep ?? '');
  if (!d) return null;
  const idx = stages.findIndex((s) => s.id === d.stage);
  const ref = ct ? { type: 'contact' as const, id: ct.id } : undefined;
  const party = ref ? resolveRef(ref) : undefined;

  return (
    <Drawer open onClose={onClose} width={620}>
      <div className="flex items-start gap-3 border-b px-5 pb-4 pt-5">
        {co && <CompanyLogo name={co.name} hue={co.hue} size={40} />}
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold tracking-[-0.01em]">{d.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted"><span>{co?.name}</span><span>·</span><span>{d.product}</span><Badge tone={prioTone[d.priority]}>{d.priority} priority</Badge></div>
        </div>
        <IconButton label="Close" onClick={onClose}><X className="size-4" /></IconButton>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4">
          <div className="flex gap-1">
            {stages.filter((s) => s.id !== 'Closed Lost').map((s, i) => {
              const done = d.stage !== 'Closed Lost' && i <= idx;
              return (
                <button key={s.id} onClick={() => { moveDeal(d.id, s.id); toast({ title: `Moved to ${s.id}` }); }} className="group flex-1 text-left">
                  <div className={cn('h-1.5 rounded-full transition', done ? '' : 'bg-line group-hover:bg-line-strong')} style={done ? { background: stages[Math.min(idx, 4)]!.color } : undefined} />
                  <div className={cn('mt-1.5 flex items-center gap-1 truncate text-[11px] font-medium', s.id === d.stage ? 'text-fg' : 'text-faint group-hover:text-muted')}>{done && i < idx && <Check className="size-3" />}{s.id}</div>
                </button>
              );
            })}
          </div>
          {d.stage === 'Closed Lost' && <div className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">Lost · {d.lostReason}</div>}

          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line shadow-[0_0_0_1px_rgb(var(--line))] sm:grid-cols-4">
            {[['Value', money(d.value)], ['Probability', pct(d.probability)], ['Weighted', money(d.value * d.probability, { compact: true })], ['Close date', fmtDate(d.closeDate, { month: 'short', day: 'numeric', year: 'numeric' })]].map(([k, v]) => (
              <div key={k} className="bg-surface px-3 py-2.5"><div className="text-[11px] text-faint">{k}</div><div className="num mt-0.5 text-[14px] font-semibold">{v}</div></div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="label">Owner</div>
              <RepSelect value={d.ownerId} onChange={(v) => { if (v) { updateDeal(d.id, { ownerId: v }); toast({ title: 'Owner updated' }); } }} />
            </div>
            <div>
              <div className="label">Next step</div>
              <input className="input" value={next} onChange={(e) => setNext(e.target.value)} onBlur={() => next !== d.nextStep && (updateDeal(d.id, { nextStep: next }), toast({ title: 'Next step saved' }))} />
            </div>
          </div>

          {ct && (
            <div className="mt-5 flex items-center gap-3 rounded-xl p-3 shadow-[inset_0_0_0_1px_rgb(var(--line))]">
              <Avatar name={`${ct.firstName} ${ct.lastName}`} hue={co?.hue} size={36} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">{ct.firstName} {ct.lastName} <span className="font-normal text-faint">· {ct.persona}</span></div>
                <div className="truncate text-xs text-muted">{ct.title}</div>
              </div>
              <IconButton label="Email" variant="secondary" size="sm" onClick={() => toast({ title: 'Email composer opened', body: ct.email })}><Mail className="size-3.5" /></IconButton>
              <Button size="sm" variant="primary" icon={<Phone />} onClick={() => ref && dial(ref)}>Call</Button>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            {co && <Button size="sm" variant="ghost" icon={<Building2 />} onClick={() => nav(`/companies?id=${co.id}`)}>View company<ArrowUpRight className="!size-3" /></Button>}
            {ct && <Button size="sm" variant="ghost" icon={<User2 />} onClick={() => nav(`/contacts?id=${ct.id}`)}>View contact</Button>}
            {d.stage !== 'Closed Lost' && <Button size="sm" variant="ghost" className="ml-auto !text-danger" onClick={onLost}>Mark lost</Button>}
          </div>
        </div>
        {ref && party && (
          <div className="border-t px-5 py-4">
            <div className="mb-3 text-[13px] font-semibold">Activity with {party.name}</div>
            <Timeline entity={ref} stickyTop="top-0" />
          </div>
        )}
      </div>
    </Drawer>
  );
}
