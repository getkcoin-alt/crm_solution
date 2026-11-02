import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { cn, initials } from '@/lib/utils';
import type { Presence } from '@/types';

/* ───────────────────────── Button ───────────────────────── */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type Size = 'xs' | 'sm' | 'md' | 'lg';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
}
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-brand-fg shadow-[inset_0_1px_0_rgb(255_255_255/.18),0_1px_2px_rgb(var(--shadow)/.2),0_0_0_1px_rgb(var(--brand))] hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface text-fg shadow-[0_1px_2px_rgb(var(--shadow)/.06),0_0_0_1px_rgb(var(--line-strong))] hover:bg-surface-2 hover:shadow-[0_1px_2px_rgb(var(--shadow)/.08),0_0_0_1px_rgb(var(--faint)/.6)]',
  outline: 'text-fg-2 shadow-[0_0_0_1px_rgb(var(--line-strong))] hover:bg-sunken hover:text-fg',
  ghost: 'text-fg-2 hover:bg-sunken hover:text-fg',
  danger: 'bg-danger text-white shadow-[inset_0_1px_0_rgb(255_255_255/.18),0_0_0_1px_rgb(var(--danger))] hover:brightness-110',
  success: 'bg-success text-white shadow-[inset_0_1px_0_rgb(255_255_255/.18),0_0_0_1px_rgb(var(--success))] hover:brightness-110',
};
const sizes: Record<Size, string> = {
  xs: 'h-6 px-2 text-xs gap-1 rounded-md',
  sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  md: 'h-8 px-3 text-sm gap-1.5 rounded-md',
  lg: 'h-10 px-4 text-sm gap-2 rounded-lg',
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, iconRight, loading, className, children, disabled, ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium transition-[background,box-shadow,filter,color,transform] duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[15px] [&_svg]:shrink-0',
        variants[variant], sizes[size], className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
      {iconRight}
    </button>
  );
});

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps & { label: string }>(function IconButton(
  { label, className, size = 'md', variant = 'ghost', children, ...rest }, ref,
) {
  const s = { xs: 'size-6', sm: 'size-7', md: 'size-8', lg: 'size-10' }[size];
  return (
    <Button ref={ref} aria-label={label} title={label} variant={variant} size={size} className={cn(s, '!px-0', className)} {...rest}>
      {children}
    </Button>
  );
});

