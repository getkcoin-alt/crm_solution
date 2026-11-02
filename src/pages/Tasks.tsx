import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, List, CalendarDays, Phone, Mail, Users, RotateCcw, Presentation, ChevronLeft, ChevronRight, MoreHorizontal, Trash2, CalendarClock, AlarmClock, CheckCircle2, Clock3, ListTodo, ChevronDown } from 'lucide-react';
import { useCRM, ME, resolveRef } from '@/store/crm';
import { usePhone } from '@/store/phone';
import { useUI, toast } from '@/store/ui';
import { PageHeader, RepChip, StatTile } from '@/components/shared';
import { Avatar, Badge, Button, Card, IconButton, EmptyState } from '@/components/ui/primitives';
import { Checkbox, FilterChip, Segmented } from '@/components/ui/form';
import { Menu } from '@/components/ui/overlay';
import { cn, DAY, HOUR, fmtDate, fmtTime, startOfDay } from '@/lib/utils';
import type { Task, TaskType } from '@/types';

const typeMeta: Record<TaskType, { icon: typeof Phone; color: string }> = {
  Call: { icon: Phone, color: '#22a06b' },
  Email: { icon: Mail, color: '#2584eb' },
  Meeting: { icon: Users, color: '#8b5cf6' },
  'Follow-up': { icon: RotateCcw, color: '#e8a23b' },
  Demo: { icon: Presentation, color: '#e8508a' },
};

