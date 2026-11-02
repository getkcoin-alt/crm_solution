import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Phone, Mail, CalendarPlus, Briefcase, MoreHorizontal, Star, MapPin, Building2, Globe2, Users2, Clock3, Sparkles, ExternalLink, Copy, Trash2, ArrowLeft, CheckCircle2, PhoneCall, TrendingUp, ChevronRight, Tag,
} from 'lucide-react';
import { useCRM } from '@/store/crm';
import { usePhone } from '@/store/phone';
import { useUI, toast } from '@/store/ui';
import { Avatar, Badge, Button, Card, CardHeader, IconButton, Progress, ScoreRing, scoreTone, EmptyState } from '@/components/ui/primitives';
import { Select, Tabs, Checkbox } from '@/components/ui/form';
import { Menu } from '@/components/ui/overlay';
import { LeadStatusBadge, LEAD_STATUSES, RepSelect, StageBadge, CallIcon, RepChip } from '@/components/shared';
import { Timeline } from '@/components/Timeline';
import { RecordingPlayer } from '@/components/calling/RecordingPlayer';
import { cn, dayLabel, duration, durationWords, fmtDate, fmtDateTime, fmtTime, money, relTime, sum } from '@/lib/utils';

type Tab = 'activity' | 'calls' | 'tasks';