export const Spinner = ({ className }: { className?: string }) => (
  <svg className={cn('size-4 animate-spin', className)} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* ───────────────────────── Badge ───────────────────────── */
export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'pink' | 'teal';
const tones: Record<Tone, string> = {
  neutral: 'bg-sunken text-fg-2 ring-line-strong',
  brand: 'bg-brand/10 text-brand ring-brand/20',
  success: 'bg-success/10 text-success ring-success/20',
  warning: 'bg-warning/10 text-warning ring-warning/25',
  danger: 'bg-danger/10 text-danger ring-danger/20',
  info: 'bg-info/10 text-info ring-info/20',
  violet: 'bg-[#8b5cf6]/10 text-[#7c4ddb] dark:text-[#a78bfa] ring-[#8b5cf6]/20',
  pink: 'bg-[#e8508a]/10 text-[#d0386f] dark:text-[#f472b6] ring-[#e8508a]/20',
  teal: 'bg-[#14b8a6]/10 text-[#0d9488] dark:text-[#2dd4bf] ring-[#14b8a6]/20',
};
export function Badge({ tone = 'neutral', dot, className, children, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span className={cn('inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-[5px] px-1.5 text-[11px] font-medium ring-1 ring-inset', tones[tone], className)} {...rest}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ───────────────────────── Avatar ───────────────────────── */
const presenceColor: Record<Presence, string> = { online: 'bg-success', 'on-call': 'bg-danger', away: 'bg-warning', offline: 'bg-faint' };
export function Avatar({ name, hue = 230, size = 28, presence, square, className }: { name: string; hue?: number; size?: number; presence?: Presence; square?: boolean; className?: string }) {
  return (
    <span className={cn('relative inline-flex shrink-0', className)} style={{ width: size, height: size }}>
      <span
        className={cn('flex size-full select-none items-center justify-center font-semibold tracking-tight text-white', square ? 'rounded-[28%]' : 'rounded-full')}
        style={{
          fontSize: Math.max(9, size * 0.38),
          background: `linear-gradient(140deg, hsl(${hue} 70% 62%), hsl(${(hue + 28) % 360} 64% 46%))`,
          boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / .14), inset 0 1px 0 rgb(255 255 255 / .2)',
        }}
      >
        {initials(name)}
      </span>
      {presence && (
        <span className={cn('absolute -bottom-px -right-px rounded-full ring-2 ring-surface', presenceColor[presence])} style={{ width: Math.max(7, size * 0.28), height: Math.max(7, size * 0.28) }} />
      )}
    </span>
  );
}
export function AvatarStack({ people, size = 22, max = 4 }: { people: { name: string; hue: number }[]; size?: number; max?: number }) {
  return (
    <div className="flex -space-x-1.5">
      {people.slice(0, max).map((p, i) => (
        <span key={i} className="rounded-full ring-2 ring-surface"><Avatar name={p.name} hue={p.hue} size={size} /></span>
      ))}
      {people.length > max && (
        <span className="flex items-center justify-center rounded-full bg-sunken text-2xs font-medium text-muted ring-2 ring-surface" style={{ width: size, height: size }}>+{people.length - max}</span>
      )}
    </div>
  );
}

export function CompanyLogo({ name, hue, size = 28 }: { name: string; hue: number; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[28%] font-bold text-white"
      style={{
        width: size, height: size, fontSize: size * 0.42,
        background: `linear-gradient(160deg, hsl(${hue} 32% 30%), hsl(${hue} 40% 18%))`,
        boxShadow: `inset 0 0 0 1px hsl(${hue} 40% 50% / .35), inset 0 1px 0 rgb(255 255 255 / .12)`,
      }}
    >
      <span style={{ color: `hsl(${hue} 85% 82%)` }}>{name[0]}</span>
    </span>
  );
}

/* ───────────────────────── Misc ───────────────────────── */
export const Kbd = ({ children, className }: { children: ReactNode; className?: string }) => (
  <kbd className={cn('inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] bg-surface px-1 font-mono text-[10px] font-medium text-muted shadow-[0_0_0_1px_rgb(var(--line-strong)),0_1px_0_rgb(var(--line-strong))]', className)}>{children}</kbd>
);

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card', className)} {...rest}>{children}</div>;
}
export function CardHeader({ title, subtitle, action, className, icon }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-4 pb-2 pt-3.5', className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[-0.005em] text-fg">{icon && <span className="text-muted [&_svg]:size-4">{icon}</span>}{title}</div>
        {subtitle && <div className="mt-0.5 text-xs text-muted">{subtitle}</div>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-1">{action}</div>}
    </div>
  );
}

export function Progress({ value, className, tone = 'brand', height = 6 }: { value: number; className?: string; tone?: 'brand' | 'success' | 'warning' | 'danger'; height?: number }) {
  const c = { brand: 'bg-brand', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' }[tone];
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-sunken', className)} style={{ height }}>
      <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', c)} style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} />
    </div>
  );
}

export function scoreTone(score: number) {
  return score >= 75 ? { color: 'rgb(var(--danger))', label: 'Hot', tone: 'danger' as const } : score >= 50 ? { color: 'rgb(var(--warning))', label: 'Warm', tone: 'warning' as const } : { color: 'rgb(var(--info))', label: 'Cold', tone: 'info' as const };
}
export function ScoreRing({ score, size = 30, stroke = 3 }: { score: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const { color } = scoreTone(score);
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--sunken))" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <span className="num absolute text-[10.5px] font-semibold text-fg" style={{ fontSize: size * 0.34 }}>{score}</span>
    </span>
  );
}

export function RadialProgress({ value, size = 64, stroke = 6, color = 'rgb(var(--brand))', children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--sunken))" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-sunken text-muted shadow-[inset_0_0_0_1px_rgb(var(--line))] [&_svg]:size-5">{icon}</div>
      <div className="text-sm font-semibold">{title}</div>
      {body && <div className="mt-1 max-w-xs text-xs text-muted">{body}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Delta({ value, invert, className }: { value: number; invert?: boolean; className?: string }) {
  const good = invert ? value < 0 : value >= 0;
  return (
    <span className={cn('num inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded px-1 text-[11px] font-semibold', good ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger', className)}>
      {value >= 0 ? '↑' : '↓'} {Math.abs(value * 100).toFixed(1)}%
    </span>
  );
}

export function Dot({ color, className }: { color: string; className?: string }) {
  return <span className={cn('inline-block size-2 shrink-0 rounded-full', className)} style={{ background: color }} />;
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-line', className)} />;
}
