import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Info, X, PhoneIncoming, PhoneOutgoing, PhoneMissed, Voicemail, PhoneOff, Mic } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Avatar, Badge, type Tone } from './ui/primitives';
import { Select } from './ui/form';
import { useCRM } from '@/store/crm';
import { useUI } from '@/store/ui';
import type { Call, LeadStatus, Stage } from '@/types';
import { cn } from '@/lib/utils';

export function PageHeader({ title, subtitle, actions, children, icon }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 text-[22px] font-semibold leading-tight tracking-[-0.022em] text-fg">
            {icon && <span className="text-muted [&_svg]:size-5">{icon}</span>}
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export const LEAD_STATUSES: { value: LeadStatus; tone: Tone }[] = [
  { value: 'New', tone: 'info' },
  { value: 'Contacted', tone: 'violet' },
  { value: 'Qualified', tone: 'success' },
  { value: 'Nurturing', tone: 'warning' },
  { value: 'Unqualified', tone: 'neutral' },
  { value: 'Converted', tone: 'teal' },
];
export const statusTone = (s: LeadStatus) => LEAD_STATUSES.find((x) => x.value === s)!.tone;
export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge tone={statusTone(status)} dot>{status}</Badge>;
}

export function StageBadge({ stage }: { stage: Stage }) {
  const st = useCRM((s) => s.stages.find((x) => x.id === stage));
  return (
    <span className="inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-[5px] bg-sunken px-1.5 text-[11px] font-medium text-fg-2 ring-1 ring-inset ring-line-strong">
      <span className="size-1.5 rounded-full" style={{ background: st?.color }} />
      {stage}
    </span>
  );
}

export function RepChip({ id, size = 20, showName = true, className }: { id?: string | null; size?: number; showName?: boolean; className?: string }) {
  const rep = useCRM((s) => (id ? s.reps.find((r) => r.id === id) : undefined));
  if (!rep) return <span className={cn('inline-flex items-center gap-1.5 text-xs text-faint', className)}><span className="rounded-full border border-dashed border-line-strong" style={{ width: size, height: size }} />{showName && 'Unassigned'}</span>;
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5', className)}>
      <Avatar name={rep.name} hue={rep.hue} size={size} />
      {showName && <span className="truncate text-[13px] text-fg-2">{rep.name}</span>}
    </span>
  );
}

export function RepSelect({ value, onChange, allowUnassigned, size, className, placeholder }: { value: string | null; onChange: (v: string | null) => void; allowUnassigned?: boolean; size?: 'sm' | 'md'; className?: string; placeholder?: string }) {
  const reps = useCRM((s) => s.reps);
  const opts = [
    ...(allowUnassigned ? [{ value: '__none', label: 'Unassigned', icon: <span className="block size-3.5 rounded-full border border-dashed border-faint" /> }] : []),
    ...reps.map((r) => ({ value: r.id, label: r.name, hint: r.role === 'SDR' ? 'SDR' : r.role === 'Account Executive' ? 'AE' : r.role === 'Sales Manager' ? 'Mgr' : 'Admin', icon: <Avatar name={r.name} hue={r.hue} size={16} /> })),
  ];
  return <Select value={value ?? (allowUnassigned ? '__none' : null)} onChange={(v) => onChange(v === '__none' ? null : v)} options={opts} size={size} className={className} width={240} placeholder={placeholder} />;
}

export function EntityLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return <Link to={to} onClick={(e) => e.stopPropagation()} className={cn('font-medium text-fg decoration-line-strong underline-offset-2 hover:underline', className)}>{children}</Link>;
}

/* ───────────────────────── Calls ───────────────────────── */
export function CallIcon({ call, className }: { call: Pick<Call, 'direction' | 'status'>; className?: string }) {
  const map = {
    missed: { I: PhoneMissed, c: 'text-danger bg-danger/10' },
    voicemail: { I: Voicemail, c: 'text-warning bg-warning/10' },
    'no-answer': { I: PhoneOff, c: 'text-muted bg-sunken' },
    completed: call.direction === 'inbound' ? { I: PhoneIncoming, c: 'text-info bg-info/10' } : { I: PhoneOutgoing, c: 'text-success bg-success/10' },
  }[call.status];
  return <span className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-lg', map.c, className)}><map.I className="size-3.5" /></span>;
}
export function RecordingBadge() {
  return <span className="inline-flex items-center gap-1 rounded bg-danger/10 px-1 text-[10.5px] font-semibold text-danger"><Mic className="size-2.5" />REC</span>;
}

/* ───────────────────────── Charts ───────────────────────── */
export function Sparkline({ data, color = 'rgb(var(--brand))', height = 36 }: { data: number[]; color?: string; height?: number }) {
  const id = `sp${Math.abs(data.reduce((a, b) => a * 31 + b, 7)) % 1e6}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data.map((v, i) => ({ i, v }))} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.6} fill={`url(#${id})`} isAnimationActive={false} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ChartTooltip({ active, payload, label, format }: { active?: boolean; payload?: { name: string; value: number; color: string; dataKey: string }[]; label?: string; format?: (v: number, key: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[150px] rounded-lg bg-surface px-3 py-2 text-xs shadow-pop">
      {label && <div className="mb-1.5 font-semibold text-fg">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted"><span className="size-2 rounded-sm" style={{ background: p.color }} />{p.name}</span>
          <span className="num font-medium text-fg">{format ? format(p.value, p.dataKey) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-xs text-muted">
          {i.dashed ? <span className="w-3 border-t-[1.5px] border-dashed" style={{ borderColor: i.color }} /> : <span className="size-2 rounded-sm" style={{ background: i.color }} />}
          {i.label}
        </span>
      ))}
    </div>
  );
}

/* ───────────────────────── Toaster ───────────────────────── */
export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:right-4 sm:top-auto sm:bottom-4 sm:items-end">
      {toasts.map((t) => {
        const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'danger' ? AlertCircle : Info;
        return (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-[380px] animate-slide-up items-start gap-2.5 rounded-xl bg-surface p-3 pr-2 shadow-float">
            <Icon className={cn('mt-0.5 size-4 shrink-0', t.tone === 'success' ? 'text-success' : t.tone === 'danger' ? 'text-danger' : 'text-brand')} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold">{t.title}</div>
              {t.body && <div className="mt-0.5 text-xs text-muted">{t.body}</div>}
              {t.action && <button onClick={() => { t.action!.onClick(); dismiss(t.id); }} className="mt-1.5 text-xs font-semibold text-brand hover:underline">{t.action.label}</button>}
            </div>
            <button onClick={() => dismiss(t.id)} className="rounded p-1 text-faint hover:bg-sunken hover:text-fg"><X className="size-3.5" /></button>
          </div>
        );
      })}
    </div>
  );
}

export function StatTile({ label, value, sub, icon, accent }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; accent?: string }) {
  return (
    <div className="card relative overflow-hidden p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        {icon && <span className="flex size-7 items-center justify-center rounded-lg [&_svg]:size-3.5" style={{ background: `color-mix(in srgb, ${accent ?? 'rgb(var(--brand))'} 12%, transparent)`, color: accent ?? 'rgb(var(--brand))' }}>{icon}</span>}
      </div>
      <div className="num mt-2 text-[22px] font-semibold tracking-[-0.02em]">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
