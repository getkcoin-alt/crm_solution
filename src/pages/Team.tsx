import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Trophy, PhoneCall, Target, Wallet, UserPlus, X, Mail, Phone, Medal, ArrowUp, ArrowDown, Headphones, CalendarCheck2 } from 'lucide-react';
import { useCRM, resolveRef } from '@/store/crm';
import { toast } from '@/store/ui';
import { repStats, type RepStats } from '@/lib/metrics';
import { PageHeader, StatTile, Sparkline, ChartTooltip, StageBadge, CallIcon } from '@/components/shared';
import { Avatar, Badge, Button, Card, CardHeader, IconButton, Progress, RadialProgress } from '@/components/ui/primitives';
import { Segmented, Field, Input, Select } from '@/components/ui/form';
import { Drawer, Modal } from '@/components/ui/overlay';
import { cn, DAY, durationWords, fmtDate, money, num, pct, relTime, startOfDay, sum } from '@/lib/utils';
import type { Role, Team as TeamT } from '@/types';

type SortKey = 'revenue' | 'attainment' | 'pipeline' | 'winRate' | 'calls30' | 'connectRate' | 'meetings30';
const attColor = (a: number) => (a >= 0.6 ? '#22a06b' : a >= 0.3 ? 'rgb(var(--brand))' : '#e8a23b');

