import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play, Grid3x3, ArrowRightLeft, Minimize2, Maximize2, Sparkles, StickyNote, Circle, PhoneIncoming, MessageSquareText, Clock3, CalendarPlus, Check,
} from 'lucide-react';
import { usePhone } from '@/store/phone';
import { usePrefs } from '@/store/prefs';
import { useCRM, ME } from '@/store/crm';
import { toast } from '@/store/ui';
import { useTelephony } from '@/store/telephony';
import { providerById } from '@/data/providers';
import { transcriptScript } from '@/data/seed';
import { Avatar, Button, Badge } from '../ui/primitives';
import { Textarea } from '../ui/form';
import { Modal } from '../ui/overlay';
import { cn, duration, DAY, HOUR, relTime, startOfDay } from '@/lib/utils';
import type { Disposition } from '@/types';

function useNow(active: boolean, ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!active) return; const i = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(i); }, [active, ms]);
  return now;
}

/** Animated voice waveform — purely visual. */
export function Waveform({ active, bars = 28, className, color }: { active: boolean; bars?: number; className?: string; color?: string }) {
  const [t, setT] = useState(0);
  useEffect(() => { if (!active) return; const i = setInterval(() => setT((x) => x + 1), 110); return () => clearInterval(i); }, [active]);
  return (
    <div className={cn('flex h-8 items-center gap-[3px]', className)}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = active ? 0.18 + Math.abs(Math.sin(i * 0.9 + t * 0.6) * Math.cos(i * 0.35 + t * 0.23)) * 0.82 : 0.12;
        return <span key={i} className="w-[3px] rounded-full transition-[height] duration-100" style={{ height: `${h * 100}%`, background: color ?? 'currentColor', opacity: 0.35 + h * 0.65 }} />;
      })}
    </div>
  );
}

const keys = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']];
export function Keypad({ onKey, compact }: { onKey: (k: string) => void; compact?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map(([k, l]) => (
        <button
          key={k}
          onClick={() => onKey(k!)}
          className={cn('group flex flex-col items-center justify-center rounded-xl bg-sunken font-medium transition hover:bg-line active:scale-95', compact ? 'h-11' : 'h-14')}
        >
          <span className={cn('num leading-none', compact ? 'text-lg' : 'text-xl')}>{k}</span>
          {l && <span className="mt-0.5 text-[9px] font-semibold tracking-[0.14em] text-faint">{l}</span>}
        </button>
      ))}
    </div>
  );
}

function CtlButton({ on, onClick, icon, label, danger }: { on?: boolean; onClick: () => void; icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center gap-1.5">
      <span className={cn(
        'flex size-11 items-center justify-center rounded-full transition [&_svg]:size-[18px]',
        on ? (danger ? 'bg-danger text-white' : 'bg-fg text-bg') : 'bg-white/[.08] text-white hover:bg-white/[.14]',
      )}>{icon}</span>
      <span className="text-[10.5px] font-medium text-white/60">{label}</span>
    </button>
  );
}

