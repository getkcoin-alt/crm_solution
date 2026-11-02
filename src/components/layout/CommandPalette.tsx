import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users2, KanbanSquare, Contact2, Building2, Phone, CalendarCheck2, Trophy, BarChart3, Settings, UserPlus, Briefcase, CalendarPlus, PhoneIncoming, Moon, CornerDownLeft, Search, Handshake,
} from 'lucide-react';
import { useCRM } from '@/store/crm';
import { useUI } from '@/store/ui';
import { usePhone } from '@/store/phone';
import { usePrefs, applyTheme } from '@/store/prefs';
import { Avatar, CompanyLogo, Kbd } from '../ui/primitives';
import { cn, money } from '@/lib/utils';

interface Item { id: string; group: string; label: string; sub?: string; icon: ReactNode; run: () => void; hint?: string }

export function CommandPalette() {
  const openState = useUI((s) => s.cmdk);
  const setOpen = useUI((s) => s.setCmdk);
  const openModal = useUI((s) => s.open);
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const { leads, contacts, deals, companies } = useCRM();

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(!useUI.getState().cmdk); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [setOpen]);
  useEffect(() => { if (openState) { setQ(''); setIdx(0); } }, [openState]);

  const items = useMemo<Item[]>(() => {
    const go = (p: string) => () => nav(p);
    const nav_: Item[] = [
      ['Dashboard', '/', LayoutDashboard], ['Leads', '/leads', Users2], ['Pipeline', '/pipeline', KanbanSquare], ['Contacts', '/contacts', Contact2],
      ['Companies', '/companies', Building2], ['Calling workspace', '/calls', Phone], ['Follow-ups & tasks', '/tasks', CalendarCheck2], ['Team performance', '/team', Trophy],
      ['Reports & analytics', '/reports', BarChart3], ['Settings', '/settings', Settings],
    ].map(([l, p, I]) => { const Icon = I as typeof Phone; return { id: `nav${p}`, group: 'Navigate', label: l as string, icon: <Icon />, run: go(p as string) }; });
    const actions: Item[] = [
      { id: 'a1', group: 'Actions', label: 'Create lead', icon: <UserPlus />, run: () => openModal({ kind: 'lead' }) },
      { id: 'a2', group: 'Actions', label: 'Create deal', icon: <Briefcase />, run: () => openModal({ kind: 'deal' }) },
      { id: 'a3', group: 'Actions', label: 'Schedule follow-up', icon: <CalendarPlus />, run: () => openModal({ kind: 'task' }) },
      { id: 'a4', group: 'Actions', label: 'Simulate incoming call', sub: 'Demo: ring the softphone', icon: <PhoneIncoming />, run: () => usePhone.getState().simulateIncoming() },
      { id: 'a5', group: 'Actions', label: 'Toggle dark mode', icon: <Moon />, run: () => { const t = document.documentElement.classList.contains('dark') ? 'light' : 'dark'; usePrefs.getState().setTheme(t); applyTheme(t); } },
    ];
    const term = q.trim().toLowerCase();
    if (!term) return [...actions, ...nav_];
    const m = (s: string) => s.toLowerCase().includes(term);
    const res: Item[] = [
      ...leads.filter((l) => m(`${l.firstName} ${l.lastName} ${l.company} ${l.email}`)).slice(0, 6).map((l) => ({
        id: l.id, group: 'Leads', label: `${l.firstName} ${l.lastName}`, sub: `${l.company} · score ${l.score}`, icon: <Avatar name={`${l.firstName} ${l.lastName}`} hue={(l.company.length * 41) % 360} size={20} />, run: go(`/leads/${l.id}`),
      })),
      ...contacts.filter((c) => m(`${c.firstName} ${c.lastName} ${c.email}`)).slice(0, 4).map((c) => ({
        id: c.id, group: 'Contacts', label: `${c.firstName} ${c.lastName}`, sub: c.title, icon: <Avatar name={`${c.firstName} ${c.lastName}`} hue={200} size={20} />, run: go(`/contacts?id=${c.id}`),
      })),
      ...deals.filter((d) => m(d.name)).slice(0, 4).map((d) => ({ id: d.id, group: 'Deals', label: d.name, sub: `${d.stage} · ${money(d.value, { compact: true })}`, icon: <Handshake />, run: go(`/pipeline?deal=${d.id}`) })),
      ...companies.filter((c) => m(c.name)).slice(0, 4).map((c) => ({ id: c.id, group: 'Companies', label: c.name, sub: `${c.industry} · ${c.city}`, icon: <CompanyLogo name={c.name} hue={c.hue} size={20} />, run: go(`/companies?id=${c.id}`) })),
      ...[...actions, ...nav_].filter((i) => m(i.label)),
    ];
    return res;
  }, [q, leads, contacts, deals, companies, nav, openModal]);

  useEffect(() => { setIdx(0); }, [q]);
  useEffect(() => { listRef.current?.querySelector(`[data-idx="${idx}"]`)?.scrollIntoView({ block: 'nearest' }); }, [idx]);

  if (!openState) return null;
  const run = (i?: Item) => { if (!i) return; setOpen(false); i.run(); };
  let lastGroup = '';

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-start justify-center px-3 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-[rgb(8_9_14/.45)] backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-[620px] animate-pop-in overflow-hidden rounded-2xl bg-surface shadow-float">
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="size-4 text-faint" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
              if (e.key === 'Enter') run(items[idx]);
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder="Search leads, deals, companies or type a command…"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
          />
          <Kbd>ESC</Kbd>
        </div>
        <div ref={listRef} className="max-h-[420px] overflow-y-auto p-2">
          {items.length === 0 && <div className="py-12 text-center text-sm text-muted">No results for “{q}”</div>}
          {items.map((it, i) => {
            const head = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            return (
              <div key={it.id}>
                {head && <div className="eyebrow px-2.5 pb-1.5 pt-2.5">{head}</div>}
                <button
                  data-idx={i}
                  onMouseMove={() => setIdx(i)}
                  onClick={() => run(it)}
                  className={cn('flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors', i === idx ? 'bg-sunken' : '')}
                >
                  <span className={cn('flex size-5 items-center justify-center text-muted [&_svg]:size-4', i === idx && 'text-fg')}>{it.icon}</span>
                  <span className="truncate text-[13.5px] font-medium">{it.label}</span>
                  {it.sub && <span className="truncate text-xs text-faint">{it.sub}</span>}
                  {i === idx && <CornerDownLeft className="ml-auto size-3.5 text-faint" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 border-t bg-surface-2 px-4 py-2 text-[11px] text-faint">
          <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
          <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
          <span className="ml-auto">leadVico Command</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