export default function Team() {
  const { reps, deals, calls, leads } = useCRM();
  const [team, setTeam] = useState<'all' | TeamT>('all');
  const [sort, setSort] = useState<{ k: SortKey; d: 1 | -1 }>({ k: 'revenue', d: -1 });
  const [openRep, setOpenRep] = useState<string | null>(null);
  const [invite, setInvite] = useState(false);

  const stats = useMemo(() => reps.filter((r) => r.role !== 'Admin' && (team === 'all' || r.team === team)).map((r) => repStats(r, deals, calls, leads)), [reps, deals, calls, leads, team]);
  const sorted = [...stats].sort((a, b) => (a[sort.k] - b[sort.k]) * sort.d);
  const top = [...stats].sort((a, b) => b.revenue - a.revenue);
  const quota = sum(stats, (s) => s.rep.quota);
  const rev = sum(stats, (s) => s.revenue);

  const th = (k: SortKey, label: string) => (
    <th className="h-9 whitespace-nowrap px-3 text-right text-[11.5px] font-medium text-muted">
      <button onClick={() => setSort((s) => ({ k, d: s.k === k ? (s.d === 1 ? -1 : 1) : -1 }))} className="inline-flex items-center gap-1 hover:text-fg">{label}{sort.k === k && (sort.d === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}</button>
    </th>
  );

  return (
    <div>
      <PageHeader title="Team" subtitle={`${reps.length} members · ${reps.filter((r) => r.presence === 'online' || r.presence === 'on-call').length} online now`}
        actions={<>
          <Segmented value={team} onChange={setTeam} options={[{ value: 'all', label: 'All teams' }, { value: 'Enterprise', label: 'Enterprise' }, { value: 'Mid-Market', label: 'Mid-Market' }, { value: 'Growth', label: 'Growth' }]} />
          <Button variant="primary" icon={<UserPlus />} onClick={() => setInvite(true)}>Invite</Button>
        </>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Revenue · QTD" value={money(rev, { compact: true })} sub={`${pct(rev / Math.max(1, quota))} of ${money(quota, { compact: true })} quota`} icon={<Wallet />} accent="#5856ee" />
        <StatTile label="Open pipeline" value={money(sum(stats, (s) => s.pipeline), { compact: true })} sub={`${(sum(stats, (s) => s.pipeline) / Math.max(1, quota - rev)).toFixed(1)}× coverage of remaining quota`} icon={<Target />} accent="#8b6cf6" />
        <StatTile label="Calls · 30 days" value={num(sum(stats, (s) => s.calls30))} sub={`${pct(sum(stats, (s) => s.connected30) / Math.max(1, sum(stats, (s) => s.calls30)))} connect rate`} icon={<PhoneCall />} accent="#22a06b" />
        <StatTile label="Meetings booked" value={sum(stats, (s) => s.meetings30)} sub="From calls · 30 days" icon={<CalendarCheck2 />} accent="#e8a23b" />
      </div>

      {/* Podium */}
      {top.length >= 3 && (
        <Card className="mb-4 overflow-hidden">
          <div className="grid grid-cols-1 divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
            {top.slice(0, 3).map((s, i) => (
              <button key={s.rep.id} onClick={() => setOpenRep(s.rep.id)} className="relative flex items-center gap-4 p-5 text-left transition hover:bg-surface-2">
                {i === 0 && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_100%_at_0%_0%,rgb(232_162_59/.12),transparent_60%)]" />}
                <span className="relative">
                  <Avatar name={s.rep.name} hue={s.rep.hue} size={48} presence={s.rep.presence} />
                  <span className={cn('absolute -left-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-surface', i === 0 ? 'bg-[#e8a23b]' : i === 1 ? 'bg-[#9aa0ad]' : 'bg-[#c27c4e]')}>{i + 1}</span>
                </span>
                <div className="relative min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold">{s.rep.name}{i === 0 && <Trophy className="size-3.5 text-[#e8a23b]" />}</div>
                  <div className="text-xs text-muted">{s.rep.title}</div>
                  <div className="num mt-1 text-lg font-semibold tracking-[-0.01em]">{money(s.revenue, { compact: true })}</div>
                </div>
                <RadialProgress value={s.attainment} size={58} stroke={5} color={attColor(s.attainment)}><span className="num text-[12px] font-semibold">{pct(s.attainment)}</span></RadialProgress>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {stats.map((s) => (
          <button key={s.rep.id} onClick={() => setOpenRep(s.rep.id)} className="card group p-4 text-left transition hover:-translate-y-px hover:shadow-pop">
            <div className="flex items-center gap-3">
              <Avatar name={s.rep.name} hue={s.rep.hue} size={38} presence={s.rep.presence} />
              <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold">{s.rep.name}</div><div className="truncate text-xs text-muted">{s.rep.title}</div></div>
              <Badge>{s.rep.team}</Badge>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex items-baseline justify-between text-xs"><span className="text-muted">Quota attainment</span><span className="num font-semibold">{money(s.revenue, { compact: true })} <span className="font-normal text-faint">/ {money(s.rep.quota, { compact: true })}</span></span></div>
              <Progress value={s.attainment} tone={s.attainment >= 0.6 ? 'success' : s.attainment >= 0.3 ? 'brand' : 'warning'} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[['Pipeline', money(s.pipeline, { compact: true })], ['Win rate', s.won + s.lost ? pct(s.winRate) : '—'], ['Calls 7d', s.calls7]].map(([k, v]) => (
                <div key={k as string} className="rounded-lg bg-sunken py-2"><div className="num text-[13px] font-semibold">{v}</div><div className="text-[10.5px] text-muted">{k}</div></div>
              ))}
            </div>
            <div className="mt-3 h-8 opacity-80 transition group-hover:opacity-100"><Sparkline data={s.callsByDay} height={32} color={attColor(s.attainment)} /></div>
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Performance leaderboard" icon={<Medal />} subtitle="Quarter to date · calls over trailing 30 days" />
        <div className="scroll-x">
          <table className="w-full min-w-[980px]">
            <thead className="border-y bg-surface-2"><tr>
              <th className="h-9 pl-4 text-left text-[11.5px] font-medium text-muted">#</th>
              <th className="px-3 text-left text-[11.5px] font-medium text-muted">Rep</th>
              {th('revenue', 'Revenue')}{th('attainment', 'Quota')}{th('pipeline', 'Pipeline')}{th('winRate', 'Win rate')}{th('calls30', 'Calls')}{th('connectRate', 'Connect')}{th('meetings30', 'Meetings')}
              <th className="px-3 pr-4 text-right text-[11.5px] font-medium text-muted">Talk time</th>
            </tr></thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={s.rep.id} onClick={() => setOpenRep(s.rep.id)} className="h-12 cursor-pointer border-b border-line/70 last:border-0 hover:bg-surface-2">
                  <td className="num pl-4 text-xs text-faint">{i + 1}</td>
                  <td className="px-3"><span className="flex items-center gap-2.5"><Avatar name={s.rep.name} hue={s.rep.hue} size={26} presence={s.rep.presence} /><span><span className="block text-[13px] font-medium">{s.rep.name}</span><span className="block text-[11px] text-muted">{s.rep.role}</span></span></span></td>
                  <td className="num px-3 text-right text-[13px] font-semibold">{money(s.revenue, { compact: true })}</td>
                  <td className="px-3"><div className="ml-auto flex w-28 items-center gap-2"><Progress value={s.attainment} height={5} tone={s.attainment >= 0.6 ? 'success' : s.attainment >= 0.3 ? 'brand' : 'warning'} /><span className="num w-9 text-right text-xs">{pct(s.attainment)}</span></div></td>
                  <td className="num px-3 text-right text-[13px]">{money(s.pipeline, { compact: true })}</td>
                  <td className="num px-3 text-right text-[13px]">{s.won + s.lost ? pct(s.winRate) : '—'}</td>
                  <td className="num px-3 text-right text-[13px]">{s.calls30}</td>
                  <td className="num px-3 text-right text-[13px]">{pct(s.connectRate)}</td>
                  <td className="num px-3 text-right text-[13px]">{s.meetings30}</td>
                  <td className="num px-3 pr-4 text-right text-[13px] text-muted">{durationWords(s.talk30)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {openRep && <RepDrawer stats={stats.find((s) => s.rep.id === openRep) ?? repStats(reps.find((r) => r.id === openRep)!, deals, calls, leads)} onClose={() => setOpenRep(null)} />}
      {invite && <InviteModal onClose={() => setInvite(false)} />}
    </div>
  );
}

function RepDrawer({ stats: s, onClose }: { stats: RepStats; onClose: () => void }) {
  const { deals, calls } = useCRM();
  const open = deals.filter((d) => d.ownerId === s.rep.id && !d.stage.startsWith('Closed')).sort((a, b) => b.value - a.value);
  const recent = calls.filter((c) => c.repId === s.rep.id).slice(0, 6);
  const chart = s.callsByDay.map((v, i) => ({ day: fmtDate(startOfDay() - (13 - i) * DAY, { weekday: 'narrow' }), calls: v }));
  return (
    <Drawer open onClose={onClose} width={620}>
      <div className="relative border-b px-5 pb-5 pt-5">
        <div className="absolute right-3 top-3"><IconButton label="Close" onClick={onClose}><X className="size-4" /></IconButton></div>
        <div className="flex items-center gap-4">
          <Avatar name={s.rep.name} hue={s.rep.hue} size={56} presence={s.rep.presence} />
          <div className="min-w-0 flex-1">
            <div className="text-[18px] font-semibold tracking-[-0.01em]">{s.rep.name}</div>
            <div className="text-xs text-muted">{s.rep.title} · {s.rep.team} · {s.rep.territory}</div>
            <div className="mt-2 flex gap-2">
              <Button size="sm" icon={<Mail />} onClick={() => toast({ title: 'Message sent', body: `to ${s.rep.email}` })}>Message</Button>
              <Button size="sm" icon={<Phone />} onClick={() => toast({ title: `Calling ${s.rep.name.split(' ')[0]}…`, body: 'Internal call via leadVico' })}>Call</Button>
              {s.rep.presence === 'on-call' && <Button size="sm" icon={<Headphones />} onClick={() => toast({ title: 'Live coaching started', body: 'Whisper mode enabled' })}>Listen in</Button>}
            </div>
          </div>
          <RadialProgress value={s.attainment} size={72} stroke={6} color={attColor(s.attainment)}><div className="text-center"><div className="num text-[14px] font-semibold">{pct(s.attainment)}</div><div className="text-[9.5px] text-muted">of quota</div></div></RadialProgress>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {[['Revenue QTD', money(s.revenue, { compact: true })], ['Avg. deal', s.avgDeal ? money(s.avgDeal, { compact: true }) : '—'], ['Connect rate', pct(s.connectRate)], ['Talk time 30d', durationWords(s.talk30)]].map(([k, v]) => (
            <div key={k} className="bg-surface px-5 py-3"><div className="text-[11px] text-faint">{k}</div><div className="num mt-0.5 text-[15px] font-semibold">{v}</div></div>
          ))}
        </div>
        <div className="border-y px-5 py-4">
          <div className="mb-2 text-[13px] font-semibold">Call activity · 14 days</div>
          <div className="h-[150px]">
            <ResponsiveContainer>
              <BarChart data={chart} margin={{ left: -24, right: 4, top: 4 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--sunken))' }} />
                <Bar dataKey="calls" name="Calls" fill="rgb(var(--brand))" radius={[4, 4, 1, 1]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border-b px-5 py-4">
          <div className="mb-2 text-[13px] font-semibold">Open deals <span className="text-faint">{open.length}</span></div>
          {open.slice(0, 6).map((d) => (
            <div key={d.id} className="flex items-center gap-3 py-2"><span className="min-w-0 flex-1 truncate text-[13px]">{d.name}</span><StageBadge stage={d.stage} /><span className="num w-16 text-right text-[13px] font-semibold">{money(d.value, { compact: true })}</span></div>
          ))}
          {!open.length && <div className="text-xs text-muted">No open deals.</div>}
        </div>
        <div className="px-5 py-4">
          <div className="mb-2 text-[13px] font-semibold">Recent calls</div>
          {recent.map((c) => { const p = resolveRef(c.ref); return (
            <div key={c.id} className="flex items-center gap-3 py-2"><CallIcon call={c} /><div className="min-w-0 flex-1"><div className="truncate text-[13px] font-medium">{p?.name}</div><div className="text-xs text-muted">{c.disposition}</div></div><span className="text-[11px] text-faint">{relTime(c.startedAt)}</span></div>
          ); })}
        </div>
      </div>
    </Drawer>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const invite = useCRM((s) => s.inviteRep);
  const [f, setF] = useState({ name: '', email: '', role: 'Account Executive' as Role, team: 'Mid-Market' as TeamT, quota: '300000' });
  return (
    <Modal open onClose={onClose} title="Invite teammate" description="They’ll get an email to join the leadVico workspace." icon={<UserPlus />}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!f.name || !f.email} onClick={() => { invite({ name: f.name, email: f.email, phone: '+1 (415) 555-0199', role: f.role, title: f.role, team: f.team, territory: 'Unassigned', quota: Number(f.quota) }); toast({ tone: 'success', title: 'Invitation sent', body: f.email }); onClose(); }}>Send invite</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full name"><Input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Jamie Lee" /></Field>
        <Field label="Work email"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="jamie@leadvico.com" /></Field>
        <Field label="Role"><Select value={f.role} onChange={(v) => setF({ ...f, role: v })} options={(['Admin', 'Sales Manager', 'Account Executive', 'SDR'] as Role[]).map((r) => ({ value: r, label: r }))} /></Field>
        <Field label="Team"><Select value={f.team} onChange={(v) => setF({ ...f, team: v })} options={(['Enterprise', 'Mid-Market', 'Growth'] as TeamT[]).map((r) => ({ value: r, label: r }))} /></Field>
        <Field label="Quarterly quota (USD)" className="col-span-2"><Input type="number" value={f.quota} onChange={(e) => setF({ ...f, quota: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

