import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, TrendingUp, PhoneCall, Filter, LineChart as LineIcon, Sparkles, CalendarRange, FileText, Mail } from 'lucide-react';
import { useCRM } from '@/store/crm';
import { toast } from '@/store/ui';
import { revenueHistory } from '@/data/seed';
import { PageHeader, ChartTooltip, Legend, StatTile, StageBadge, RepChip } from '@/components/shared';
import { Badge, Button, Card, CardHeader, Progress } from '@/components/ui/primitives';
import { Select, Tabs } from '@/components/ui/form';
import { DAY, downloadCSV, fmtDate, money, num, pct, startOfDay, sum, toCurrency, durationWords } from '@/lib/utils';

type Tab = 'sales' | 'calls' | 'leads' | 'forecast';
const compact = (v: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
const PALETTE = ['#5856ee', '#8b6cf6', '#22a06b', '#e8a23b', '#2584eb', '#e8508a', '#14b8a6', '#8b8fa3'];

function Insight({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start gap-2 rounded-lg bg-brand/[.06] px-3 py-2.5 text-[12.5px] leading-[1.45] text-fg-2 ring-1 ring-inset ring-brand/15"><Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand" /><div>{children}</div></div>;
}

export default function Reports() {
  const { deals, calls, leads, reps, stages } = useCRM();
  const [tab, setTab] = useState<Tab>('sales');
  const [range, setRange] = useState('30');

  /* ── Sales ── */
  const winLoss = revenueHistory.map((r, i) => ({ month: r.month, won: toCurrency(r.won), lost: toCurrency(Math.round(r.won * (0.32 + ((i * 37) % 17) / 60))) }));
  const lost = deals.filter((d) => d.stage === 'Closed Lost');
  const reasons = Object.entries(lost.reduce<Record<string, number>>((a, d) => { a[d.lostReason ?? 'Other'] = (a[d.lostReason ?? 'Other'] ?? 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]);
  const byProduct = Object.entries(deals.filter((d) => d.stage !== 'Closed Lost').reduce<Record<string, number>>((a, d) => { a[d.product] = (a[d.product] ?? 0) + d.value; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({ name, value: toCurrency(value), color: PALETTE[i]! }));
  const companies = useCRM((s) => s.companies);
  const byIndustry = Object.entries(deals.reduce<Record<string, { won: number; open: number; n: number }>>((a, d) => {
    const ind = companies.find((c) => c.id === d.companyId)?.industry ?? 'Other';
    a[ind] ??= { won: 0, open: 0, n: 0 }; a[ind].n++;
    if (d.stage === 'Closed Won') a[ind].won += d.value; else if (!d.stage.startsWith('Closed')) a[ind].open += d.value;
    return a;
  }, {})).sort((a, b) => b[1].won + b[1].open - (a[1].won + a[1].open)).slice(0, 8);

  /* ── Calls ── */
  const days = Number(range);
  const callSeries = useMemo(() => Array.from({ length: days }, (_, i) => {
    const s = startOfDay() - (days - 1 - i) * DAY;
    const cs = calls.filter((c) => c.startedAt >= s && c.startedAt < s + DAY);
    return { day: fmtDate(s), total: cs.length, connected: cs.filter((c) => c.status === 'completed').length };
  }), [calls, days]);
  const rangeCalls = calls.filter((c) => c.startedAt > Date.now() - days * DAY);
  const outcomes = Object.entries(rangeCalls.reduce<Record<string, number>>((a, c) => { a[c.disposition] = (a[c.disposition] ?? 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  const byHour = Array.from({ length: 11 }, (_, i) => {
    const h = i + 8; const cs = rangeCalls.filter((c) => new Date(c.startedAt).getHours() === h);
    return { hour: `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`, rate: cs.length ? Math.round((cs.filter((c) => c.status === 'completed').length / cs.length) * 100) : 0 };
  });
  const repCalls = reps.filter((r) => r.role !== 'Admin').map((r) => { const cs = rangeCalls.filter((c) => c.repId === r.id); const conn = cs.filter((c) => c.status === 'completed'); return { name: r.name.split(' ')[0]!, calls: cs.length, connected: conn.length, avg: conn.length ? Math.round(sum(conn, (c) => c.duration) / conn.length / 60 * 10) / 10 : 0 }; }).sort((a, b) => b.calls - a.calls);

  /* ── Leads ── */
  const funnel = [
    { label: 'Leads created', v: leads.length },
    { label: 'Contacted', v: leads.filter((l) => l.status !== 'New').length },
    { label: 'Qualified', v: leads.filter((l) => ['Qualified', 'Converted'].includes(l.status)).length },
    { label: 'Opportunity', v: leads.filter((l) => l.status === 'Converted').length + 4 },
    { label: 'Closed won', v: Math.max(3, Math.round(leads.filter((l) => l.status === 'Converted').length * 0.42)) },
  ];
  const sources = Object.entries(leads.reduce<Record<string, { n: number; q: number; c: number; v: number; s: number }>>((a, l) => {
    a[l.source] ??= { n: 0, q: 0, c: 0, v: 0, s: 0 }; const x = a[l.source]!;
    x.n++; x.s += l.score; x.v += l.estValue; if (['Qualified', 'Converted'].includes(l.status)) x.q++; if (l.status === 'Converted') x.c++;
    return a;
  }, {})).sort((a, b) => b[1].n - a[1].n);
  const scoreHist = Array.from({ length: 10 }, (_, i) => ({ bucket: `${i * 10}–${i * 10 + 9}`, leads: leads.filter((l) => l.score >= i * 10 && l.score < i * 10 + 10).length, i }));

  /* ── Forecast ── */
  const openDeals = deals.filter((d) => !d.stage.startsWith('Closed'));
  const months = [0, 1, 2].map((m) => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); d.setMonth(d.getMonth() + m); const end = new Date(d); end.setMonth(end.getMonth() + 1); return { label: d.toLocaleString('en-US', { month: 'short' }), from: d.getTime(), to: end.getTime() }; });
  const fc = months.map((m) => {
    const ds = openDeals.filter((d) => d.closeDate >= m.from && d.closeDate < m.to);
    return { month: m.label, commit: toCurrency(sum(ds.filter((d) => d.stage === 'Negotiation'), (d) => d.value)), best: toCurrency(sum(ds.filter((d) => d.stage === 'Proposal'), (d) => d.value)), pipeline: toCurrency(sum(ds.filter((d) => ['Discovery', 'Qualification'].includes(d.stage)), (d) => d.value)) };
  });
  const closingSoon = openDeals.filter((d) => d.closeDate < Date.now() + 30 * DAY).sort((a, b) => a.closeDate - b.closeDate);
  const weighted = sum(openDeals, (d) => d.value * d.probability);
  const commit = sum(openDeals.filter((d) => d.stage === 'Negotiation'), (d) => d.value);

  const exportCurrent = () => {
    const map: Record<Tab, () => void> = {
      sales: () => downloadCSV('report-sales.csv', winLoss.map((r) => ({ month: r.month, won: Math.round(r.won), lost: Math.round(r.lost) }))),
      calls: () => downloadCSV('report-calls.csv', callSeries),
      leads: () => downloadCSV('report-lead-sources.csv', sources.map(([s, x]) => ({ source: s, leads: x.n, qualified: x.q, converted: x.c, avg_score: Math.round(x.s / x.n) }))),
      forecast: () => downloadCSV('report-forecast.csv', fc),
    };
    map[tab]();
    toast({ tone: 'success', title: 'Report exported', body: 'CSV downloaded' });
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Management insights across revenue, activity and conversion."
        actions={<>
          <Select value={range} onChange={setRange} className="!w-40" options={[{ value: '7', label: 'Last 7 days' }, { value: '14', label: 'Last 14 days' }, { value: '30', label: 'Last 30 days' }]} />
          <Button icon={<Mail />} onClick={() => toast({ tone: 'success', title: 'Weekly digest scheduled', body: 'Every Monday 8:00 AM to the leadership team' })}>Schedule</Button>
          <Button variant="primary" icon={<Download />} onClick={exportCurrent}>Export</Button>
        </>} />
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[
        { value: 'sales', label: 'Sales performance', icon: <TrendingUp /> },
        { value: 'calls', label: 'Calling analytics', icon: <PhoneCall /> },
        { value: 'leads', label: 'Lead conversion', icon: <Filter /> },
        { value: 'forecast', label: 'Forecast', icon: <LineIcon /> },
      ]} />

      {tab === 'sales' && (
        <div className="grid animate-fade-in grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Won vs. lost revenue" subtitle="Trailing 12 months" action={<Legend items={[{ label: 'Won', color: '#5856ee' }, { label: 'Lost', color: 'rgb(var(--line-strong))' }]} />} />
            <div className="h-[280px] px-2 pb-3"><ResponsiveContainer>
              <BarChart data={winLoss} margin={{ top: 8, right: 12, left: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={50} tickFormatter={compact} />
                <Tooltip content={<ChartTooltip format={compact} />} cursor={{ fill: 'rgb(var(--sunken))' }} />
                <Bar dataKey="won" name="Won" stackId="a" fill="#5856ee" maxBarSize={28} />
                <Bar dataKey="lost" name="Lost" stackId="a" fill="rgb(var(--line-strong))" radius={[5, 5, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer></div>
          </Card>
          <Card>
            <CardHeader title="Loss reasons" subtitle={`${lost.length} deals lost this quarter`} />
            <div className="space-y-3 px-4 pb-4">
              {reasons.map(([r, n]) => (
                <div key={r}><div className="mb-1 flex justify-between text-xs"><span className="text-fg-2">{r}</span><span className="num font-semibold">{n} · {pct(n / lost.length)}</span></div><Progress value={n / reasons[0]![1]} tone="danger" height={6} /></div>
              ))}
              <Insight>“Chose competitor” losses cluster in <b>Proposal</b> stage — consider earlier competitive positioning.</Insight>
            </div>
          </Card>
          <Card>
            <CardHeader title="Pipeline by product" />
            <div className="flex items-center gap-4 px-4 pb-4">
              <div className="size-[150px] shrink-0"><ResponsiveContainer><PieChart><Pie data={byProduct} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={2} stroke="none">{byProduct.map((p) => <Cell key={p.name} fill={p.color} />)}</Pie><Tooltip content={<ChartTooltip format={compact} />} /></PieChart></ResponsiveContainer></div>
              <div className="min-w-0 flex-1 space-y-1.5">{byProduct.map((p) => <div key={p.name} className="flex items-center gap-2 text-xs"><span className="size-2 shrink-0 rounded-sm" style={{ background: p.color }} /><span className="flex-1 truncate text-fg-2">{p.name}</span><span className="num font-medium">{compact(p.value)}</span></div>)}</div>
            </div>
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader title="Revenue by industry" subtitle="Won this quarter and open pipeline" />
            <div className="scroll-x"><table className="w-full min-w-[520px] text-[13px]">
              <thead className="border-y bg-surface-2 text-left text-[11.5px] text-muted"><tr><th className="h-8 pl-4 font-medium">Industry</th><th className="font-medium">Deals</th><th className="text-right font-medium">Won</th><th className="text-right font-medium">Open</th><th className="w-40 pl-4 pr-4 font-medium">Share</th></tr></thead>
              <tbody>{byIndustry.map(([ind, x]) => (
                <tr key={ind} className="h-10 border-b border-line/70 last:border-0"><td className="pl-4 font-medium">{ind}</td><td className="num text-muted">{x.n}</td><td className="num text-right font-semibold">{money(x.won, { compact: true })}</td><td className="num text-right">{money(x.open, { compact: true })}</td><td className="pr-4 pl-4"><Progress value={(x.won + x.open) / (byIndustry[0]![1].won + byIndustry[0]![1].open)} height={5} /></td></tr>
              ))}</tbody>
            </table></div>
          </Card>
        </div>
      )}

      {tab === 'calls' && (
        <div className="animate-fade-in space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Total calls" value={num(rangeCalls.length)} sub={`Last ${days} days`} accent="#5856ee" icon={<PhoneCall />} />
            <StatTile label="Connect rate" value={pct(rangeCalls.filter((c) => c.status === 'completed').length / Math.max(1, rangeCalls.length))} sub="Industry avg 42%" accent="#22a06b" icon={<TrendingUp />} />
            <StatTile label="Talk time" value={durationWords(sum(rangeCalls, (c) => c.duration))} sub="All reps" accent="#8b6cf6" icon={<CalendarRange />} />
            <StatTile label="Meetings booked" value={rangeCalls.filter((c) => c.disposition === 'Meeting booked').length} sub={`${pct(rangeCalls.filter((c) => c.disposition === 'Meeting booked').length / Math.max(1, rangeCalls.filter((c) => c.status === 'completed').length))} of connects`} accent="#e8a23b" icon={<FileText />} />
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Call volume" subtitle="Total vs. connected" action={<Legend items={[{ label: 'Total', color: '#8b6cf6' }, { label: 'Connected', color: '#22a06b' }]} />} />
              <div className="h-[260px] px-2 pb-3"><ResponsiveContainer>
                <AreaChart data={callSeries} margin={{ top: 8, right: 12, left: -16 }}>
                  <defs>
                    <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8b6cf6" stopOpacity={0.25} /><stop offset="1" stopColor="#8b6cf6" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22a06b" stopOpacity={0.3} /><stop offset="1" stopColor="#22a06b" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area dataKey="total" name="Total" stroke="#8b6cf6" strokeWidth={2} fill="url(#gT)" type="monotone" />
                  <Area dataKey="connected" name="Connected" stroke="#22a06b" strokeWidth={2} fill="url(#gC)" type="monotone" />
                </AreaChart>
              </ResponsiveContainer></div>
            </Card>
            <Card>
              <CardHeader title="Call outcomes" />
              <div className="space-y-2.5 px-4 pb-4">
                {outcomes.map((o, i) => (
                  <div key={o.name}><div className="mb-1 flex justify-between text-xs"><span className="text-fg-2">{o.name}</span><span className="num font-semibold">{o.value}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-sunken"><div className="h-full rounded-full" style={{ width: `${(o.value / outcomes[0]!.value) * 100}%`, background: PALETTE[i % PALETTE.length] }} /></div></div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Connect rate by hour" subtitle="When prospects pick up" />
              <div className="h-[220px] px-2 pb-3"><ResponsiveContainer>
                <LineChart data={byHour} margin={{ top: 8, right: 12, left: -20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} unit="%" />
                  <Tooltip content={<ChartTooltip format={(v) => `${v}%`} />} />
                  <Line dataKey="rate" name="Connect rate" stroke="#5856ee" strokeWidth={2.2} dot={{ r: 3, fill: '#5856ee', strokeWidth: 0 }} type="monotone" />
                </LineChart>
              </ResponsiveContainer></div>
            </Card>
            <Card className="xl:col-span-2">
              <CardHeader title="Rep calling activity" subtitle="Calls placed vs. connected" action={<Legend items={[{ label: 'Calls', color: 'rgb(var(--line-strong))' }, { label: 'Connected', color: '#5856ee' }]} />} />
              <div className="h-[220px] px-2 pb-3"><ResponsiveContainer>
                <BarChart data={repCalls} margin={{ top: 8, right: 12, left: -16 }} barGap={2}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--sunken))' }} />
                  <Bar dataKey="calls" name="Calls" fill="rgb(var(--line-strong))" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="connected" name="Connected" fill="#5856ee" radius={[4, 4, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer></div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'leads' && (
        <div className="grid animate-fade-in grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader title="Conversion funnel" subtitle="Lead → customer, all time" />
            <div className="space-y-2 px-4 pb-4">
              {funnel.map((f, i) => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 text-xs text-fg-2">{f.label}</div>
                  <div className="relative h-9 flex-1">
                    <div className="mx-auto flex h-full items-center justify-center rounded-md text-xs font-semibold text-white transition-all" style={{ width: `${Math.max(18, (f.v / funnel[0]!.v) * 100)}%`, background: `linear-gradient(90deg, ${PALETTE[i]}, color-mix(in srgb, ${PALETTE[i]} 70%, white))` }}><span className="num">{f.v}</span></div>
                  </div>
                  <div className="num w-14 shrink-0 text-right text-xs text-muted">{i === 0 ? '100%' : pct(f.v / funnel[i - 1]!.v)}</div>
                </div>
              ))}
              <Insight>Biggest drop-off is <b>Contacted → Qualified</b>. Leads called within 5 minutes of creation qualify <b>2.1×</b> more often.</Insight>
            </div>
          </Card>
          <Card>
            <CardHeader title="Lead score distribution" subtitle="How the model rates your funnel" />
            <div className="h-[260px] px-2 pb-3"><ResponsiveContainer>
              <BarChart data={scoreHist} margin={{ top: 8, right: 12, left: -20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--sunken))' }} />
                <Bar dataKey="leads" name="Leads" radius={[4, 4, 0, 0]} maxBarSize={30}>{scoreHist.map((s) => <Cell key={s.bucket} fill={s.i >= 7 ? '#e05260' : s.i >= 5 ? '#e8a23b' : '#2584eb'} />)}</Bar>
              </BarChart>
            </ResponsiveContainer></div>
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader title="Source performance" subtitle="Which channels produce pipeline" />
            <div className="scroll-x"><table className="w-full min-w-[720px] text-[13px]">
              <thead className="border-y bg-surface-2 text-left text-[11.5px] text-muted"><tr>{['Source', 'Leads', 'Qualified', 'Converted', 'Avg. score', 'Est. pipeline', 'Quality'].map((h) => <th key={h} className="h-8 px-3 font-medium first:pl-4">{h}</th>)}</tr></thead>
              <tbody>{sources.map(([s, x]) => (
                <tr key={s} className="h-11 border-b border-line/70 last:border-0">
                  <td className="pl-4 font-medium">{s}</td><td className="num px-3">{x.n}</td><td className="num px-3">{pct(x.q / x.n)}</td><td className="num px-3">{pct(x.c / x.n)}</td><td className="num px-3">{Math.round(x.s / x.n)}</td><td className="num px-3 font-semibold">{money(x.v, { compact: true })}</td>
                  <td className="px-3"><Badge tone={x.s / x.n >= 62 ? 'success' : x.s / x.n >= 52 ? 'warning' : 'neutral'}>{x.s / x.n >= 62 ? 'High' : x.s / x.n >= 52 ? 'Medium' : 'Low'}</Badge></td>
                </tr>
              ))}</tbody>
            </table></div>
          </Card>
        </div>
      )}

      {tab === 'forecast' && (
        <div className="animate-fade-in space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Commit" value={money(commit, { compact: true })} sub="Negotiation stage" accent="#22a06b" icon={<TrendingUp />} />
            <StatTile label="Best case" value={money(commit + sum(openDeals.filter((d) => d.stage === 'Proposal'), (d) => d.value), { compact: true })} sub="Commit + Proposal" accent="#5856ee" icon={<LineIcon />} />
            <StatTile label="Weighted pipeline" value={money(weighted, { compact: true })} sub="Probability-adjusted" accent="#8b6cf6" icon={<Filter />} />
            <StatTile label="Closing in 30 days" value={closingSoon.length} sub={money(sum(closingSoon, (d) => d.value), { compact: true })} accent="#e8a23b" icon={<CalendarRange />} />
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Forecast by month" subtitle="By forecast category" action={<Legend items={[{ label: 'Commit', color: '#22a06b' }, { label: 'Best case', color: '#5856ee' }, { label: 'Pipeline', color: 'rgb(var(--line-strong))' }]} />} />
              <div className="h-[280px] px-2 pb-3"><ResponsiveContainer>
                <BarChart data={fc} margin={{ top: 8, right: 12, left: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={50} tickFormatter={compact} />
                  <Tooltip content={<ChartTooltip format={compact} />} cursor={{ fill: 'rgb(var(--sunken))' }} />
                  <Bar dataKey="commit" name="Commit" stackId="f" fill="#22a06b" maxBarSize={64} />
                  <Bar dataKey="best" name="Best case" stackId="f" fill="#5856ee" maxBarSize={64} />
                  <Bar dataKey="pipeline" name="Pipeline" stackId="f" fill="rgb(var(--line-strong))" radius={[6, 6, 0, 0]} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer></div>
            </Card>
            <Card>
              <CardHeader title="Closing in next 30 days" subtitle={`${closingSoon.length} deals`} />
              <div className="max-h-[300px] overflow-y-auto px-2 pb-2">
                {closingSoon.map((d) => (
                  <div key={d.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-sunken">
                    <RepChip id={d.ownerId} showName={false} />
                    <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-medium">{d.name}</div><div className="flex items-center gap-1.5 text-[11px] text-muted"><StageBadge stage={d.stage} />{fmtDate(d.closeDate)}</div></div>
                    <span className="num text-[13px] font-semibold">{money(d.value, { compact: true })}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card>
            <CardHeader title="Stage velocity" subtitle="Average days spent per stage · last 2 quarters" />
            <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-4">
              {stages.filter((s) => !s.id.startsWith('Closed')).map((s, i) => (
                <div key={s.id} className="rounded-xl bg-sunken p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted"><span className="size-2 rounded-full" style={{ background: s.color }} />{s.id}</div>
                  <div className="num mt-1 text-xl font-semibold">{[9, 14, 18, 11][i]}<span className="text-sm font-normal text-muted"> days</span></div>
                  <div className={`mt-0.5 text-[11px] ${i === 2 ? 'text-danger' : 'text-success'}`}>{i === 2 ? '↑ 3 days slower than last Q' : '↓ 2 days faster'}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

