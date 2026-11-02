import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover } from './overlay';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }>(function Input({ icon, className, ...rest }, ref) {
  if (!icon) return <input ref={ref} className={cn('input', className)} {...rest} />;
  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint [&_svg]:size-[15px]">{icon}</span>
      <input ref={ref} className="input pl-8" {...rest} />
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn('input resize-none', className)} {...rest} />;
});

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-2xs text-faint">{hint}</span>}
    </label>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; autoFocus?: boolean }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-faint" />
      <input autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input pl-8 pr-7" />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-faint hover:bg-sunken hover:text-fg"><X className="size-3.5" /></button>
      )}
    </div>
  );
}

/* ───────────────────────── Select ───────────────────────── */
export interface Option<T extends string = string> { value: T; label: string; icon?: ReactNode; hint?: string }
export function Select<T extends string>({ value, onChange, options, placeholder = 'Select…', className, width, size = 'md', align = 'start', renderValue }: {
  value: T | null | undefined; onChange: (v: T) => void; options: Option<T>[]; placeholder?: string; className?: string; width?: number; size?: 'sm' | 'md'; align?: 'start' | 'end'; renderValue?: (o?: Option<T>) => ReactNode;
}) {
  const sel = options.find((o) => o.value === value);
  return (
    <Popover
      align={align}
      width={width}
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          className={cn('input flex items-center gap-2 text-left', size === 'sm' && '!h-7 text-xs', open && '!shadow-[inset_0_0_0_1px_rgb(var(--brand)),0_0_0_3px_rgb(var(--brand)/.15)]', className)}
        >
          {renderValue ? renderValue(sel) : (
            <>
              {sel?.icon && <span className="shrink-0 [&_svg]:size-3.5">{sel.icon}</span>}
              <span className={cn('flex-1 truncate', !sel && 'text-faint')}>{sel?.label ?? placeholder}</span>
            </>
          )}
          <ChevronDown className={cn('size-3.5 shrink-0 text-faint transition-transform', open && 'rotate-180')} />
        </button>
      )}
    >
      {(close) => (
        <div className="max-h-72 min-w-[180px] overflow-y-auto">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); close(); }}
              className={cn('flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-sunken', o.value === value ? 'text-fg' : 'text-fg-2')}
            >
              {o.icon && <span className="shrink-0 [&_svg]:size-3.5">{o.icon}</span>}
              <span className="flex-1 truncate">{o.label}</span>
              {o.hint && <span className="text-xs text-faint">{o.hint}</span>}
              {o.value === value && <Check className="size-3.5 text-brand" />}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

/** Pill-style filter dropdown with multi-select. */
export function FilterChip<T extends string>({ label, options, values, onChange, icon }: { label: string; options: Option<T>[]; values: T[]; onChange: (v: T[]) => void; icon?: ReactNode }) {
  const active = values.length > 0;
  const summary = active ? (values.length === 1 ? options.find((o) => o.value === values[0])?.label : `${values.length} selected`) : null;
  return (
    <Popover
      width={230}
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition [&_svg]:size-3.5',
            active ? 'bg-brand/10 text-brand shadow-[inset_0_0_0_1px_rgb(var(--brand)/.3)]' : 'text-fg-2 shadow-[inset_0_0_0_1px_rgb(var(--line-strong))] hover:bg-sunken',
          )}
        >
          {icon}
          {label}
          {summary && <><span className="opacity-40">·</span><span className="max-w-[110px] truncate">{summary}</span></>}
          {active ? (
            <span role="button" onClick={(e) => { e.stopPropagation(); onChange([]); }} className="-mr-1 rounded p-0.5 hover:bg-brand/15"><X /></span>
          ) : <ChevronDown className="opacity-60" />}
        </button>
      )}
    >
      <div className="max-h-72 overflow-y-auto">
        {options.map((o) => {
          const on = values.includes(o.value);
          return (
            <button
              key={o.value}
              onClick={() => onChange(on ? values.filter((v) => v !== o.value) : [...values, o.value])}
              className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-fg-2 hover:bg-sunken hover:text-fg"
            >
              <Checkbox checked={on} />
              {o.icon && <span className="shrink-0 [&_svg]:size-3.5">{o.icon}</span>}
              <span className="flex-1 truncate">{o.label}</span>
              {o.hint && <span className="num text-xs text-faint">{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </Popover>
  );
}

export function Checkbox({ checked, indeterminate, onChange, className }: { checked: boolean; indeterminate?: boolean; onChange?: (v: boolean) => void; className?: string }) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      tabIndex={onChange ? 0 : -1}
      onClick={(e) => { if (onChange) { e.stopPropagation(); onChange(!checked); } }}
      onKeyDown={(e) => { if (onChange && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); onChange(!checked); } }}
      className={cn(
        'inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] transition',
        checked || indeterminate ? 'bg-brand text-white shadow-[inset_0_0_0_1px_rgb(var(--brand))]' : 'bg-surface shadow-[inset_0_0_0_1px_rgb(var(--line-strong))] hover:shadow-[inset_0_0_0_1px_rgb(var(--faint))]',
        className,
      )}
    >
      {indeterminate ? <span className="h-[2px] w-2 rounded bg-white" /> : checked && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}

export function Switch({ checked, onChange, size = 'md' }: { checked: boolean; onChange: (v: boolean) => void; size?: 'sm' | 'md' }) {
  const w = size === 'sm' ? 'w-7 h-4' : 'w-9 h-5';
  const k = size === 'sm' ? 'size-3' : 'size-4';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-200', w, checked ? 'bg-brand' : 'bg-line-strong')}
    >
      <span className={cn('rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/.25)] transition-transform duration-200', k, checked && (size === 'sm' ? 'translate-x-3' : 'translate-x-4'))} />
    </button>
  );
}

/* ───────────────────────── Segmented / Tabs ───────────────────────── */
export function Segmented<T extends string>({ value, onChange, options, size = 'md', className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; icon?: ReactNode }[]; size?: 'sm' | 'md'; className?: string }) {
  return (
    <div className={cn('inline-flex items-center rounded-lg bg-sunken p-0.5 shadow-[inset_0_0_0_1px_rgb(var(--line))]', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md font-medium transition-all [&_svg]:size-3.5',
            size === 'sm' ? 'h-6 px-2 text-xs' : 'h-7 px-2.5 text-xs',
            value === o.value ? 'bg-surface text-fg shadow-[0_1px_2px_rgb(var(--shadow)/.1),0_0_0_1px_rgb(var(--line-strong))]' : 'text-muted hover:text-fg',
          )}
        >
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs, className }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number; icon?: ReactNode }[]; className?: string }) {
  return (
    <div className={cn('no-scrollbar flex items-center gap-1 overflow-x-auto border-b', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'relative inline-flex h-9 shrink-0 items-center gap-1.5 px-2.5 text-[13px] font-medium transition-colors [&_svg]:size-4',
            value === t.value ? 'text-fg' : 'text-muted hover:text-fg',
          )}
        >
          {t.icon}{t.label}
          {t.count !== undefined && <span className={cn('num rounded px-1 text-[11px]', value === t.value ? 'bg-brand/10 text-brand' : 'bg-sunken text-muted')}>{t.count}</span>}
          {value === t.value && <span className="absolute inset-x-1.5 -bottom-px h-[2px] rounded-full bg-fg" />}
        </button>
      ))}
    </div>
  );
}
