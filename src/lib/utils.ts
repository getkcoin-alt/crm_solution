import { clsx, type ClassValue } from 'clsx';
import { usePrefs } from '@/store/prefs';

export const cn = (...v: ClassValue[]) => clsx(v);

/* ───────────────────────── Money ───────────────────────── */
export const CURRENCIES = {
  USD: { rate: 1, locale: 'en-US', label: 'US Dollar' },
  EUR: { rate: 0.92, locale: 'de-DE', label: 'Euro' },
  GBP: { rate: 0.79, locale: 'en-GB', label: 'British Pound' },
  INR: { rate: 83.2, locale: 'en-IN', label: 'Indian Rupee' },
} as const;
export type Currency = keyof typeof CURRENCIES;

/** Base data is stored in USD; formatting converts to the workspace currency. */
export function money(usd: number, opts: { compact?: boolean; decimals?: number } = {}) {
  const cur = usePrefs.getState().currency;
  const { rate, locale } = CURRENCIES[cur];
  const value = usd * rate;
  const compact = opts.compact ?? false;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: cur,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: opts.decimals ?? (compact ? 1 : 0),
    minimumFractionDigits: 0,
  }).format(value);
}
export const toCurrency = (usd: number) => usd * CURRENCIES[usePrefs.getState().currency].rate;
export const fromCurrency = (v: number) => v / CURRENCIES[usePrefs.getState().currency].rate;

export const num = (v: number, compact = false) =>
  new Intl.NumberFormat('en-US', { notation: compact ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(v);
export const pct = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`;

/* ───────────────────────── Time ───────────────────────── */
export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export function duration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
export function durationWords(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  if (h) return `${h}h ${m % 60}m`;
  return `${m}m ${sec % 60 ? `${sec % 60}s` : ''}`.trim();
}

export function relTime(ts: number, now = Date.now()) {
  const d = ts - now;
  const a = Math.abs(d);
  const fut = d > 0;
  const w = (n: number, u: string) => (fut ? `in ${n}${u}` : `${n}${u} ago`);
  if (a < MIN) return fut ? 'in a moment' : 'just now';
  if (a < HOUR) return w(Math.round(a / MIN), 'm');
  if (a < DAY) return w(Math.round(a / HOUR), 'h');
  if (a < 7 * DAY) return w(Math.round(a / DAY), 'd');
  return fmtDate(ts);
}
export const fmtDate = (ts: number, o: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  new Intl.DateTimeFormat('en-US', o).format(ts);
export const fmtTime = (ts: number) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(ts);
export const fmtDateTime = (ts: number) => `${fmtDate(ts)} · ${fmtTime(ts)}`;
export const startOfDay = (ts = Date.now()) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const isSameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);
export function dayLabel(ts: number) {
  const today = startOfDay();
  const d = startOfDay(ts);
  if (d === today) return 'Today';
  if (d === today - DAY) return 'Yesterday';
  if (d === today + DAY) return 'Tomorrow';
  return fmtDate(ts, { weekday: 'short', month: 'short', day: 'numeric' });
}

/* ───────────────────────── Misc ───────────────────────── */
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');
export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const sum = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((s, x) => s + f(x), 0);
export function groupBy<T, K extends string>(arr: T[], f: (x: T) => K) {
  return arr.reduce((acc, x) => { (acc[f(x)] ||= []).push(x); return acc; }, {} as Record<K, T[]>);
}

/** Deterministic PRNG so the demo data is identical on every load. */
export function rng(seed = 7) {
  let s = seed >>> 0;
  const next = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return {
    next,
    int: (a: number, b: number) => Math.floor(next() * (b - a + 1)) + a,
    pick: <T,>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)]!,
    weighted: <T,>(items: readonly (readonly [T, number])[]) => {
      const total = items.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [v, w] of items) { if ((r -= w) <= 0) return v; }
      return items[items.length - 1]![0];
    },
    bool: (p = 0.5) => next() < p,
    shuffle: <T,>(arr: T[]) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; } return a; },
  };
}

export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]!);
  const esc = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function formatPhone(p: string) { return p; }
