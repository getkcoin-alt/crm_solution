import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, PhoneIncoming, PhoneCall, Delete, Clock3, Timer, PhoneMissed, Zap, Play, Square, ChevronDown, Search, SkipForward, Voicemail, Headphones, Activity, ArrowDownLeft, ArrowUpRight, Users2, CircleDot,
} from 'lucide-react';
import { ME, resolveRef } from '@/store/crm';
import { useScope, useCan } from '@/lib/access';
import { usePhone } from '@/store/phone';
import { toast } from '@/store/ui';
import { PageHeader, CallIcon, RepChip, StatTile } from '@/components/shared';
import { Avatar, Badge, Button, Card, CardHeader, IconButton, ScoreRing, EmptyState } from '@/components/ui/primitives';
import { FilterChip, SearchInput, Select, Tabs } from '@/components/ui/form';
import { Keypad } from '@/components/calling/Softphone';
import { RecordingPlayer } from '@/components/calling/RecordingPlayer';
import { TelephonyBanner } from '@/components/calling/TelephonyPanel';
import { useTelephony } from '@/store/telephony';
import { cn, DAY, dayLabel, duration, durationWords, fmtTime, pct, startOfDay, sum } from '@/lib/utils';
import type { EntityRef } from '@/types';

type Tab = 'queue' | 'log' | 'missed';