export default function LeadProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const lead = useCRM((s) => s.leads.find((l) => l.id === id));
  const { updateLead, convertLead, deleteLeads, toggleTask } = useCRM();
  const allCalls = useCRM((s) => s.calls);
  const allTasks = useCRM((s) => s.tasks);
  const calls = useMemo(() => allCalls.filter((c) => c.ref.id === id), [allCalls, id]);
  const tasks = useMemo(() => allTasks.filter((t) => t.ref?.id === id), [allTasks, id]);
  const deal = useCRM((s) => (lead?.dealId ? s.deals.find((d) => d.id === lead.dealId) : undefined));
  const dial = usePhone((s) => s.dial);
  const open = useUI((s) => s.open);
  const [tab, setTab] = useState<Tab>('activity');

  if (!lead) return <EmptyState icon={<Users2 />} title="Lead not found" body="It may have been deleted or merged." action={<Button onClick={() => nav('/leads')}>Back to leads</Button>} />;

  const name = `${lead.firstName} ${lead.lastName}`;
  const tone = scoreTone(lead.score);
  const connected = calls.filter((c) => c.status === 'completed');
  const talk = sum(connected, (c) => c.duration);
  const openTasks = tasks.filter((t) => !t.done).sort((a, b) => a.dueAt - b.dueAt);
  const ref = { type: 'lead' as const, id: lead.id };

  const copy = (v: string) => { navigator.clipboard?.writeText(v).catch(() => {}); toast({ title: 'Copied to clipboard', body: v }); };
  const convert = () => {
    const d = convertLead(lead.id);
    if (d) toast({ tone: 'success', title: 'Lead converted 🎉', body: `Deal, contact and company created — ${d.name}`, action: { label: 'Open in pipeline', onClick: () => nav(`/pipeline?deal=${d.id}`) } });
  };

  return (
    <div className="space-y-4">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"><ArrowLeft className="size-3.5" />Back</button>

      {/* Header */}
      <Card className="relative animate-fade-in overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 opacity-70" style={{ background: `radial-gradient(80% 140% at 0% 0%, hsl(${(lead.company.length * 41) % 360} 80% 60% / .16), transparent 60%), radial-gradient(60% 120% at 100% 0%, rgb(var(--brand) / .10), transparent 60%)` }} />
        <div className="relative flex flex-col gap-5 p-5 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <Avatar name={name} hue={(lead.company.length * 41) % 360} size={60} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{name}</h1>
                <button onClick={() => updateLead(lead.id, { starred: !lead.starred }, { silent: true })} className={cn(lead.starred ? 'text-warning' : 'text-faint hover:text-muted')}><Star className={cn('size-4', lead.starred && 'fill-current')} /></button>
                <Badge tone={tone.tone}>{tone.label} lead</Badge>
              </div>
              <div className="mt-0.5 text-[13px] text-muted">{lead.title} at <span className="font-medium text-fg-2">{lead.company}</span></div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
                <button onClick={() => copy(lead.email)} className="flex items-center gap-1.5 hover:text-fg"><Mail className="size-3.5" />{lead.email}</button>
                <button onClick={() => copy(lead.phone)} className="num flex items-center gap-1.5 hover:text-fg"><Phone className="size-3.5" />{lead.phone}</button>
                <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{lead.city}, {lead.country}</span>
                <span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />Local time {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" icon={<Phone />} onClick={() => dial(ref)}>Call</Button>
            <Button icon={<Mail />} onClick={() => setTab('activity')}>Email</Button>
            <Button icon={<CalendarPlus />} onClick={() => open({ kind: 'task', ref })}>Follow-up</Button>
            {deal ? <Button icon={<Briefcase />} onClick={() => nav(`/pipeline?deal=${deal.id}`)}>View deal</Button> : <Button icon={<Briefcase />} onClick={convert}>Convert</Button>}
            <Menu trigger={({ toggle }) => <IconButton label="More" variant="secondary" onClick={toggle}><MoreHorizontal className="size-4" /></IconButton>}
              items={[
                { label: 'Copy email', icon: <Copy />, onClick: () => copy(lead.email) },
                { label: 'View on LinkedIn', icon: <ExternalLink />, onClick: () => toast({ title: 'Opening LinkedIn profile…' }) },
                { label: 'Add to sequence', icon: <Tag />, onClick: () => toast({ title: 'Enrolled in “Inbound fast-track”' }) },
                { divider: true },
                { label: 'Delete lead', icon: <Trash2 />, danger: true, onClick: () => { deleteLeads([lead.id]); toast({ title: 'Lead deleted' }); nav('/leads'); } },
              ]} />
          </div>
        </div>

        <div className="relative grid grid-cols-2 border-t sm:grid-cols-3 lg:grid-cols-6 [&>*]:border-line">
          {[
            { k: 'Status', v: <Select value={lead.status} onChange={(v) => { updateLead(lead.id, { status: v }); toast({ title: `Status → ${v}` }); }} options={LEAD_STATUSES.map((s) => ({ value: s.value, label: s.value }))} renderValue={() => <LeadStatusBadge status={lead.status} />} className="!h-7 !w-auto !bg-transparent !px-0 !shadow-none" width={180} /> },
            { k: 'Owner', v: <RepSelect value={lead.ownerId} onChange={(v) => { updateLead(lead.id, { ownerId: v }); toast({ title: 'Lead reassigned' }); }} allowUnassigned size="sm" className="!-ml-1 !w-auto !max-w-[170px] !bg-transparent !px-1 !shadow-none hover:!bg-sunken" /> },
            { k: 'Est. value', v: <span className="num text-[15px] font-semibold">{money(lead.estValue)}</span> },
            { k: 'Source', v: <span className="text-[13px] font-medium">{lead.source}</span> },
            { k: 'Calls · talk time', v: <span className="num text-[13px] font-medium">{calls.length} · {durationWords(talk)}</span> },
            { k: 'Last activity', v: <span className="text-[13px] font-medium">{relTime(lead.lastActivityAt)}</span> },
          ].map((x, i) => (
            <div key={x.k} className={cn('px-5 py-3', i % 2 === 0 && 'border-r', 'sm:border-r lg:last:border-r-0', i < 4 && 'border-b sm:border-b-0', i >= 2 && 'max-sm:border-b-0')}>
              <div className="text-[11px] font-medium text-faint">{x.k}</div>
              <div className="mt-1 flex h-7 items-center">{x.v}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="min-w-0">
          <Tabs className="px-3" value={tab} onChange={setTab} tabs={[
            { value: 'activity', label: 'Activity' },
            { value: 'calls', label: 'Calls', count: calls.length },
            { value: 'tasks', label: 'Tasks', count: openTasks.length },
          ]} />
          <div className="p-4 sm:p-5">
            {tab === 'activity' && <Timeline entity={ref} />}
            {tab === 'calls' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[['Total calls', calls.length], ['Connected', connected.length], ['Talk time', durationWords(talk)]].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-sunken px-3 py-2.5"><div className="text-[11px] text-muted">{k}</div><div className="num mt-0.5 text-lg font-semibold">{v}</div></div>
                  ))}
                </div>
                {calls.map((c) => (
                  <div key={c.id} className="rounded-xl p-3.5 shadow-[inset_0_0_0_1px_rgb(var(--line))]">
                    <div className="flex items-center gap-3">
                      <CallIcon call={c} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium">{c.direction === 'inbound' ? 'Inbound' : 'Outbound'} · {c.disposition}</div>
                        <div className="text-xs text-muted">{dayLabel(c.startedAt)} at {fmtTime(c.startedAt)} · <span className="num">{c.duration ? duration(c.duration) : 'no answer'}</span></div>
                      </div>
                      <RepChip id={c.repId} />
                    </div>
                    {c.notes && <p className="mt-2 text-[13px] text-fg-2">{c.notes}</p>}
                    {c.recorded && <div className="mt-2.5"><RecordingPlayer seed={c.id} length={c.duration} /></div>}
                  </div>
                ))}
                {!calls.length && <EmptyState icon={<PhoneCall />} title="No calls yet" body="Start the first conversation." action={<Button variant="primary" icon={<Phone />} onClick={() => dial(ref)}>Call {lead.firstName}</Button>} />}
              </div>
            )}
            {tab === 'tasks' && (
              <div>
                {[...tasks].sort((a, b) => Number(a.done) - Number(b.done) || a.dueAt - b.dueAt).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 border-b py-2.5 last:border-0">
                    <Checkbox checked={t.done} onChange={() => toggleTask(t.id)} />
                    <div className="min-w-0 flex-1">
                      <div className={cn('text-[13px] font-medium', t.done && 'text-faint line-through')}>{t.title}</div>
                      <div className={cn('text-xs', !t.done && t.dueAt < Date.now() ? 'text-danger' : 'text-muted')}>{fmtDateTime(t.dueAt)}</div>
                    </div>
                    <Badge>{t.type}</Badge>
                    <RepChip id={t.ownerId} showName={false} />
                  </div>
                ))}
                {!tasks.length && <EmptyState icon={<CalendarPlus />} title="No tasks" body="Schedule the next step so nothing slips." />}
                <Button className="mt-3" icon={<CalendarPlus />} onClick={() => open({ kind: 'task', ref })}>Add task</Button>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Lead score" subtitle="Fit + engagement model v3" action={<Badge tone={tone.tone}>{tone.label}</Badge>} />
            <div className="flex items-center gap-4 px-4 pb-3">
              <ScoreRing score={lead.score} size={68} stroke={6} />
              <div className="flex-1 text-xs text-muted">Higher than <b className="text-fg">{Math.min(97, Math.round(lead.score * 0.96))}%</b> of leads this quarter. Leads above 75 convert <b className="text-fg">3.4×</b> more often.</div>
            </div>
            <div className="space-y-2.5 border-t px-4 py-3">
              {lead.scoreFactors.map((f) => (
                <div key={f.label}>
                  <div className="mb-1 flex items-center justify-between text-xs"><span className="text-fg-2">{f.label}</span><span className={cn('num font-semibold', f.points < 0 ? 'text-danger' : 'text-success')}>{f.points > 0 ? '+' : ''}{f.points}</span></div>
                  <Progress value={Math.abs(f.points) / 25} tone={f.points < 0 ? 'danger' : 'brand'} height={4} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-brand/[.08] to-transparent">
              <CardHeader title="Vico AI insights" icon={<Sparkles className="!text-brand" />} />
              <ul className="space-y-2.5 px-4 pb-4 text-[13px] leading-[1.45] text-fg-2">
                <li className="flex gap-2"><TrendingUp className="mt-0.5 size-3.5 shrink-0 text-success" />Engagement up 3× this week — opened pricing email 3 times.</li>
                <li className="flex gap-2"><Clock3 className="mt-0.5 size-3.5 shrink-0 text-brand" />Best time to call: <b className="font-semibold text-fg">Tue–Wed, 10–11 AM</b> local.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-warning" />Similar {lead.industry} deals close in ~38 days at {money(lead.estValue * 1.2, { compact: true })} avg.</li>
              </ul>
            </div>
          </Card>

          {deal && (
            <Card>
              <CardHeader title="Related deal" />
              <Link to={`/pipeline?deal=${deal.id}`} className="mx-3 mb-3 block rounded-xl p-3 shadow-[inset_0_0_0_1px_rgb(var(--line))] transition hover:bg-sunken">
                <div className="flex items-center justify-between"><span className="text-[13px] font-medium">{deal.name}</span><ChevronRight className="size-4 text-faint" /></div>
                <div className="mt-2 flex items-center gap-2"><StageBadge stage={deal.stage} /><span className="num text-[13px] font-semibold">{money(deal.value)}</span></div>
              </Link>
            </Card>
          )}

          <Card>
            <CardHeader title="About" />
            <dl className="space-y-2.5 px-4 pb-4 text-[13px]">
              {[
                [Building2, 'Company', lead.company], [Globe2, 'Industry', lead.industry], [Users2, 'Employees', lead.employees.toLocaleString()],
                [MapPin, 'Location', `${lead.city}, ${lead.country}`], [Clock3, 'Created', fmtDate(lead.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })],
              ].map(([I, k, v]) => {
                const Icon = I as typeof Building2;
                return <div key={k as string} className="flex items-center gap-2.5"><Icon className="size-3.5 text-faint" /><dt className="w-20 text-muted">{k as string}</dt><dd className="min-w-0 flex-1 truncate font-medium">{v as string}</dd></div>;
              })}
              {lead.tags.length > 0 && <div className="flex flex-wrap gap-1 pt-1">{lead.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Upcoming" subtitle={`${openTasks.length} open tasks`} action={<IconButton label="Add task" size="sm" onClick={() => open({ kind: 'task', ref })}><CalendarPlus className="size-3.5" /></IconButton>} />
            <div className="px-2 pb-2">
              {openTasks.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-sunken">
                  <Checkbox checked={false} onChange={() => { toggleTask(t.id); toast({ tone: 'success', title: 'Task completed' }); }} />
                  <div className="min-w-0 flex-1"><div className="truncate text-[13px]">{t.title}</div><div className={cn('text-[11px]', t.dueAt < Date.now() ? 'text-danger' : 'text-muted')}>{relTime(t.dueAt)}</div></div>
                </div>
              ))}
              {!openTasks.length && <div className="px-2 pb-2 text-xs text-muted">Nothing scheduled.</div>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
