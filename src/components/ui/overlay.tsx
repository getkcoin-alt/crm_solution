import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ───────────────────────── Popover ───────────────────────── */
export function Popover({
  trigger, children, align = 'start', width, className, open: controlled, onOpenChange, side = 'bottom',
}: {
  trigger: (p: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: 'start' | 'end' | 'center';
  side?: 'bottom' | 'top';
  width?: number;
  className?: string;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [inner, setInner] = useState(false);
  const open = controlled ?? inner;
  const setOpen = useCallback((v: boolean) => { setInner(v); onOpenChange?.(v); }, [onOpenChange]);
  const anchor = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null);

  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const place = () => {
      const a = anchor.current?.getBoundingClientRect();
      const p = panel.current;
      if (!a || !p) return;
      const pw = p.offsetWidth, ph = p.offsetHeight;
      let left = align === 'end' ? a.right - pw : align === 'center' ? a.left + a.width / 2 - pw / 2 : a.left;
      left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
      const up = side === 'top' || (a.bottom + ph + 8 > window.innerHeight && a.top - ph - 8 > 0);
      setPos({ left, top: up ? a.top - ph - 6 : a.bottom + 6, up });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, align, side]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchor.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, setOpen]);

  const close = () => setOpen(false);
  return (
    <>
      <span ref={anchor} className="inline-flex">{trigger({ open, toggle: () => setOpen(!open) })}</span>
      {open && createPortal(
        <div
          ref={panel}
          className={cn('fixed z-[80] rounded-lg bg-surface p-1 shadow-pop', pos ? 'animate-pop-in' : 'opacity-0', className)}
          style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width, transformOrigin: pos?.up ? 'bottom' : 'top' }}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>,
        document.body,
      )}
    </>
  );
}

/* ───────────────────────── Menu ───────────────────────── */
export interface MenuItem { label?: string; icon?: ReactNode; onClick?: () => void; danger?: boolean; checked?: boolean; hint?: ReactNode; divider?: boolean; heading?: string }
export function Menu({ trigger, items, align = 'end', width = 220 }: { trigger: (p: { open: boolean; toggle: () => void }) => ReactNode; items: MenuItem[]; align?: 'start' | 'end'; width?: number }) {
  return (
    <Popover trigger={trigger} align={align} width={width}>
      {(close) => (
        <div className="flex flex-col">
          {items.map((it, i) =>
            it.divider ? <div key={i} className="mx-1 my-1 h-px bg-line" /> :
            it.heading ? <div key={i} className="eyebrow px-2 pb-1 pt-1.5">{it.heading}</div> : (
              <button
                key={i}
                onClick={() => { it.onClick?.(); close(); }}
                className={cn('flex h-8 items-center gap-2 rounded-md px-2 text-left text-sm transition-colors hover:bg-sunken [&_svg]:size-4 [&_svg]:shrink-0', it.danger ? 'text-danger' : 'text-fg-2 hover:text-fg')}
              >
                {it.icon && <span className={cn(!it.danger && 'text-muted')}>{it.icon}</span>}
                <span className="flex-1 truncate">{it.label}</span>
                {it.hint && <span className="text-xs text-faint">{it.hint}</span>}
                {it.checked && <Check className="text-brand" />}
              </button>
            ),
          )}
        </div>
      )}
    </Popover>
  );
}

/* ───────────────────────── Modal ───────────────────────── */
function useLockBody(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
}
export function Modal({ open, onClose, title, description, children, footer, width = 520, icon }: {
  open: boolean; onClose: () => void; title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode; width?: number; icon?: ReactNode;
}) {
  useLockBody(open);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-[rgb(8_9_14/.42)] backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full animate-pop-in flex-col overflow-hidden rounded-t-2xl bg-surface shadow-float sm:rounded-2xl" style={{ maxWidth: width }}>
        <div className="flex items-start gap-3 px-5 pb-3 pt-5">
          {icon && <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand [&_svg]:size-[18px]">{icon}</div>}
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold tracking-[-0.01em]">{title}</div>
            {description && <div className="mt-0.5 text-xs text-muted">{description}</div>}
          </div>
          <button onClick={onClose} className="-mr-1 -mt-1 rounded-md p-1.5 text-faint transition hover:bg-sunken hover:text-fg"><X className="size-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t bg-surface-2 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ───────────────────────── Drawer ───────────────────────── */
export function Drawer({ open, onClose, children, width = 520 }: { open: boolean; onClose: () => void; children: ReactNode; width?: number }) {
  useLockBody(open);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[65]">
      <div className="absolute inset-0 animate-fade-in bg-[rgb(8_9_14/.32)]" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full animate-slide-in-right flex-col bg-surface shadow-float sm:inset-y-2 sm:right-2 sm:rounded-xl" style={{ maxWidth: width }}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ───────────────────────── Tooltip ───────────────────────── */
export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'right' | 'bottom' }) {
  const [show, setShow] = useState<DOMRect | null>(null);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <span
      className="inline-flex"
      onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); t.current = setTimeout(() => setShow(r), 350); }}
      onMouseLeave={() => { clearTimeout(t.current); setShow(null); }}
    >
      {children}
      {show && createPortal(
        <div
          className="pointer-events-none fixed z-[90] animate-fade-in whitespace-nowrap rounded-md bg-[#17181d] px-2 py-1 text-xs font-medium text-white shadow-pop dark:bg-[#2a2b33]"
          style={
            side === 'right' ? { left: show.right + 8, top: show.top + show.height / 2, transform: 'translateY(-50%)' }
            : side === 'bottom' ? { left: show.left + show.width / 2, top: show.bottom + 6, transform: 'translateX(-50%)' }
            : { left: show.left + show.width / 2, top: show.top - 6, transform: 'translate(-50%,-100%)' }
          }
        >
          {content}
        </div>,
        document.body,
      )}
    </span>
  );
}
