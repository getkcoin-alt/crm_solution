import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, Phone, Target, Wallet, Percent, Users2, PhoneCall, Sparkles, CalendarCheck2, Flame, Clock3, ChevronRight, Download } from 'lucide-react';
import { useCRM, ME, quarterRevenue, resolveRef } from '@/store/crm';
import { usePhone } from '@/store/phone';
import { revenueHistory, QUARTER_START } from '@/data/seed';
import { Avatar, Badge, Button, Card, CardHeader, Delta, Progress, ScoreRing, IconButton } from '@/components/ui/primitives';
import { Segmented, Checkbox } from '@/components/ui/form';
import { ChartTooltip, Legend, Sparkline, CallIcon, RepChip } from '@/components/shared';
import { cn, DAY, money, num, pct, relTime, startOfDay, sum, fmtTime, toCurrency, downloadCSV } from '@/lib/utils';

type Range = '7' | '30' | 'qtd';
const clampD = (v: number) => Math.max(-0.32, Math.min(0.42, v));

function Kpi({ label, value, delta, icon, spark, color, sub, to }: { label: string; value: string; delta: number; icon: React.ReactNode; spark: number[]; color: string; sub: string; to: string }) {
  return (
    <Link to={to} className="card group relative flex flex-col overflow-hidden p-4 transition hover:shadow-pop">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-medium text-muted">
          <span className="flex size-6 items-center justify-center rounded-md [&_svg]:size-3.5" style={{ background: `color-mix(in srgb, ${color} 13%, transparent)`, color }}>{icon}</span>
          {label}
        </span>
        <ArrowUpRight className="size-3.5 text-faint opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <div className="num text-[24px] font-semibold leading-none tracking-[-0.025em]">{value}</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted"><Delta value={delta} /><span className="truncate">{sub}</span></div>
        </div>
        <div className="h-10 w-[42%] max-w-[110px]"><Sparkline data={spark} color={color} height={40} /></div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { deals, leads, calls, tasks, reps, activities, toggleTask } = useCRM();
  const dial = usePhone((s) => s.dial);
  const nav = useNavigate();
  const [range, setRange] = useState<Range>('30');
  const me = reps.find((r) => r.id === ME)!;
  const now = Date.now();
  const since = range === 'qtd' ? QUARTER_START : now - Number(range) * DAY;
  const prevSince = since - (now - since);

  const m = useMemo(() => {
    const won = quarterRevenue(deals);
    const quota = sum(reps, (r) => r.quota);
    const open = deals.filter((d) => !d.stage.startsWith('Closed'));
    const pipeline = sum(open, (d) => d.value);
    const weighted = sum(open, (d) => d.value * d.probability);
    const closed = deals.filter((d) => d.stage.startsWith('Closed'));
    const winRate = closed.length ? closed.filter((d) => d.stage === 'Closed Won').length / closed.length : 0;
    const inRange = leads.filter((l) => l.createdAt >= since);
    const prevRange = leads.filter((l) => l.createdAt >= prevSince && l.createdAt < since);
    const conv = leads.filter((l) => l.status === 'Converted' || l.status === 'Qualified').length / leads.length;
    const rCalls = calls.filter((c) => c.startedAt >= since);
    const pCalls = calls.filter((c) => c.startedAt >= prevSince && c.startedAt < since);
    const connected = rCalls.filter((c) => c.status === 'completed').length;
    const daysElapsed = (now - QUARTER_START) / DAY;
    const qLen = 92;
    return {
      won, quota, pipeline, weighted, winRate, conv, rCalls, connected,
      leadsIn: inRange.length, leadsDelta: clampD(prevRange.length ? inRange.length / prevRange.length - 1 : 0.12),
      callsDelta: clampD(pCalls.length ? rCalls.length / pCalls.length - 1 : 0.08),
      pace: (won / quota) / (daysElapsed / qLen),
      daysLeft: Math.max(0, Math.round(qLen - daysElapsed)),
    };
  }, [deals, leads, calls, reps, since, prevSince, now]);

  const callsByDay = useMemo(() => {
    const out: number[] = [];
    for (let d = 13; d >= 0; d--) { const s = startOfDay() - d * DAY; out.push(calls.filter((c) => c.startedAt >= s && c.startedAt < s + DAY).length); }
    return out;
  }, [calls]);
  const leadsByDay = useMemo(() => {
    const out: number[] = [];
    for (let d = 13; d >= 0; d--) { const s = startOfDay() - d * DAY; out.push(leads.filter((c) => c.createdAt >= s && c.createdAt < s + DAY).length + 1); }
    return out;
  }, [leads]);

  const revData = revenueHistory.map((r) => ({ ...r, won: toCurrency(r.won), target: toCurrency(r.target) }));
  const stages = useCRM((s) => s.stages).filter((s) => !s.id.startsWith('Closed'));
  const byStage = stages.map((s) => { const ds = deals.filter((d) => d.stage === s.id); return { ...s, count: ds.length, value: sum(ds, (d) => d.value) }; });
  const maxStage = Math.max(...byStage.map((s) => s.value));

  const srcColors = ['#5856ee', '#8b6cf6', '#22a06b', '#e8a23b', '#2584eb', '#e8508a', '#14b8a6', '#8b8fa3'];
  const sources = Object.entries(leads.reduce<Record<string, number>>((a, l) => { a[l.source] = (a[l.source] ?? 0) + 1; return a; }, {}))
    .sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({ name, value, color: srcColors[i % srcColors.length]! }));

  const heat = useMemo(() => {
    const g = Array.from({ length: 5 }, () => Array(11).fill(0) as number[]);
    calls.filter((c) => c.startedAt > now - 28 * DAY).forEach((c) => {
      const d = new Date(c.startedAt); const dow = d.getDay() - 1; const h = d.getHours() - 8;
      if (dow >= 0 && dow < 5 && h >= 0 && h < 11) g[dow]![h]! += c.status === 'completed' ? 1 : 0.35;
    });
    return g;
  }, [calls, now]);
  const heatMax = Math.max(...heat.flat());

  const leaderboard = reps.filter((r) => r.role !== 'Admin' && r.role !== 'SDR')
    .map((r) => ({ r, won: quarterRevenue(deals, r.id), att: quarterRevenue(deals, r.id) / r.quota }))
    .sort((a, b) => b.won - a.won).slice(0, 5);

  const agenda = tasks.filter((t) => t.ownerId === ME && t.dueAt < startOfDay() + DAY && (!t.done || t.completedAt! > startOfDay())).sort((a, b) => Number(a.done) - Number(b.done) || a.dueAt - b.dueAt).slice(0, 6);
  const hot = leads.filter((l) => l.score >= 72 && !['Converted', 'Unqualified'].includes(l.status)).sort((a, b) => b.score - a.score).slice(0, 5);
  const feed = activities.filter((a) => a.type !== 'created').slice(0, 7);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-5">
      <div className="flex animate-fade-in flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-medium text-muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.025em]">{greet}, {me.name.split(' ')[0]}</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-muted">
            You’re at <b className="font-semibold text-fg">{pct(m.won / m.quota)}</b> of the quarterly target with {m.daysLeft} days left — pacing <b className={cn('font-semibold', m.pace >= 1 ? 'text-success' : 'text-warning')}>{pct(m.pace)}</b> of plan. {agenda.filter((a) => !a.done).length} follow-ups need your attention today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Segmented value={range} onChange={setRange} options={[{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: 'qtd', label: 'Quarter' }]} />
          <Button icon={<Download />} onClick={() => downloadCSV('leadvico-revenue.csv', revenueHistory.map((r) => ({ month: r.month, won_usd: r.won, target_usd: r.target, pipeline_usd: r.pipeline })))}>Export</Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi to="/reports" label="Revenue · QTD" value={money(m.won, { compact: true })} delta={0.184} sub={`of ${money(m.quota, { compact: true })} target`} icon={<Wallet />} color="#5856ee" spark={revenueHistory.map((r) => r.won)} />
        <Kpi to="/pipeline" label="Open pipeline" value={money(m.pipeline, { compact: true })} delta={0.072} sub={`${money(m.weighted, { compact: true })} weighted`} icon={<Target />} color="#8b6cf6" spark={revenueHistory.map((r) => r.pipeline)} />
        <Kpi to="/leads" label="New leads" value={num(m.leadsIn)} delta={m.leadsDelta} sub={`${pct(m.conv)} qualify rate`} icon={<Users2 />} color="#22a06b" spark={leadsByDay} />
        <Kpi to="/calls" label="Calls made" value={num(m.rCalls.length)} delta={m.callsDelta} sub={`${pct(m.connected / Math.max(1, m.rCalls.length))} connect rate`} icon={<PhoneCall />} color="#e8a23b" spark={callsByDay} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Revenue chart */}
        <Card className="xl:col-span-2">
          <CardHeader title="Revenue performance" subtitle="Closed-won revenue vs. target · trailing 12 months"
            action={<Legend items={[{ label: 'Closed won', color: 'rgb(var(--brand))' }, { label: 'Target', color: 'rgb(var(--faint))', dashed: true }]} />} />
          <div className="flex flex-wrap gap-x-8 gap-y-2 px-4 pb-1 pt-1">
            <div><div className="text-2xs font-medium text-muted">Trailing 12M</div><div className="num text-lg font-semibold">{money(sum(revenueHistory, (r) => r.won), { compact: true })}</div></div>
            <div><div className="text-2xs font-medium text-muted">Attainment</div><div className="num text-lg font-semibold">{pct(sum(revenueHistory, (r) => r.won) / sum(revenueHistory, (r) => r.target))}</div></div>
            <div><div className="text-2xs font-medium text-muted">Win rate</div><div className="num text-lg font-semibold">{pct(m.winRate)}</div></div>
            <div><div className="text-2xs font-medium text-muted">Avg. deal size</div><div className="num text-lg font-semibold">{money(sum(deals, (d) => d.value) / deals.length, { compact: true })}</div></div>
          </div>
          <div className="h-[260px] px-2 pb-3">
            <ResponsiveContainer>
              <ComposedChart data={revData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gWon" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(var(--brand))" stopOpacity={1} /><stop offset="100%" stopColor="rgb(var(--brand))" stopOpacity={0.55} /></linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} dy={6} />
                <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v) => new Intl.NumberFormat('en', { notation: 'compact' }).format(v)} />
                <Tooltip cursor={{ fill: 'rgb(var(--sunken))' }} content={<ChartTooltip format={(v) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(v)} />} />
                <Bar dataKey="won" name="Closed won" fill="url(#gWon)" radius={[5, 5, 2, 2]} maxBarSize={30} />
                <Line dataKey="target" name="Target" stroke="rgb(var(--faint))" strokeDasharray="4 4" strokeWidth={1.5} dot={false} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pipeline by stage */}
        <Card>
          <CardHeader title="Pipeline by stage" subtitle={`${deals.filter((d) => !d.stage.startsWith('Closed')).length} open deals · ${money(m.pipeline, { compact: true })}`} action={<Link to="/pipeline" className="text-xs font-medium text-brand hover:underline">Open board</Link>} />
          <div className="space-y-3.5 px-4 pb-4 pt-2">
            {byStage.map((s, i) => (
              <div key={s.id}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-fg-2"><span className="size-2 rounded-full" style={{ background: s.color }} />{s.id}<span className="text-faint">{s.count}</span></span>
                  <span className="num font-semibold">{money(s.value, { compact: true })}</span>
                </div>
                <div className="h-7 overflow-hidden rounded-md bg-sunken">
                  <div className="flex h-full items-center rounded-md px-2 text-[10.5px] font-semibold text-white transition-[width] duration-700" style={{ width: `${Math.max(14, (s.value / maxStage) * 100)}%`, background: `linear-gradient(90deg, ${s.color}, color-mix(in srgb, ${s.color} 75%, white))`, animationDelay: `${i * 80}ms` }}>
                    {Math.round(s.probability * 100)}%
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between rounded-lg bg-sunken px-3 py-2.5 text-xs">
              <span className="text-muted">Weighted forecast</span>
              <span className="num font-semibold">{money(m.weighted, { compact: true })}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Agenda */}
        <Card>
          <CardHeader title="Today’s agenda" icon={<CalendarCheck2 />} subtitle={`${agenda.filter((a) => a.done).length} of ${agenda.length} done`} action={<Link to="/tasks" className="text-xs font-medium text-brand hover:underline">All tasks</Link>} />
          <div className="px-2 pb-2">
            {agenda.map((t) => {
              const party = t.ref ? resolveRef(t.ref) : undefined;
              const overdue = !t.done && t.dueAt < now;
              return (
                <div key={t.id} className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sunken">
                  <Checkbox checked={t.done} onChange={() => toggleTask(t.id)} />
                  <div className="min-w-0 flex-1">
                    <div className={cn('truncate text-[13px] font-medium transition', t.done && 'text-faint line-through')}>{t.title}</div>
                    <div className="flex items-center gap-1.5 truncate text-xs text-muted">
                      <span className={cn('num', overdue && 'font-medium text-danger')}>{overdue ? 'Overdue · ' : ''}{fmtTime(t.dueAt)}</span>
                      {party && <><span className="text-faint">·</span><span className="truncate">{party.name}</span></>}
                    </div>
                  </div>
                  {t.type === 'Call' && party && !t.done && <IconButton label="Call" size="sm" variant="outline" onClick={() => dial(party.ref)} className="opacity-0 group-hover:opacity-100"><Phone className="size-3.5" /></IconButton>}
                  <Badge tone={t.priority === 'High' ? 'danger' : t.priority === 'Medium' ? 'warning' : 'neutral'}>{t.type}</Badge>
                </div>
              );
            })}
            {!agenda.length && <div className="py-10 text-center text-sm text-muted">Nothing due today 🎉</div>}
          </div>
        </Card>

        {/* Hot leads */}
        <Card>
          <CardHeader title="Hot leads to call" icon={<Flame />} subtitle="Highest intent, ranked by score" action={<Link to="/leads" className="text-xs font-medium text-brand hover:underline">View all</Link>} />
          <div className="px-2 pb-2">
            {hot.map((l) => (
              <div key={l.id} onClick={() => nav(`/leads/${l.id}`)} className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-sunken">
                <ScoreRing score={l.score} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{l.firstName} {l.lastName}</div>
                  <div className="truncate text-xs text-muted">{l.title} · {l.company}</div>
                </div>
                <span className="hidden text-xs text-faint sm:block">{relTime(l.lastActivityAt)}</span>
                <Button size="sm" variant="secondary" icon={<Phone />} onClick={(e) => { e.stopPropagation(); dial({ type: 'lead', id: l.id }); }}>Call</Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Leaderboard */}
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader title="Quota leaderboard" subtitle="Quarter to date" action={<Link to="/team" className="text-xs font-medium text-brand hover:underline">Team</Link>} />
          <div className="space-y-1 px-2 pb-3">
            {leaderboard.map(({ r, won, att }, i) => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                <span className={cn('num w-4 text-center text-xs font-semibold', i === 0 ? 'text-warning' : 'text-faint')}>{i + 1}</span>
                <Avatar name={r.name} hue={r.hue} size={28} presence={r.presence} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium">{r.name}</span>
                    <span className="num text-xs font-semibold">{money(won, { compact: true })}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={att} tone={att >= 0.5 ? 'success' : att >= 0.3 ? 'brand' : 'warning'} height={5} />
                    <span className="num w-9 text-right text-[11px] text-muted">{pct(att)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Heatmap */}
        <Card className="xl:col-span-2">
          <CardHeader title="Best time to call" icon={<Clock3 />} subtitle="Connected calls by weekday & hour · last 4 weeks" action={<Badge tone="brand"><Sparkles className="size-3" />Peak: Tue–Wed, 10–11 AM</Badge>} />
          <div className="scroll-x px-4 pb-4 pt-2">
            <div className="min-w-[520px]">
              <div className="grid grid-cols-[36px_repeat(11,1fr)] gap-1">
                <span />
                {Array.from({ length: 11 }, (_, h) => <span key={h} className="num text-center text-[10.5px] text-faint">{((h + 8) % 12) || 12}{h + 8 < 12 ? 'a' : 'p'}</span>)}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, di) => (
                  <div key={d} className="contents">
                    <span className="flex items-center text-[11px] font-medium text-muted">{d}</span>
                    {heat[di]!.map((v, h) => {
                      const a = v / heatMax;
                      return <div key={h} title={`${d} ${h + 8}:00 · ${Math.round(v)} connects`} className="h-7 rounded-[5px] transition hover:ring-2 hover:ring-brand/40" style={{ background: a < 0.05 ? 'rgb(var(--sunken))' : `rgb(var(--brand) / ${0.1 + a * 0.85})` }} />;
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-end gap-1.5 text-[10.5px] text-faint">Fewer{[0.1, 0.3, 0.5, 0.7, 0.95].map((o) => <span key={o} className="size-3 rounded-[3px]" style={{ background: `rgb(var(--brand) / ${o})` }} />)}More</div>
            </div>
          </div>
        </Card>

        {/* Lead sources */}
        <Card>
          <CardHeader title="Lead sources" subtitle={`${leads.length} leads · all time`} icon={<Percent />} />
          <div className="flex items-center gap-4 px-4 pb-4">
            <div className="relative size-[140px] shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={sources} dataKey="value" innerRadius={48} outerRadius={68} paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
                    {sources.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="num text-lg font-semibold">{leads.length}</span><span className="text-[10.5px] text-muted">leads</span></div>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              {sources.slice(0, 6).map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2 shrink-0 rounded-sm" style={{ background: s.color }} />
                  <span className="flex-1 truncate text-fg-2">{s.name}</span>
                  <span className="num font-medium">{pct(s.value / leads.length)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Recent calls" subtitle="Across the team" action={<Link to="/calls" className="text-xs font-medium text-brand hover:underline">Call log</Link>} />
          <div className="px-2 pb-2">
            {calls.slice(0, 6).map((c) => {
              const p = resolveRef(c.ref);
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sunken">
                  <CallIcon call={c} />
                  <div className="min-w-0 flex-1">
                    <Link to={p?.href ?? '#'} className="block truncate text-[13px] font-medium hover:underline">{p?.name}</Link>
                    <div className="truncate text-xs text-muted">{c.disposition} · {p?.company}</div>
                  </div>
                  <RepChip id={c.repId} showName={false} />
                  <div className="w-16 text-right">
                    <div className="num text-xs font-medium">{c.duration ? `${Math.floor(c.duration / 60)}:${String(c.duration % 60).padStart(2, '0')}` : '—'}</div>
                    <div className="text-[11px] text-faint">{relTime(c.startedAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardHeader title="Activity stream" subtitle="Live updates from your team" action={<span className="flex items-center gap-1.5 text-xs text-success"><span className="size-1.5 animate-blink rounded-full bg-success" />Live</span>} />
          <div className="px-4 pb-3">
            {feed.map((a, i) => {
              const p = resolveRef(a.ref);
              const rep = reps.find((r) => r.id === a.repId);
              return (
                <div key={a.id} className="relative flex gap-3 pb-3">
                  {i < feed.length - 1 && <span className="absolute left-[11px] top-7 h-[calc(100%-22px)] w-px bg-line" />}
                  <Avatar name={rep?.name ?? '?'} hue={rep?.hue} size={22} />
                  <div className="min-w-0 flex-1 text-[13px]">
                    <span className="font-medium">{rep?.name.split(' ')[0]}</span> <span className="text-muted">{a.title.toLowerCase().startsWith('status') ? 'changed status for' : a.type === 'call' ? 'logged a call with' : a.type === 'email' ? 'emailed' : a.type === 'meeting' ? 'met with' : 'updated'}</span>{' '}
                    <Link to={p?.href ?? '#'} className="font-medium hover:underline">{p?.name}</Link>
                    <div className="truncate text-xs text-muted">{a.title}</div>
                  </div>
                  <span className="shrink-0 text-[11px] text-faint">{relTime(a.at)}</span>
                </div>
              );
            })}
            <Link to="/reports" className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">View full report <ChevronRight className="size-3" /></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