function Dialer() {
  const [num, setNum] = useState('');
  const tel = useTelephony();
  const [callerId, setCallerId] = useState('default');
  const { leads, contacts } = useScope();
  const dial = usePhone((s) => s.dial);
  const status = usePhone((s) => s.status);
  const matches = useMemo(() => {
    const t = num.trim().toLowerCase();
    if (t.length < 2) return [];
    const digits = t.replace(/\D/g, '');
    const L = leads.filter((l) => `${l.firstName} ${l.lastName} ${l.company}`.toLowerCase().includes(t) || (digits.length > 2 && l.phone.replace(/\D/g, '').includes(digits))).slice(0, 4).map((l) => ({ ref: { type: 'lead', id: l.id } as EntityRef, name: `${l.firstName} ${l.lastName}`, sub: l.company, phone: l.phone }));
    const C = contacts.filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(t) || (digits.length > 2 && c.phone.replace(/\D/g, '').includes(digits))).slice(0, 3).map((c) => ({ ref: { type: 'contact', id: c.id } as EntityRef, name: `${c.firstName} ${c.lastName}`, sub: c.title, phone: c.phone }));
    return [...L, ...C];
  }, [num, leads, contacts]);

  const call = () => {
    if (matches[0] && /[a-z]/i.test(num)) return dial(matches[0].ref);
    const digits = num.replace(/[^\d+]/g, '');
    if (digits.length < 3) { toast({ title: 'Enter a number or search a contact' }); return; }
    const m = [...leads.map((l) => ({ ref: { type: 'lead' as const, id: l.id }, p: l.phone })), ...contacts.map((c) => ({ ref: { type: 'contact' as const, id: c.id }, p: c.phone }))].find((x) => x.p.replace(/\D/g, '').endsWith(digits.replace(/\D/g, '').slice(-7)));
    if (m) dial(m.ref); else dial({ name: 'Unknown number', phone: num, subtitle: 'Not in CRM', hue: 220 });
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] font-semibold"><Phone className="size-4 text-muted" />Dialer</div>
        <Select size="sm" value={callerId} onChange={setCallerId} align="end" width={250} className="!w-auto"
          options={tel.numbers.length ? [{ value: 'default', label: `Default · ${tel.defaultNumber}` }, ...tel.numbers.filter((n) => n.number !== tel.defaultNumber).map((n) => ({ value: n.number, label: `${n.label} · ${n.number}` })), { value: 'local', label: 'Local presence (auto)' }] : [{ value: 'default', label: 'Demo line (simulated)' }]} />
      </div>
      <div className="p-4">
        <div className="relative">
          <input
            value={num}
            onChange={(e) => setNum(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && call()}
            placeholder="Name or number"
            className="num h-12 w-full rounded-xl bg-sunken px-4 pr-10 text-center text-[19px] font-medium tracking-[0.02em] outline-none ring-1 ring-inset ring-line placeholder:text-[15px] placeholder:font-normal placeholder:tracking-normal placeholder:text-faint focus:ring-brand"
          />
          {num && <button onClick={() => setNum(num.slice(0, -1))} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-fg"><Delete className="size-4" /></button>}
          {matches.length > 0 && (
            <div className="absolute inset-x-0 top-[52px] z-10 animate-pop-in rounded-xl bg-surface p-1 shadow-pop">
              {matches.map((m) => (
                <button key={m.ref.id} onClick={() => { dial(m.ref); setNum(''); }} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-sunken">
                  <Avatar name={m.name} size={26} hue={(m.sub.length * 41) % 360} />
                  <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-medium">{m.name}</div><div className="num truncate text-[11px] text-muted">{m.sub} · {m.phone}</div></div>
                  <Phone className="size-3.5 text-success" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4"><Keypad onKey={(k) => setNum((n) => n + k)} /></div>
        <button
          onClick={call}
          disabled={status !== 'idle'}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-success text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/.2),0_6px_16px_-6px_rgb(var(--success)/.6)] transition hover:brightness-110 active:scale-[.99] disabled:opacity-50"
        >
          <PhoneCall className="size-[18px]" />{status === 'idle' ? 'Call' : 'On a call'}
        </button>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-faint"><CircleDot className="size-3 text-danger" />Calls are recorded & transcribed · consent message on</div>
      </div>
    </Card>
  );
}

function TeamPresence() {
  const scope = useScope();
  const canMonitor = useCan()('monitor');
  const reps = scope.admin ? scope.teamReps : scope.peers;
  const order = { 'on-call': 0, online: 1, away: 2, offline: 3 } as const;
  const label = { 'on-call': 'On a call', online: 'Available', away: 'Away', offline: 'Offline' } as const;
  return (
    <Card>
      <CardHeader title="Team availability" icon={<Users2 />} subtitle={`${reps.filter((r) => r.presence === 'online').length} available · ${reps.filter((r) => r.presence === 'on-call').length} on calls`} />
      <div className="max-h-[300px] overflow-y-auto px-2 pb-2">
        {[...reps].sort((a, b) => order[a.presence] - order[b.presence]).map((r) => (
          <div key={r.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-sunken">
            <Avatar name={r.name} hue={r.hue} size={26} presence={r.presence} />
            <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-medium">{r.name}</div><div className="text-[11px] text-muted">{label[r.presence]}{r.presence === 'on-call' && <span className="num"> · {r.id === 'rep_marcus' ? '12:41' : '04:08'}</span>}</div></div>
            {r.presence === 'on-call' && canMonitor && r.id !== scope.viewer.id && <IconButton label="Listen in (whisper)" size="sm" onClick={() => toast({ title: `Listening to ${r.name.split(' ')[0]}’s call`, body: 'Whisper coaching mode — only the rep can hear you.' })}><Headphones className="size-3.5" /></IconButton>}
          </div>
        ))}
      </div>
    </Card>
  );
}

function PowerDialer() {
  const { leads, tasks } = useScope();
  const phone = usePhone();
  const [skipped, setSkipped] = useState<string[]>([]);
  const [called, setCalled] = useState<string[]>([]);
  const [session, setSession] = useState(false);
  const prev = useRef(phone.status);

  const queue = useMemo(() => {
    const taskLeadIds = tasks.filter((t) => !t.done && t.type === 'Call' && t.ref?.type === 'lead' && t.dueAt < startOfDay() + DAY).map((t) => t.ref!.id);
    const hot = leads.filter((l) => l.score >= 65 && ['New', 'Contacted', 'Qualified'].includes(l.status) && Date.now() - l.lastActivityAt > 20 * 3600_000).sort((a, b) => b.score - a.score).map((l) => l.id);
    return [...new Set([...taskLeadIds, ...hot])].slice(0, 14).map((id) => leads.find((l) => l.id === id)!).filter(Boolean);
  }, [leads, tasks]);
  const remaining = queue.filter((l) => !called.includes(l.id) && !skipped.includes(l.id));

  // Auto-advance the power dialer once a call is wrapped up.
  useEffect(() => {
    if (prev.current !== 'idle' && phone.status === 'idle' && session) {
      const next = remaining[0];
      if (next) { const t = setTimeout(() => { setCalled((c) => [...c, next.id]); usePhone.getState().dial({ type: 'lead', id: next.id }); }, 1400); prev.current = phone.status; return () => clearTimeout(t); }
      setSession(false); toast({ tone: 'success', title: 'Power dialer session complete', body: `${called.length} calls made` });
    }
    prev.current = phone.status;
  }, [phone.status, session, remaining, called.length]);

  const start = () => {
    const first = remaining[0];
    if (!first) return;
    setSession(true); setCalled((c) => [...c, first.id]);
    phone.dial({ type: 'lead', id: first.id });
  };
  const doneCount = called.length;
  return (
    <div>
      <div className="flex flex-col gap-3 border-b bg-gradient-to-r from-brand/[.07] via-transparent to-transparent px-4 py-3.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white shadow-[0_4px_12px_-4px_rgb(var(--brand)/.7)]"><Zap className="size-4" /></span>
          <div>
            <div className="text-[13px] font-semibold">Power dialer {session && <Badge tone="success" dot className="ml-1">Session live</Badge>}</div>
            <div className="text-xs text-muted">{queue.length} prioritized leads · overdue call tasks first, then hottest leads</div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="mr-1 hidden w-28 sm:block"><div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(doneCount / Math.max(1, queue.length)) * 100}%` }} /></div><div className="num mt-1 text-right text-[11px] text-muted">{doneCount}/{queue.length} dialed</div></div>
          {session ? <Button icon={<Square />} onClick={() => setSession(false)}>Stop session</Button> : <Button variant="primary" icon={<Play />} disabled={!remaining.length || phone.status !== 'idle'} onClick={start}>Start dialing</Button>}
        </div>
      </div>
      <div>
        {queue.map((l, i) => {
          const isCalled = called.includes(l.id), isSkipped = skipped.includes(l.id);
          const live = phone.target?.ref?.id === l.id && phone.status !== 'idle';
          return (
            <div key={l.id} className={cn('group flex items-center gap-3 border-b border-line/70 px-4 py-2.5 last:border-0', live && 'bg-success/[.06]', (isCalled && !live) || isSkipped ? 'opacity-50' : '')}>
              <span className="num w-5 text-center text-xs text-faint">{i + 1}</span>
              <ScoreRing score={l.score} size={32} />
              <div className="min-w-0 flex-1">
                <Link to={`/leads/${l.id}`} className="text-[13px] font-medium hover:underline">{l.firstName} {l.lastName}</Link>
                <div className="truncate text-xs text-muted">{l.title} · {l.company}</div>
              </div>
              <div className="hidden text-right text-xs md:block"><div className="num text-fg-2">{l.phone}</div><div className="text-faint">{l.city}</div></div>
              {live ? <Badge tone="success" dot>Live</Badge> : isCalled ? <Badge>Called</Badge> : isSkipped ? <Badge>Skipped</Badge> : (
                <div className="flex items-center gap-1">
                  <IconButton label="Skip" size="sm" className="opacity-0 group-hover:opacity-100" onClick={() => setSkipped((s) => [...s, l.id])}><SkipForward className="size-3.5" /></IconButton>
                  <Button size="sm" icon={<Phone />} disabled={phone.status !== 'idle'} onClick={() => { setCalled((c) => [...c, l.id]); phone.dial({ type: 'lead', id: l.id }); }}>Call</Button>
                </div>
              )}
            </div>
          );
        })}
        {!queue.length && <EmptyState icon={<Zap />} title="Queue is clear" body="No pending calls — great work." />}
      </div>
    </div>
  );
}

function CallLog({ missedOnly }: { missedOnly?: boolean }) {
  const { calls } = useScope();
  const scopeR = useScope();
  const reps = scopeR.admin ? scopeR.teamReps : scopeR.peers;
  const dial = usePhone((s) => s.dial);
  const [q, setQ] = useState('');
  const [dir, setDir] = useState<string[]>([]);
  const [st, setSt] = useState<string[]>([]);
  const [rp, setRp] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [limit, setLimit] = useState(30);

  const rows = useMemo(() => calls.filter((c) => {
    if (missedOnly && !(c.status === 'missed' || c.status === 'voicemail')) return false;
    if (dir.length && !dir.includes(c.direction)) return false;
    if (st.length && !st.includes(c.status)) return false;
    if (rp.length && !rp.includes(c.repId)) return false;
    if (q) { const p = resolveRef(c.ref); if (!`${p?.name} ${p?.company} ${c.phone} ${c.notes}`.toLowerCase().includes(q.toLowerCase())) return false; }
    return true;
  }), [calls, q, dir, st, rp, missedOnly]);

  let lastDay = 0;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <SearchInput value={q} onChange={setQ} placeholder="Search calls, notes, numbers…" className="w-full sm:w-60" />
        {!missedOnly && <FilterChip label="Direction" values={dir} onChange={setDir} options={[{ value: 'inbound', label: 'Inbound', icon: <ArrowDownLeft /> }, { value: 'outbound', label: 'Outbound', icon: <ArrowUpRight /> }]} />}
        {!missedOnly && <FilterChip label="Status" values={st} onChange={setSt} options={[{ value: 'completed', label: 'Connected' }, { value: 'no-answer', label: 'No answer' }, { value: 'voicemail', label: 'Voicemail' }, { value: 'missed', label: 'Missed' }]} />}
        <FilterChip label="Rep" values={rp} onChange={setRp} options={reps.map((r) => ({ value: r.id, label: r.name, icon: <Avatar name={r.name} hue={r.hue} size={16} /> }))} />
        <span className="num ml-auto text-xs text-muted">{rows.length} calls</span>
      </div>
      <div className="scroll-x">
        <table className="w-full min-w-[820px]">
          <tbody>
            {rows.slice(0, limit).map((c) => {
              const p = resolveRef(c.ref);
              const day = startOfDay(c.startedAt);
              const head = day !== lastDay; lastDay = day;
              const ex = expanded === c.id;
              return (
                <Fragment key={c.id}>
                  {head && <tr><td colSpan={7} className="bg-surface-2 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">{dayLabel(c.startedAt)}</td></tr>}
                  <tr onClick={() => setExpanded(ex ? null : c.id)} className={cn('group h-[52px] cursor-pointer border-b border-line/70 transition-colors', ex ? 'bg-surface-2' : 'hover:bg-surface-2')}>
                    <td className="w-12 pl-4"><CallIcon call={c} /></td>
                    <td className="px-3">
                      <Link to={p?.href ?? '#'} onClick={(e) => e.stopPropagation()} className="text-[13px] font-medium hover:underline">{p?.name ?? 'Unknown'}</Link>
                      <div className="num text-xs text-muted">{p?.company} · {c.phone}</div>
                    </td>
                    <td className="px-3"><Badge tone={c.disposition === 'Meeting booked' || c.disposition === 'Interested' ? 'success' : c.disposition === 'Not interested' ? 'danger' : c.disposition === 'Call back later' ? 'warning' : 'neutral'}>{c.disposition}</Badge></td>
                    <td className="px-3"><span className="num text-[13px] font-medium">{c.duration ? duration(c.duration) : '—'}</span>{c.recorded && <span className="ml-2 inline-flex items-center gap-1 rounded bg-danger/10 px-1 text-[10px] font-semibold text-danger">● REC</span>}</td>
                    <td className="px-3"><RepChip id={c.repId} /></td>
                    <td className="num whitespace-nowrap px-3 text-xs text-muted">{fmtTime(c.startedAt)}</td>
                    <td className="pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton label="Call back" size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); dial(c.ref); }}><Phone className="size-3.5" /></IconButton>
                        <ChevronDown className={cn('size-4 text-faint transition', ex && 'rotate-180')} />
                      </div>
                    </td>
                  </tr>
                  {ex && (
                    <tr className="border-b border-line/70 bg-surface-2">
                      <td />
                      <td colSpan={6} className="px-3 pb-4 pt-1">
                        <div className="grid gap-3 lg:grid-cols-2">
                          <div>
                            <div className="eyebrow mb-1">Notes</div>
                            <p className="text-[13px] leading-[1.5] text-fg-2">{c.notes || '—'}</p>
                            {c.summary && <><div className="eyebrow mb-1 mt-3">Vico AI summary</div><p className="text-[13px] leading-[1.5] text-fg-2">{c.summary}</p></>}
                          </div>
                          <div>
                            {c.recorded ? <><div className="eyebrow mb-1.5">Recording</div><RecordingPlayer ownerId={c.repId} seed={c.id} length={c.duration} /></> : <div className="text-xs text-faint">No recording for this call.</div>}
                            {c.sentiment && <div className="mt-2 flex gap-1.5"><Badge tone={c.sentiment === 'positive' ? 'success' : c.sentiment === 'negative' ? 'danger' : 'neutral'}>Sentiment: {c.sentiment}</Badge><Badge>{c.direction}</Badge></div>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <EmptyState icon={<PhoneMissed />} title="No calls found" body="Adjust filters to see more." />}
      </div>
      {rows.length > limit && <div className="border-t p-3 text-center"><Button size="sm" variant="ghost" onClick={() => setLimit(limit + 40)}>Load more ({rows.length - limit} remaining)</Button></div>}
    </div>
  );
}

export default function Calls() {
  const calls = useScope().calls;
  const simulate = usePhone((s) => s.simulateIncoming);
  const status = usePhone((s) => s.status);
  const [tab, setTab] = useState<Tab>('queue');
  const today = calls.filter((c) => c.startedAt >= startOfDay());
  const mine = today.filter((c) => c.repId === ME);
  const conn = today.filter((c) => c.status === 'completed');
  const talk = sum(conn, (c) => c.duration);
  const missed = calls.filter((c) => (c.status === 'missed' || c.status === 'voicemail') && c.startedAt > Date.now() - 2 * DAY);

  return (
    <div>
      <PageHeader
        title="Calling"
        subtitle="Dial, record, transcribe and log — every conversation lands on the right timeline automatically."
        actions={<>
          <Button icon={<PhoneIncoming />} disabled={status !== 'idle'} onClick={() => simulate()}>Simulate incoming call</Button>
        </>}
      />
      <TelephonyBanner />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Calls today" value={today.length} sub={<><span className="num">{mine.length}</span> by you</>} icon={<PhoneCall />} accent="#5856ee" />
        <StatTile label="Connect rate" value={pct(conn.length / Math.max(1, today.length))} sub="Team avg 58%" icon={<Activity />} accent="#22a06b" />
        <StatTile label="Talk time" value={durationWords(talk)} sub="Across the team" icon={<Clock3 />} accent="#8b6cf6" />
        <StatTile label="Avg. handle time" value={duration(talk / Math.max(1, conn.length))} sub="Target < 8:00" icon={<Timer />} accent="#e8a23b" />
        <StatTile label="Need callback" value={missed.length} sub="Missed & voicemail · 48h" icon={<Voicemail />} accent="#e05260" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Dialer />
          <TeamPresence />
        </div>
        <Card className="min-w-0 overflow-hidden">
          <Tabs className="px-3" value={tab} onChange={setTab} tabs={[
            { value: 'queue', label: 'Call queue', icon: <Zap /> },
            { value: 'log', label: 'Call log', count: calls.length, icon: <Search /> },
            { value: 'missed', label: 'Missed & voicemail', count: missed.length, icon: <PhoneMissed /> },
          ]} />
          {tab === 'queue' && <PowerDialer />}
          {tab === 'log' && <CallLog />}
          {tab === 'missed' && <CallLog missedOnly />}
        </Card>
      </div>
    </div>
  );
}
