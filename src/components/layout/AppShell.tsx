import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { Softphone } from '../calling/Softphone';
import { TelephonyWizard } from '../calling/TelephonyWizard';
import { GlobalModals } from '../modals';
import { Toaster } from '../shared';
import { useUI } from '@/store/ui';
import { usePrefs } from '@/store/prefs';

export function AppShell() {
  const mobileNav = useUI((s) => s.mobileNav);
  const setMobileNav = useUI((s) => s.setMobileNav);
  const currency = usePrefs((s) => s.currency);
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => { document.getElementById('main')?.scrollTo({ top: 0 }); }, [loc.pathname]);

  // Single-key shortcuts (ignored while typing).
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable) return;
      if (useUI.getState().modal || useUI.getState().cmdk) return;
      const open = useUI.getState().open;
      const map: Record<string, () => void> = {
        l: () => open({ kind: 'lead' }), d: () => open({ kind: 'deal' }), t: () => open({ kind: 'task' }), c: () => nav('/calls'),
        '/': () => useUI.getState().setCmdk(true),
      };
      const fn = map[e.key.toLowerCase()];
      if (fn) { e.preventDefault(); fn(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [nav]);

  return (
    <div className="flex h-full">
      <div className="hidden shrink-0 border-r lg:block"><Sidebar /></div>
      {mobileNav && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setMobileNav(false)} />
          <div className="absolute inset-y-0 left-0 animate-slide-in-left border-r shadow-float"><Sidebar mobile /></div>
        </div>
      )}
      <div id="main" className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Topbar />
        <main key={currency} className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <Softphone />
      <TelephonyWizard />
      <CommandPalette />
      <GlobalModals />
      <Toaster />
    </div>
  );
}
