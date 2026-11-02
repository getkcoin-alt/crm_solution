import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu as MenuIcon, Plus, Moon, Sun, Search, PhoneCall, UserPlus, Briefcase, CalendarPlus, Contact2, Handshake, PhoneMissed, AtSign, ListTodo, Users2, ChevronRight } from 'lucide-react';
import { useCRM } from '@/store/crm';
import { usePhone } from '@/store/phone';
import { usePrefs, applyTheme } from '@/store/prefs';
import { useUI } from '@/store/ui';
import { Popover, Menu } from '../ui/overlay';
import { ViewAsPill } from './ViewAs';
import { useViewer } from '@/lib/access';
import { Button, IconButton, Kbd } from '../ui/primitives';
import { cn, duration, relTime } from '@/lib/utils';

const titles: Record<string, string> = {
  '': 'Dashboard', leads: 'Leads', pipeline: 'Pipeline', contacts: 'Contacts', companies: 'Companies', calls: 'Calling', whatsapp: 'WhatsApp', tasks: 'Follow-ups', team: 'Team', reports: 'Reports', settings: 'Settings',
};

function useTicker(active: boolean) {
  const [, set] = useState(0);
  useEffect(() => { if (!active) return; const i = setInterval(() => set((x) => x + 1), 1000); return () => clearInterval(i); }, [active]);
}

export function PhonePill() {
  const s = usePhone();
  const live = s.status !== 'idle';
  useTicker(s.status === 'connected');
  if (!live) {
    return (
      <Link to="/calls" className="hidden h-8 items-center gap-2 rounded-md px-2.5 text-xs font-medium text-fg-2 shadow-[inset_0_0_0_1px_rgb(var(--line-strong))] transition hover:bg-sunken md:inline-flex">
        <span className="relative flex size-2"><span className="absolute inset-0 animate-ring rounded-full bg-success" /><span className="relative size-2 rounded-full bg-success" /></span>
        Phone ready
      </Link>
    );
  }
  const label = s.status === 'connected' ? duration((Date.now() - s.connectedAt) / 1000) : s.status === 'dialing' ? 'Calling…' : s.status === 'ringing' ? 'Incoming' : 'Wrap-up';
  return (
    <button onClick={() => s.set({ minimized: false })} className={cn('inline-flex h-8 items-center gap-2 rounded-md px-2.5 text-xs font-semibold text-white shadow-sm transition', s.status === 'wrap-up' ? 'bg-warning' : s.status === 'connected' ? 'bg-success' : 'bg-brand')}>
      <PhoneCall className={cn('size-3.5', s.status !== 'connected' && 'animate-wiggle')} />
      <span className="max-w-[110px] truncate">{s.target?.name}</span>
      <span className="num rounded bg-white/20 px-1">{label}</span>
    </button>
  );
}

export function Topbar() {
  const viewerRole = useViewer().role;
  const loc = useLocation();
  const nav = useNavigate();
  const seg = loc.pathname.split('/')[1] ?? '';
  const sub = loc.pathname.split('/')[2];
  const lead = useCRM((s) => (seg === 'leads' && sub ? s.leads.find((l) => l.id === sub) : undefined));
  const notifs = useCRM((s) => s.notifications);
  const markAllRead = useCRM((s) => s.markAllRead);
  const unread = notifs.filter((n) => !n.read).length;
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const { setCmdk, setMobileNav, open } = useUI();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && document.documentElement.classList.contains('dark'));

  const nIcon = { deal: Handshake, call: PhoneMissed, task: ListTodo, lead: Users2, mention: AtSign };

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
      <IconButton label="Open menu" className="lg:hidden" onClick={() => setMobileNav(true)}><MenuIcon className="size-[18px]" /></IconButton>
      <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <Link to={`/${seg}`} className={cn('truncate font-medium', lead ? 'text-muted hover:text-fg' : 'text-fg')}>{titles[seg] ?? 'leadVico'}</Link>
        {lead && <><ChevronRight className="size-3.5 shrink-0 text-faint" /><span className="truncate font-medium">{lead.firstName} {lead.lastName}</span></>}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button onClick={() => setCmdk(true)} className="hidden h-8 w-56 items-center gap-2 rounded-md bg-surface px-2.5 text-[13px] text-faint shadow-[0_0_0_1px_rgb(var(--line-strong))] transition hover:text-muted xl:flex">
          <Search className="size-3.5" /><span className="flex-1 text-left">Search anything</span><Kbd>⌘K</Kbd>
        </button>
        <IconButton label="Search" className="xl:hidden" onClick={() => setCmdk(true)}><Search className="size-4" /></IconButton>
        <PhonePill />
        <ViewAsPill />
        <Menu
          width={230}
          trigger={({ toggle }) => <Button variant="primary" size="md" icon={<Plus />} onClick={toggle} className="max-sm:!w-8 max-sm:!px-0"><span className="max-sm:hidden">Create</span></Button>}
          items={[
            { heading: 'Create new' },
            { label: 'Lead', icon: <UserPlus />, onClick: () => open({ kind: 'lead' }), hint: 'L' },
            ...(viewerRole !== 'SDR' ? [{ label: 'Deal', icon: <Briefcase />, onClick: () => open({ kind: 'deal' }), hint: 'D' }] : []),
            { label: 'Contact', icon: <Contact2 />, onClick: () => open({ kind: 'contact' }) },
            { label: 'Follow-up task', icon: <CalendarPlus />, onClick: () => open({ kind: 'task' }), hint: 'T' },
            { divider: true, label: '' },
            { label: 'Start a call', icon: <PhoneCall />, onClick: () => nav('/calls'), hint: 'C' },
          ]}
        />
        <Popover
          align="end"
          width={360}
          trigger={({ toggle }) => (
            <IconButton label="Notifications" onClick={toggle} className="relative">
              <Bell className="size-4" />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-bg" />}
            </IconButton>
          )}
        >
          {(close) => (
            <div>
              <div className="flex items-center justify-between px-2.5 pb-2 pt-1.5">
                <span className="text-[13px] font-semibold">Notifications</span>
                <button onClick={markAllRead} className="text-xs font-medium text-brand hover:underline">Mark all read</button>
              </div>
              <div className="max-h-[380px] overflow-y-auto">
                {notifs.map((n) => {
                  const I = nIcon[n.kind];
                  return (
                    <button key={n.id} onClick={() => { if (n.href) nav(n.href); close(); }} className="flex w-full gap-2.5 rounded-md p-2.5 text-left hover:bg-sunken">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sunken text-muted"><I className="size-3.5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-[13px] font-medium">{n.title}{!n.read && <span className="size-1.5 rounded-full bg-brand" />}</span>
                        <span className="block truncate text-xs text-muted">{n.body}</span>
                        <span className="text-[11px] text-faint">{relTime(n.at)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Popover>
        <IconButton label="Toggle theme" onClick={() => { const t = isDark ? 'light' : 'dark'; setTheme(t); applyTheme(t); }}>
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </IconButton>
      </div>
    </header>
  );
}
