import { useMemo, useState } from 'react';
import { Phone, Mail, Users, StickyNote, ArrowRightLeft, Handshake, CalendarCheck2, Sparkles, UserPlus, Send, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { useCRM, ME } from '@/store/crm';
import { toast } from '@/store/ui';
import type { ActivityType, EntityRef } from '@/types';
import { Avatar, Badge, Button } from './ui/primitives';
import { Segmented } from './ui/form';
import { RecordingPlayer } from './calling/RecordingPlayer';
import { cn, dayLabel, durationWords, fmtTime, startOfDay } from '@/lib/utils';

const meta: Record<ActivityType, { icon: typeof Phone; c: string }> = {
  call: { icon: Phone, c: 'text-success bg-success/10 ring-success/20' },
  email: { icon: Mail, c: 'text-info bg-info/10 ring-info/20' },
  meeting: { icon: Users, c: 'text-[#8b5cf6] bg-[#8b5cf6]/10 ring-[#8b5cf6]/20' },
  note: { icon: StickyNote, c: 'text-warning bg-warning/10 ring-warning/25' },
  status: { icon: ArrowRightLeft, c: 'text-muted bg-sunken ring-line-strong' },
  deal: { icon: Handshake, c: 'text-brand bg-brand/10 ring-brand/20' },
  task: { icon: CalendarCheck2, c: 'text-[#0d9488] bg-[#14b8a6]/10 ring-[#14b8a6]/20' },
  created: { icon: UserPlus, c: 'text-muted bg-sunken ring-line-strong' },
};

type Filter = 'all' | 'call' | 'email' | 'note' | 'meeting';

export function Timeline({ entity, stickyTop = 'top-14' }: { entity: EntityRef; stickyTop?: string }) {
  const all = useCRM((s) => s.activities);
  const calls = useCRM((s) => s.calls);
  const reps = useCRM((s) => s.reps);
  const addActivity = useCRM((s) => s.addActivity);
  const [filter, setFilter] = useState<Filter>('all');
  const [mode, setMode] = useState<'note' | 'email'>('note');
  const [text, setText] = useState('');

  const items = useMemo(() => all.filter((a) => a.ref.id === entity.id && (filter === 'all' || a.type === filter)), [all, entity.id, filter]);
  const groups = useMemo(() => {
    const g: { day: number; items: typeof items }[] = [];
    items.forEach((a) => { const d = startOfDay(a.at); const last = g[g.length - 1]; if (last && last.day === d) last.items.push(a); else g.push({ day: d, items: [a] }); });
    return g;
  }, [items]);

  const submit = () => {
    if (!text.trim()) return;
    addActivity(mode === 'note'
      ? { type: 'note', at: Date.now(), repId: ME, ref: entity, title: 'Note added', body: text.trim() }
      : { type: 'email', at: Date.now(), repId: ME, ref: entity, title: text.trim().split('\n')[0]!.slice(0, 80), body: 'Sent from leadVico · tracking enabled' });
    toast({ tone: 'success', title: mode === 'note' ? 'Note saved' : 'Email sent', body: 'Added to the activity timeline' });
    setText('');
  };

  return (
    <div>
      <div className="rounded-xl bg-surface shadow-[0_0_0_1px_rgb(var(--line-strong))] transition focus-within:shadow-[0_0_0_1px_rgb(var(--brand)),0_0_0_4px_rgb(var(--brand)/.12)]">
        <div className="flex items-center gap-1 border-b px-2 pt-1.5">
          {(['note', 'email'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={cn('relative flex items-center gap-1.5 px-2 pb-2 pt-1 text-xs font-medium', mode === m ? 'text-fg' : 'text-muted hover:text-fg')}>
              {m === 'note' ? <StickyNote className="size-3.5" /> : <Mail className="size-3.5" />}{m === 'note' ? 'Note' : 'Email'}
              {mode === m && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded bg-fg" />}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
          rows={2}
          placeholder={mode === 'note' ? 'Add a note… use @ to mention a teammate' : 'Subject line, then your message…'}
          className="block w-full resize-none bg-transparent px-3 py-2.5 text-[13px] outline-none placeholder:text-faint"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <button onClick={() => setText(mode === 'note' ? 'Spoke with the champion — budget approved for Q1, waiting on IT security sign-off. Next: send SOC 2 pack + schedule technical review.' : 'Following up on our conversation\n\nHi — great speaking today. As promised, attaching the proposal and security pack.')} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand/10"><Sparkles className="size-3.5" />Draft with Vico AI</button>
          <Button size="sm" variant="primary" icon={<Send />} disabled={!text.trim()} onClick={submit}>{mode === 'note' ? 'Save note' : 'Send'}<span className="ml-1 hidden text-[10px] opacity-60 sm:inline">⌘↵</span></Button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs font-semibold text-fg-2">{items.length} activities</span>
        <Segmented size="sm" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'call', label: 'Calls' }, { value: 'email', label: 'Emails' }, { value: 'meeting', label: 'Meetings' }, { value: 'note', label: 'Notes' }]} />
      </div>

      <div className="mt-3">
        {groups.map((g) => (
          <div key={g.day} className="mb-2">
            <div className={cn('sticky z-10', stickyTop, ' -mx-1 bg-gradient-to-b from-surface via-surface to-transparent px-1 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint')}>{dayLabel(g.day)}</div>
            {g.items.map((a, i) => {
              const M = meta[a.type];
              const rep = reps.find((r) => r.id === a.repId);
              const call = a.callId ? calls.find((c) => c.id === a.callId) : undefined;
              const CallI = call ? (call.status === 'missed' ? PhoneMissed : call.direction === 'inbound' ? PhoneIncoming : PhoneOutgoing) : M.icon;
              return (
                <div key={a.id} className="relative flex animate-fade-in gap-3 pb-4">
                  {i < g.items.length - 1 && <span className="absolute left-[13.5px] top-8 h-[calc(100%-26px)] w-px bg-line" />}
                  <span className={cn('relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-inset', M.c)}><CallI className="size-3.5" /></span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[13px] font-medium">{a.title}</span>
                      {call && call.duration > 0 && <Badge>{durationWords(call.duration)}</Badge>}
                      {call?.recorded && <Badge tone="danger">● Recorded</Badge>}
                      {call?.sentiment && <Badge tone={call.sentiment === 'positive' ? 'success' : call.sentiment === 'negative' ? 'danger' : 'neutral'}>{call.sentiment}</Badge>}
                      <span className="ml-auto flex items-center gap-1.5 text-[11px] text-faint">{rep && <Avatar name={rep.name} hue={rep.hue} size={16} />}{rep?.name.split(' ')[0]} · {fmtTime(a.at)}</span>
                    </div>
                    {a.body && <p className={cn('mt-1 text-[13px] leading-[1.5] text-fg-2', a.type === 'note' && 'rounded-lg bg-warning/[.06] px-3 py-2 ring-1 ring-inset ring-warning/15')}>{a.body}</p>}
                    {call?.summary && (
                      <div className="mt-2 rounded-lg bg-brand/[.05] px-3 py-2 ring-1 ring-inset ring-brand/15">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-brand"><Sparkles className="size-3" />Vico AI summary</div>
                        <p className="mt-0.5 text-[12.5px] leading-[1.5] text-fg-2">{call.summary}</p>
                      </div>
                    )}
                    {call?.recorded && <div className="mt-2 max-w-[520px]"><RecordingPlayer ownerId={call.repId} seed={call.id} length={call.duration} compact /></div>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {groups.length === 0 && <div className="py-10 text-center text-sm text-muted">No activity yet.</div>}
      </div>
    </div>
  );
}