/* ───────────────────────── Incoming ───────────────────────── */
function Incoming() {
  const { target, answer, decline } = usePhone();
  const lead = useCRM((s) => (target?.ref?.type === 'lead' ? s.leads.find((l) => l.id === target.ref!.id) : undefined));
  const lastCall = useCRM((s) => s.calls.find((c) => c.ref.id === target?.ref?.id));
  if (!target) return null;
  return (
    <div className="fixed inset-x-3 top-3 z-[90] mx-auto max-w-[400px] animate-slide-up sm:inset-x-auto sm:right-5 sm:top-5">
      <div className="overflow-hidden rounded-2xl bg-[#121318] text-white shadow-float ring-1 ring-white/10">
        <div className="relative px-5 pb-4 pt-5">
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgb(88_86_238/.35),transparent_60%)]" />
          <div className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">
            <PhoneIncoming className="size-3.5 animate-wiggle text-success" />Incoming call · Sales line
          </div>
          <div className="relative mt-4 flex items-center gap-3.5">
            <span className="relative">
              <span className="absolute inset-0 animate-ring rounded-full bg-success/50" />
              <Avatar name={target.name} hue={target.hue} size={52} />
            </span>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold tracking-[-0.01em]">{target.name}</div>
              <div className="truncate text-xs text-white/60">{target.subtitle}</div>
              <div className="num mt-0.5 text-xs text-white/45">{target.phone}</div>
            </div>
          </div>
          {lead && (
            <div className="relative mt-4 grid grid-cols-3 gap-2 rounded-xl bg-white/[.06] p-2.5 text-center ring-1 ring-white/[.06]">
              <div><div className="num text-sm font-semibold">{lead.score}</div><div className="text-[10px] text-white/50">Lead score</div></div>
              <div><div className="text-sm font-semibold">{lead.status}</div><div className="text-[10px] text-white/50">Status</div></div>
              <div><div className="text-sm font-semibold">{lastCall ? relTime(lastCall.startedAt) : '—'}</div><div className="text-[10px] text-white/50">Last call</div></div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 px-5 pb-5">
          <button onClick={decline} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-danger font-semibold transition hover:brightness-110"><PhoneOff className="size-4" />Decline</button>
          <button onClick={answer} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-success font-semibold transition hover:brightness-110"><Phone className="size-4" />Answer</button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Active call ───────────────────────── */
function ActiveCall() {
  const s = usePhone();
  const liveTranscript = usePrefs((p) => p.liveTranscript);
  const now = useNow(true);
  const [tab, setTab] = useState<'transcript' | 'notes'>('transcript');
  const scroller = useRef<HTMLDivElement>(null);
  const connected = s.status === 'connected';

  // Stream the simulated transcript.
  useEffect(() => {
    if (!connected || s.onHold || !liveTranscript) return;
    const i = setInterval(() => {
      const st = usePhone.getState();
      if (st.transcript.length < transcriptScript.length) { const line = transcriptScript[st.transcript.length]!; const first = useCRM.getState().reps.find((r) => r.id === ME)?.name.split(' ')[0] ?? 'Aisha'; st.pushTranscript({ ...line, text: line.text.replace('Aisha', first) }); }
    }, 3400);
    return () => clearInterval(i);
  }, [connected, s.onHold, liveTranscript]);
  useEffect(() => { scroller.current?.scrollTo({ top: 9e9, behavior: 'smooth' }); }, [s.transcript.length]);

  const tel = useTelephony.getState();
  const prov = providerById(tel.provider);
  if (!s.target) return null;
  const sinceReq = (now - s.requestedAt) / 1000;
  const dialLabel = s.direction === 'inbound' ? 'Connecting' : prov && tel.mode === 'bridge' && tel.myMobile ? (sinceReq < 1.6 ? 'Ringing your mobile' : 'Connecting customer') : 'Dialing';
  const elapsed = connected ? (now - s.connectedAt) / 1000 : 0;
  const href = s.target.ref ? (s.target.ref.type === 'lead' ? `/leads/${s.target.ref.id}` : `/contacts?id=${s.target.ref.id}`) : undefined;

  if (s.minimized) {
    return (
      <button onClick={() => s.set({ minimized: false })} className="fixed bottom-4 right-4 z-[85] flex animate-slide-up items-center gap-3 rounded-full bg-[#121318] py-2 pl-2 pr-4 text-white shadow-float ring-1 ring-white/10">
        <Avatar name={s.target.name} hue={s.target.hue} size={34} />
        <div className="text-left leading-tight">
          <div className="text-[13px] font-semibold">{s.target.name}</div>
          <div className="num text-[11px] text-white/60">{connected ? duration(elapsed) : 'Calling…'}{s.recording && connected && <span className="ml-1.5 text-danger">● REC</span>}</div>
        </div>
        <Waveform active={connected && !s.onHold && !s.muted} bars={10} className="ml-1 h-5 text-success" />
        <Maximize2 className="ml-1 size-3.5 text-white/50" />
      </button>
    );
  }

  const insights = [
    s.transcript.length >= 4 && { icon: '💡', text: 'Pain detected: ~40 min/day manual logging. Quantify ROI → 26 hrs/rep/month.' },
    s.transcript.length >= 6 && { icon: '💰', text: 'Pricing question. Enterprise tier, 40 seats — volume discount available at 50+.' },
    s.transcript.length >= 8 && { icon: '🛡️', text: 'Compliance: SSO + audit trail are included in Enterprise. Offer security pack.' },
    s.transcript.length >= 10 && { icon: '📅', text: 'Commitment: Demo Thu 2pm with IT. Log as “Meeting booked”.' },
  ].filter(Boolean) as { icon: string; text: string }[];

  return (
    <div className="fixed inset-x-2 bottom-2 z-[85] animate-slide-up sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[392px]">
      <div className="flex max-h-[calc(100vh-24px)] flex-col overflow-hidden rounded-2xl bg-[#121318] text-white shadow-float ring-1 ring-white/10">
        {/* header */}
        <div className="relative shrink-0 px-4 pb-4 pt-3.5">
          <div className={cn('absolute inset-0', connected ? 'bg-[radial-gradient(120%_90%_at_100%_0%,rgb(34_160_107/.28),transparent_60%)]' : 'bg-[radial-gradient(120%_90%_at_100%_0%,rgb(88_86_238/.35),transparent_60%)]')} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55">
              {connected ? <><span className="size-1.5 animate-blink rounded-full bg-success" />{s.onHold ? 'On hold' : 'Connected'}</> : <><span className="size-1.5 animate-blink rounded-full bg-brand" />{dialLabel}</>}
              <span className="text-white/30">·</span>
              <span className="normal-case tracking-normal">{s.direction === 'outbound' ? 'Outbound' : 'Inbound'}{prov ? ` · via ${prov.name}` : ' · demo line'}</span>
            </div>
            <div className="flex items-center gap-1">
              {s.recording && connected && <span className="mr-1 flex items-center gap-1 rounded bg-danger/20 px-1.5 py-0.5 text-[10px] font-bold text-[#ff8a93]"><Circle className="size-2 animate-blink fill-current" />REC</span>}
              <button onClick={() => s.set({ minimized: true })} className="rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white"><Minimize2 className="size-3.5" /></button>
            </div>
          </div>
          <div className="relative mt-3 flex items-center gap-3">
            <span className="relative">
              {!connected && <span className="absolute inset-0 animate-ring rounded-full bg-brand/60" />}
              <Avatar name={s.target.name} hue={s.target.hue} size={46} />
            </span>
            <div className="min-w-0 flex-1">
              {href ? <Link to={href} className="block truncate text-[16px] font-semibold tracking-[-0.01em] hover:underline">{s.target.name}</Link> : <div className="truncate text-[16px] font-semibold">{s.target.name}</div>}
              <div className="truncate text-xs text-white/55">{s.target.subtitle ?? 'Unknown caller'}</div>
            </div>
            <div className="text-right">
              <div className="num text-[22px] font-semibold tracking-tight">{connected ? duration(elapsed) : '—:—'}</div>
              <div className="num text-[11px] text-white/45">{s.target.phone}</div>
            </div>
          </div>
          <Waveform active={connected && !s.onHold && !s.muted} bars={44} className="relative mt-3 h-7 justify-center text-success" />
        </div>

        {/* body */}
        {s.keypad ? (
          <div className="shrink-0 px-6 pb-2 [&_button]:bg-white/[.06] [&_button:hover]:bg-white/[.12] [&_span.text-faint]:text-white/40">
            <div className="num mb-2 h-6 text-center text-lg tracking-[0.2em] text-white/80">{s.dtmf || ' '}</div>
            <Keypad compact onKey={(k) => s.set({ dtmf: (s.dtmf + k).slice(-16) })} />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col border-t border-white/[.07]">
            <div className="flex shrink-0 gap-1 px-3 pt-2">
              {(['transcript', 'notes'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium capitalize transition', tab === t ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white')}>
                  {t === 'transcript' ? <MessageSquareText className="size-3.5" /> : <StickyNote className="size-3.5" />}{t === 'transcript' ? 'Live transcript' : 'Notes'}
                </button>
              ))}
            </div>
            {tab === 'transcript' ? (
              <div ref={scroller} className="h-[200px] space-y-2 overflow-y-auto px-4 py-3">
                {!connected && <div className="py-8 text-center text-xs text-white/40">Transcript starts when the call connects</div>}
                {connected && s.transcript.length === 0 && <div className="flex items-center gap-2 py-8 text-xs text-white/40"><span className="size-1.5 animate-blink rounded-full bg-white/50" />Listening…</div>}
                {s.transcript.map((l, i) => (
                  <div key={i} className={cn('flex animate-fade-in', l.who === 'rep' ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[85%] rounded-2xl px-3 py-1.5 text-[12.5px] leading-[1.45]', l.who === 'rep' ? 'rounded-br-md bg-brand/90' : 'rounded-bl-md bg-white/[.08]')}>{l.text}</div>
                  </div>
                ))}
                {insights.length > 0 && (
                  <div className="mt-3 space-y-1.5 rounded-xl bg-gradient-to-br from-brand/25 to-brand/5 p-2.5 ring-1 ring-brand/30">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#b9b8ff]"><Sparkles className="size-3" />Vico AI</div>
                    {insights.slice(-2).map((x) => <div key={x.text} className="animate-fade-in text-[12px] leading-[1.4] text-white/85">{x.icon} {x.text}</div>)}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3">
                <textarea
                  value={s.notes}
                  onChange={(e) => s.set({ notes: e.target.value })}
                  placeholder="Type notes — they’re saved to the call record…"
                  className="h-[188px] w-full resize-none rounded-lg bg-white/[.06] p-3 text-[13px] text-white outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-brand"
                />
              </div>
            )}
          </div>
        )}

        {/* controls */}
        <div className="shrink-0 border-t border-white/[.07] px-4 pb-4 pt-3">
          <div className="flex items-start justify-between px-1">
            <CtlButton on={s.muted} onClick={() => s.set({ muted: !s.muted })} icon={s.muted ? <MicOff /> : <Mic />} label={s.muted ? 'Unmute' : 'Mute'} />
            <CtlButton on={s.onHold} onClick={() => s.set({ onHold: !s.onHold })} icon={s.onHold ? <Play /> : <Pause />} label={s.onHold ? 'Resume' : 'Hold'} />
            <CtlButton on={s.keypad} onClick={() => s.set({ keypad: !s.keypad })} icon={<Grid3x3 />} label="Keypad" />
            <CtlButton on={s.recording} danger onClick={() => s.set({ recording: !s.recording })} icon={<Circle className={cn(s.recording && 'fill-current')} />} label="Record" />
            <CtlButton onClick={() => toast({ title: 'Warm transfer', body: 'Daniel Okafor (Head of Enterprise) is available — transfer request sent.' })} icon={<ArrowRightLeft />} label="Transfer" />
          </div>
          <button onClick={s.hangup} className="mt-3.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-danger text-sm font-semibold transition hover:brightness-110 active:scale-[.99]">
            <PhoneOff className="size-4" />End call
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Wrap-up ───────────────────────── */
const dispositions: { value: Disposition; tone: string }[] = [
  { value: 'Meeting booked', tone: 'success' }, { value: 'Interested', tone: 'success' }, { value: 'Call back later', tone: 'warning' },
  { value: 'Not interested', tone: 'danger' }, { value: 'Left voicemail', tone: 'neutral' }, { value: 'No answer', tone: 'neutral' }, { value: 'Wrong number', tone: 'neutral' },
];
function WrapUp() {
  const s = usePhone();
  const [disp, setDisp] = useState<Disposition>(s.answered ? (s.transcript.length >= 9 ? 'Meeting booked' : 'Interested') : 'No answer');
  const [notes, setNotes] = useState(s.notes);
  const [follow, setFollow] = useState(true);
  const [when, setWhen] = useState<'tomorrow' | '3d' | 'week'>('tomorrow');
  const talk = s.answered ? Math.round((s.endedAt - s.connectedAt) / 1000) : 0;
  const due = { tomorrow: startOfDay() + DAY + 10 * HOUR, '3d': startOfDay() + 3 * DAY + 10 * HOUR, week: startOfDay() + 7 * DAY + 10 * HOUR }[when];
  const aiSummary = s.answered && s.transcript.length > 3;

  return (
    <Modal
      open
      onClose={s.discardWrapUp}
      width={540}
      icon={<Check />}
      title="Wrap up call"
      description={<>{s.target?.name} · {s.direction} · <span className="num">{s.answered ? duration(talk) : 'not connected'}</span>{s.answered && s.recording && ' · recording saved'}</>}
      footer={<>
        <Button variant="ghost" onClick={s.discardWrapUp}>Discard</Button>
        <Button variant="primary" onClick={() => s.completeWrapUp({ disposition: disp, notes: notes || (aiSummary ? 'See AI summary.' : ''), followUp: follow ? { title: `Follow up with ${s.target?.name?.split(' ')[0]} — ${disp.toLowerCase()}`, dueAt: due } : undefined })}>Save & log call</Button>
      </>}
    >
      <div className="space-y-4">
        <div>
          <div className="label">Call outcome</div>
          <div className="flex flex-wrap gap-1.5">
            {dispositions.filter((d) => (s.answered ? !['No answer', 'Left voicemail'].includes(d.value) : ['No answer', 'Left voicemail', 'Wrong number'].includes(d.value))).map((d) => (
              <button
                key={d.value}
                onClick={() => setDisp(d.value)}
                className={cn('h-8 rounded-lg px-3 text-xs font-medium transition', disp === d.value ? 'bg-brand text-white shadow-sm' : 'bg-sunken text-fg-2 shadow-[inset_0_0_0_1px_rgb(var(--line))] hover:bg-line')}
              >{d.value}</button>
            ))}
          </div>
        </div>
        {aiSummary && (
          <div className="rounded-xl bg-brand/[.06] p-3 ring-1 ring-inset ring-brand/20">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand"><Sparkles className="size-3.5" />Vico AI call summary</div>
            <p className="mt-1.5 text-[13px] leading-[1.5] text-fg-2">Prospect confirmed ~40 seats; key pain is ~40 min/day of manual call logging. Requires SSO and audit trail. Agreed next step: technical demo with IT on Thursday at 2pm; send Enterprise proposal today.</p>
            <div className="mt-2 flex flex-wrap gap-1.5"><Badge tone="success">Positive sentiment</Badge><Badge tone="brand">Talk ratio 46 / 54</Badge><Badge>Pricing discussed</Badge></div>
          </div>
        )}
        <div>
          <div className="label">Notes</div>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What happened on the call?" />
        </div>
        <div className="rounded-xl p-3 shadow-[inset_0_0_0_1px_rgb(var(--line-strong))]">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} className="size-4 accent-[rgb(var(--brand))]" />
            <CalendarPlus className="size-4 text-muted" />
            <span className="text-[13px] font-medium">Schedule a follow-up call</span>
          </label>
          {follow && (
            <div className="mt-2.5 flex flex-wrap gap-1.5 pl-[26px]">
              {([['tomorrow', 'Tomorrow 10:00'], ['3d', 'In 3 days'], ['week', 'Next week']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setWhen(k)} className={cn('flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium', when === k ? 'bg-fg text-bg' : 'bg-sunken text-fg-2 hover:bg-line')}><Clock3 className="size-3" />{l}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function Softphone() {
  const status = usePhone((s) => s.status);
  if (status === 'ringing') return <Incoming />;
  if (status === 'dialing' || status === 'connected') return <ActiveCall />;
  if (status === 'wrap-up') return <WrapUp />;
  return null;
}