function TaskRow({ t }: { t: Task }) {
  const { toggleTask, updateTask, deleteTask } = useCRM();
  const dial = usePhone((s) => s.dial);
  const party = t.ref ? resolveRef(t.ref) : undefined;
  const M = typeMeta[t.type];
  const overdue = !t.done && t.dueAt < Date.now();
  return (
    <div className={cn('group flex items-center gap-3 border-b border-line/70 px-4 py-2.5 transition-colors last:border-0 hover:bg-surface-2', t.done && 'opacity-60')}>
      <Checkbox checked={t.done} onChange={() => { toggleTask(t.id); if (!t.done) toast({ tone: 'success', title: 'Task completed', body: t.title, action: { label: 'Undo', onClick: () => toggleTask(t.id) } }); }} />
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${M.color}18`, color: M.color }}><M.icon className="size-3.5" /></span>
      <div className="min-w-0 flex-1">
        <div className={cn('truncate text-[13px] font-medium', t.done && 'line-through')}>{t.title}</div>
        <div className="flex items-center gap-1.5 truncate text-xs text-muted">
          {party ? <Link to={party.href} className="truncate hover:text-fg hover:underline">{party.name} · {party.company}</Link> : <span>No related record</span>}
          {t.notes && <span className="hidden truncate text-faint md:inline">— {t.notes}</span>}
        </div>
      </div>
      <Badge tone={t.priority === 'High' ? 'danger' : t.priority === 'Medium' ? 'warning' : 'neutral'} className="hidden sm:inline-flex">{t.priority}</Badge>
      <div className={cn('num w-[92px] shrink-0 text-right text-xs', overdue ? 'font-semibold text-danger' : 'text-muted')}>
        {startOfDay(t.dueAt) === startOfDay() || overdue ? fmtTime(t.dueAt) : fmtDate(t.dueAt, { weekday: 'short', month: 'short', day: 'numeric' })}
        {overdue && <div className="text-[10.5px] font-medium">{Math.max(1, Math.round((Date.now() - t.dueAt) / DAY))}d overdue</div>}
      </div>
      <RepChip id={t.ownerId} showName={false} className="hidden md:inline-flex" />
      <div className="flex w-[68px] shrink-0 justify-end gap-1">
        {t.type === 'Call' && party && !t.done && <IconButton label="Call now" size="sm" variant="secondary" onClick={() => dial(party.ref)}><Phone className="size-3.5 text-success" /></IconButton>}
        <Menu trigger={({ toggle }) => <IconButton label="More" size="sm" onClick={toggle} className="opacity-60 group-hover:opacity-100"><MoreHorizontal className="size-4" /></IconButton>}
          items={[
            { heading: 'Reschedule' },
            { label: 'In 1 hour', icon: <AlarmClock />, onClick: () => { updateTask(t.id, { dueAt: Date.now() + HOUR }); toast({ title: 'Snoozed 1 hour' }); } },
            { label: 'Tomorrow 9:00', icon: <CalendarClock />, onClick: () => { updateTask(t.id, { dueAt: startOfDay() + DAY + 9 * HOUR }); toast({ title: 'Moved to tomorrow' }); } },
            { label: 'Next week', icon: <CalendarDays />, onClick: () => { updateTask(t.id, { dueAt: startOfDay() + 7 * DAY + 9 * HOUR }); toast({ title: 'Moved to next week' }); } },
            { divider: true },
            { label: 'Delete task', icon: <Trash2 />, danger: true, onClick: () => { deleteTask(t.id); toast({ title: 'Task deleted' }); } },
          ]} />
      </div>
    </div>
  );
}

function WeekView({ tasks }: { tasks: Task[] }) {
  const [offset, setOffset] = useState(0);
  const today = startOfDay();
  const dow = (new Date(today).getDay() + 6) % 7;
  const weekStart = today - dow * DAY + offset * 7 * DAY;
  const days = Array.from({ length: 7 }, (_, i) => weekStart + i * DAY);
  const hours = Array.from({ length: 11 }, (_, i) => i + 8);
  const ROW = 52;
  const nowTop = ((Date.now() - today) / HOUR - 8) * ROW;
  return (
    <div>
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <IconButton label="Previous week" size="sm" variant="outline" onClick={() => setOffset(offset - 1)}><ChevronLeft className="size-4" /></IconButton>
        <IconButton label="Next week" size="sm" variant="outline" onClick={() => setOffset(offset + 1)}><ChevronRight className="size-4" /></IconButton>
        <span className="text-[13px] font-semibold">{fmtDate(weekStart, { month: 'long', day: 'numeric' })} – {fmtDate(weekStart + 6 * DAY, { month: 'short', day: 'numeric' })}</span>
        {offset !== 0 && <Button size="xs" variant="ghost" onClick={() => setOffset(0)}>Today</Button>}
      </div>
      <div className="scroll-x">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b">
            <span />
            {days.map((d) => (
              <div key={d} className={cn('border-l px-2 py-2 text-center', d === today && 'bg-brand/[.04]')}>
                <div className="text-[11px] font-medium text-muted">{fmtDate(d, { weekday: 'short' })}</div>
                <div className={cn('num mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-[14px] font-semibold', d === today && 'bg-brand text-white')}>{new Date(d).getDate()}</div>
              </div>
            ))}
          </div>
          <div className="relative grid grid-cols-[52px_repeat(7,1fr)]">
            <div>{hours.map((h) => <div key={h} className="num pr-2 pt-1 text-right text-[10.5px] text-faint" style={{ height: ROW }}>{h % 12 || 12}{h < 12 ? ' AM' : ' PM'}</div>)}</div>
            {days.map((d) => {
              const items = tasks.filter((t) => startOfDay(t.dueAt) === d);
              return (
                <div key={d} className={cn('relative border-l', d === today && 'bg-brand/[.025]')}>
                  {hours.map((h) => <div key={h} className="border-b border-line/60" style={{ height: ROW }} />)}
                  {items.map((t, i) => {
                    const top = ((t.dueAt - d) / HOUR - 8) * ROW;
                    const h = Math.max(26, ((t.durationMin ?? 30) / 60) * ROW - 2);
                    const M = typeMeta[t.type];
                    if (top < 0 || top > hours.length * ROW) return null;
                    const party = t.ref ? resolveRef(t.ref) : undefined;
                    return (
                      <div key={t.id} title={`${t.title} · ${party?.name ?? ''}`} className={cn('absolute overflow-hidden rounded-md px-1.5 py-1 text-[11px] leading-tight shadow-[0_1px_2px_rgb(var(--shadow)/.08)] transition hover:z-10 hover:shadow-pop', t.done && 'opacity-50')}
                        style={{ top: top + 1, height: h, left: 3 + (i % 2) * 6, right: 3, background: `color-mix(in srgb, ${M.color} 14%, rgb(var(--surface)))`, borderLeft: `3px solid ${M.color}` }}>
                        <div className={cn('truncate font-semibold text-fg', t.done && 'line-through')}>{t.title}</div>
                        {h > 34 && <div className="truncate text-muted">{fmtTime(t.dueAt)} · {party?.name}</div>}
                      </div>
                    );
                  })}
                  {d === today && nowTop > 0 && nowTop < hours.length * ROW && (
                    <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: nowTop }}><span className="-ml-1 size-2 rounded-full bg-danger" /><span className="h-px flex-1 bg-danger" /></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const { tasks, reps } = useCRM();
  const open = useUI((s) => s.open);
  const [view, setView] = useState<'list' | 'week'>('list');
  const [scope, setScope] = useState<'mine' | 'team'>('mine');
  const [types, setTypes] = useState<TaskType[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [showDone, setShowDone] = useState(false);

  const list = useMemo(() => tasks.filter((t) => (scope === 'team' || t.ownerId === ME) && (!types.length || types.includes(t.type)) && (!owners.length || owners.includes(t.ownerId))).sort((a, b) => a.dueAt - b.dueAt), [tasks, scope, types, owners]);
  const today = startOfDay();
  const open_ = list.filter((t) => !t.done);
  const groups: { key: string; label: string; items: Task[]; tone?: string }[] = [
    { key: 'overdue', label: 'Overdue', items: open_.filter((t) => t.dueAt < Date.now() && t.dueAt < today + DAY && startOfDay(t.dueAt) < today), tone: 'text-danger' },
    { key: 'today', label: 'Today', items: open_.filter((t) => startOfDay(t.dueAt) === today) },
    { key: 'tomorrow', label: 'Tomorrow', items: open_.filter((t) => startOfDay(t.dueAt) === today + DAY) },
    { key: 'week', label: 'Next 7 days', items: open_.filter((t) => t.dueAt >= today + 2 * DAY && t.dueAt < today + 8 * DAY) },
    { key: 'later', label: 'Later', items: open_.filter((t) => t.dueAt >= today + 8 * DAY) },
  ];
  const done = list.filter((t) => t.done).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  return (
    <div>
      <PageHeader title="Follow-ups" subtitle="Tasks, reminders and meetings — never let a warm lead go cold."
        actions={<>
          <Segmented value={scope} onChange={setScope} options={[{ value: 'mine', label: 'My tasks' }, { value: 'team', label: 'Team' }]} />
          <Segmented value={view} onChange={setView} options={[{ value: 'list', label: 'List', icon: <List /> }, { value: 'week', label: 'Week', icon: <CalendarDays /> }]} />
          <Button variant="primary" icon={<Plus />} onClick={() => open({ kind: 'task' })}>New task</Button>
        </>} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Overdue" value={groups[0]!.items.length} sub="Needs attention now" icon={<AlarmClock />} accent="#e05260" />
        <StatTile label="Due today" value={groups[1]!.items.length} sub={`${groups[1]!.items.filter((t) => t.type === 'Call').length} calls · ${groups[1]!.items.filter((t) => t.type === 'Meeting' || t.type === 'Demo').length} meetings`} icon={<Clock3 />} accent="#5856ee" />
        <StatTile label="Upcoming (7d)" value={groups[2]!.items.length + groups[3]!.items.length} sub="Scheduled ahead" icon={<ListTodo />} accent="#8b6cf6" />
        <StatTile label="Completed" value={done.length} sub="Last 7 days" icon={<CheckCircle2 />} accent="#22a06b" />
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
          <FilterChip label="Type" values={types} onChange={setTypes} options={(Object.keys(typeMeta) as TaskType[]).map((t) => { const I = typeMeta[t].icon; return { value: t, label: t, icon: <I style={{ color: typeMeta[t].color }} /> }; })} />
          {scope === 'team' && <FilterChip label="Assignee" values={owners} onChange={setOwners} options={reps.map((r) => ({ value: r.id, label: r.name, icon: <Avatar name={r.name} hue={r.hue} size={16} /> }))} />}
          <span className="num ml-auto text-xs text-muted">{open_.length} open</span>
        </div>
        {view === 'week' ? <WeekView tasks={list} /> : (
          <div>
            {groups.filter((g) => g.items.length).map((g) => (
              <div key={g.key}>
                <div className={cn('flex items-center gap-2 bg-surface-2 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em]', g.tone ?? 'text-faint')}>{g.label}<span className="num rounded bg-sunken px-1 text-muted">{g.items.length}</span></div>
                {g.items.map((t) => <TaskRow key={t.id} t={t} />)}
              </div>
            ))}
            {!open_.length && <EmptyState icon={<CheckCircle2 />} title="Inbox zero" body="All follow-ups are done. Enjoy the calm." />}
            {done.length > 0 && (
              <>
                <button onClick={() => setShowDone(!showDone)} className="flex w-full items-center gap-2 border-t bg-surface-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint hover:text-muted">
                  <ChevronDown className={cn('size-3.5 transition', !showDone && '-rotate-90')} />Completed <span className="num rounded bg-sunken px-1">{done.length}</span>
                </button>
                {showDone && done.slice(0, 20).map((t) => <TaskRow key={t.id} t={t} />)}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
