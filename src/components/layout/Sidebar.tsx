import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users2, KanbanSquare, Contact2, Building2, Phone, CalendarCheck2, Trophy, BarChart3, Settings, PanelLeftClose, PanelLeft, Sparkles, X,
} from 'lucide-react';
import { useCRM, ME } from '@/store/crm';
import { useScope, useNavAccess, ROLE_TONE, ROLE_SHORT } from '@/lib/access';
import { ViewAsMenu } from './ViewAs';
import { Badge } from '../ui/primitives';
import { usePrefs } from '@/store/prefs';
import { usePhone } from '@/store/phone';
import { useUI } from '@/store/ui';
import { Avatar, Kbd } from '../ui/primitives';
import { Tooltip } from '../ui/overlay';
import { cn, startOfDay, DAY } from '@/lib/utils';

export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex size-7 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#7774ff] to-[#4b47e0] shadow-[inset_0_1px_0_rgb(255_255_255/.3),0_2px_6px_-1px_rgb(88_86_238/.5)]">
        <svg viewBox="0 0 32 32" className="size-[18px]"><path d="M8 9.5l8 13.5 8-13.5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      {!collapsed && (
        <div className="leading-none">
          <div className="text-[14px] font-semibold tracking-[-0.02em]">leadVico</div>
          <div className="mt-0.5 text-[10.5px] font-medium text-faint">Sales CRM</div>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ mobile }: { mobile?: boolean }) {
  const collapsedPref = usePrefs((s) => s.sidebarCollapsed);
  const collapsed = !mobile && collapsedPref;
  const toggle = usePrefs((s) => s.toggleSidebar);
  const setMobileNav = useUI((s) => s.setMobileNav);
  const setCmdk = useUI((s) => s.setCmdk);
  const me = useCRM((s) => s.reps.find((r) => r.id === ME)!);
  const scope = useScope();
  const access = useNavAccess();
  const dueToday = scope.tasks.filter((t) => !t.done && t.ownerId === ME && t.dueAt < startOfDay() + DAY).length;
  const newLeads = scope.leads.filter((l) => l.status === 'New').length;
  const phone = usePhone((s) => s.status);
  const loc = useLocation();

  const groups: { label: string; items: { to: string; label: string; icon: typeof Phone; badge?: number | string; live?: boolean }[] }[] = [
    { label: 'Workspace', items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/leads', label: 'Leads', icon: Users2, badge: newLeads },
      { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
      { to: '/contacts', label: 'Contacts', icon: Contact2 },
      { to: '/companies', label: 'Companies', icon: Building2 },
    ] },
    { label: 'Engage', items: [
      { to: '/calls', label: 'Calling', icon: Phone, live: phone === 'connected' || phone === 'ringing' || phone === 'dialing' },
      { to: '/tasks', label: 'Follow-ups', icon: CalendarCheck2, badge: dueToday },
    ] },
    { label: 'Insights', items: [
      { to: '/team', label: 'Team', icon: Trophy },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ] },
  ];

  const item = (it: (typeof groups)[number]['items'][number]) => {
    const active = it.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(it.to);
    const link = (
      <NavLink
        to={it.to}
        onClick={() => mobile && setMobileNav(false)}
        className={cn(
          'group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors',
          active ? 'bg-surface text-fg shadow-[0_1px_2px_rgb(var(--shadow)/.06),0_0_0_1px_rgb(var(--line-strong))]' : 'text-fg-2 hover:bg-line/60 hover:text-fg',
          collapsed && 'justify-center px-0',
        )}
      >
        <it.icon className={cn('size-[16px] shrink-0', active ? 'text-brand' : 'text-muted group-hover:text-fg-2')} strokeWidth={2} />
        {!collapsed && <span className="flex-1 truncate">{it.label}</span>}
        {!collapsed && it.live && <span className="flex items-center gap-1 rounded bg-danger/10 px-1.5 text-[10px] font-semibold text-danger"><span className="size-1.5 animate-blink rounded-full bg-danger" />LIVE</span>}
        {!collapsed && !it.live && !!it.badge && <span className="num min-w-5 rounded bg-sunken px-1 text-center text-[11px] font-medium text-muted shadow-[inset_0_0_0_1px_rgb(var(--line))]">{it.badge}</span>}
        {collapsed && (it.live || !!it.badge) && <span className={cn('absolute right-1 top-1 size-1.5 rounded-full', it.live ? 'bg-danger' : 'bg-brand')} />}
      </NavLink>
    );
    return collapsed ? <Tooltip key={it.to} content={it.label} side="right">{link}</Tooltip> : <div key={it.to}>{link}</div>;
  };

  return (
    <aside className={cn('flex h-full flex-col bg-bg', mobile ? 'w-[272px]' : collapsed ? 'w-[60px]' : 'w-[236px]', 'transition-[width] duration-200')}>
      <div className={cn('flex h-14 shrink-0 items-center px-4', collapsed && 'justify-center px-0')}>
        <Logo collapsed={collapsed} />
        {mobile && <button onClick={() => setMobileNav(false)} className="ml-auto rounded-md p-1.5 text-muted hover:bg-sunken"><X className="size-4" /></button>}
      </div>

      {!collapsed && (
        <div className="px-3 pb-2">
          <button onClick={() => { setCmdk(true); mobile && setMobileNav(false); }} className="flex h-8 w-full items-center gap-2 rounded-md bg-surface px-2.5 text-[13px] text-faint shadow-[0_0_0_1px_rgb(var(--line-strong))] transition hover:text-muted">
            <svg viewBox="0 0 24 24" className="size-[14px]" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
            <span className="flex-1 text-left">Search or jump to…</span>
            <Kbd>⌘K</Kbd>
          </button>
        </div>
      )}

      <nav className={cn('flex-1 space-y-4 overflow-y-auto px-3 py-2', collapsed && 'px-2')}>
        {groups.filter((g) => g.items.some((it) => access[it.to] !== false)).map((g) => (
          <div key={g.label}>
            {!collapsed && <div className="eyebrow mb-1 px-2">{g.label}</div>}
            <div className="space-y-0.5">{g.items.filter((it) => access[it.to] !== false).map(item)}</div>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="mx-3 mb-3 overflow-hidden rounded-xl bg-gradient-to-br from-brand/[.09] to-transparent p-3 shadow-[inset_0_0_0_1px_rgb(var(--brand)/.18)]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand"><Sparkles className="size-3.5" />Vico AI insight</div>
          <p className="mt-1 text-xs leading-[1.45] text-fg-2">4 hot leads haven’t been called in 48h. Best connect window: <b className="font-semibold text-fg">10–11 AM</b>.</p>
          <NavLink to="/calls" onClick={() => mobile && setMobileNav(false)} className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">Open call queue →</NavLink>
        </div>
      )}

      <div className={cn('border-t p-3', collapsed && 'px-2')}>
        {item({ to: '/settings', label: 'Settings', icon: Settings })}
        <div className={cn('mt-2 flex items-center gap-2.5 rounded-lg p-1.5', collapsed && 'justify-center')}>
          <div className="min-w-0 flex-1">
            <ViewAsMenu trigger={({ toggle }) => (
              <button onClick={toggle} title="Switch panel (View as)" className={cn('flex w-full min-w-0 items-center gap-2.5 rounded-md p-0.5 text-left transition hover:bg-line/60', collapsed && 'justify-center')}>
                <Avatar name={me.name} hue={me.hue} size={28} presence={phone === 'connected' ? 'on-call' : 'online'} />
                {!collapsed && (
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="flex items-center gap-1.5"><span className="truncate text-[13px] font-semibold">{me.name}</span><Badge tone={ROLE_TONE[me.role]} className="!h-4 !px-1 !text-[10px]">{ROLE_SHORT[me.role]}</Badge></div>
                    <div className="truncate text-[11px] text-muted">{me.title}</div>
                  </div>
                )}
              </button>
            )} />
          </div>
          {!mobile && !collapsed && (
            <button onClick={toggle} title="Collapse sidebar" className="rounded-md p-1.5 text-faint hover:bg-sunken hover:text-fg"><PanelLeftClose className="size-4" /></button>
          )}
        </div>
        {!mobile && collapsed && (
          <button onClick={toggle} title="Expand sidebar" className="mx-auto mt-1 flex rounded-md p-1.5 text-faint hover:bg-sunken hover:text-fg"><PanelLeft className="size-4" /></button>
        )}
      </div>
    </aside>
  );
}
