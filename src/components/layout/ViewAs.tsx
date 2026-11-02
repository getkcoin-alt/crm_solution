import type { ReactNode } from 'react';
import { Check, ChevronsUpDown, LogOut, Users, Eye, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';
import { useCRM } from '@/store/crm';
import { PERSONAS, useSession } from '@/store/session';
import { usePhone } from '@/store/phone';
import { toast } from '@/store/ui';
import { useViewer, ROLE_TONE, ROLE_SHORT } from '@/lib/access';
import { Popover } from '../ui/overlay';
import { Avatar, Badge, Button, EmptyState } from '../ui/primitives';
import { cn } from '@/lib/utils';

export function switchPersona(repId: string) {
  const ph = usePhone.getState();
  if (ph.status !== 'idle') { toast({ title: 'Finish the current call first', body: 'You can switch panels once the call is wrapped up.' }); return; }
  const rep = useCRM.getState().reps.find((r) => r.id === repId);
  useSession.getState().switchTo(repId);
  window.location.hash = '#/';
  if (rep) toast({ tone: 'success', title: `Viewing as ${rep.name}`, body: `${rep.role} panel · data and permissions scoped to this role` });
}

export function PersonaList({ onPick, compact }: { onPick: (id: string) => void; compact?: boolean }) {
  const reps = useCRM((s) => s.reps);
  const current = useSession((s) => s.viewAs);
  return (
    <div className="flex flex-col gap-1">
      {PERSONAS.map((p) => {
        const r = reps.find((x) => x.id === p.repId);
        if (!r) return null;
        const on = current === r.id;
        return (
          <button key={r.id} onClick={() => onPick(r.id)} className={cn('flex items-center gap-3 rounded-lg p-2 text-left transition hover:bg-sunken', on && !compact && 'bg-brand/[.06]')}>
            <Avatar name={r.name} hue={r.hue} size={compact ? 30 : 34} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold">{r.name}<Badge tone={ROLE_TONE[r.role]}>{ROLE_SHORT[r.role]}</Badge></div>
              <div className="truncate text-[11.5px] text-muted">{p.blurb}</div>
            </div>
            {on && <Check className="size-4 shrink-0 text-brand" />}
          </button>
        );
      })}
    </div>
  );
}

/** Persona switcher used in the top bar and the sidebar profile card. */
export function ViewAsMenu({ trigger }: { trigger: (p: { open: boolean; toggle: () => void }) => ReactNode }) {
  const signOut = useSession((s) => s.signOut);
  return (
    <Popover align="end" width={340} trigger={trigger}>
      {(close) => (
        <div>
          <div className="flex items-center gap-1.5 px-2 pb-1.5 pt-1.5"><Eye className="size-3.5 text-muted" /><span className="eyebrow">View as</span></div>
          <PersonaList compact onPick={(id) => { close(); switchPersona(id); }} />
          <div className="mx-1 my-1 h-px bg-line" />
          <button onClick={() => { close(); signOut(); }} className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-fg-2 hover:bg-sunken"><Users className="size-4 text-muted" />Switch account</button>
          <button onClick={() => { close(); window.location.href = '/__auth/logout'; }} className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-fg-2 hover:bg-sunken"><LogOut className="size-4 text-muted" />Log out of demo</button>
        </div>
      )}
    </Popover>
  );
}

export function ViewAsPill() {
  const v = useViewer();
  return (
    <ViewAsMenu trigger={({ toggle, open }) => (
      <button onClick={toggle} className={cn('flex h-8 items-center gap-2 rounded-md pl-1 pr-2 text-xs font-medium shadow-[inset_0_0_0_1px_rgb(var(--line-strong))] transition hover:bg-sunken', open && 'bg-sunken')}>
        <Avatar name={v.name} hue={v.hue} size={24} />
        <span className="hidden max-w-[110px] truncate lg:inline">{v.name.split(' ')[0]}</span>
        <Badge tone={ROLE_TONE[v.role]} className="max-sm:hidden">{ROLE_SHORT[v.role]}</Badge>
        <ChevronsUpDown className="size-3.5 text-faint" />
      </button>
    )} />
  );
}

/** Thin banner so the audience always knows which panel they are looking at. */
export function ViewAsBanner() {
  const v = useViewer();
  if (v.role === 'Admin') return null;
  const admin = PERSONAS[0]!.repId;
  return (
    <div className="flex items-center gap-2 border-b bg-brand/[.06] px-4 py-1.5 text-xs sm:px-6">
      <ShieldCheck className="size-3.5 shrink-0 text-brand" />
      <span className="min-w-0 truncate text-fg-2">Viewing as <b className="font-semibold text-fg">{v.name}</b> · {v.role}{v.role === 'Sales Manager' ? ` · ${v.team} team` : ''} — data and permissions are scoped to this role</span>
      <button onClick={() => switchPersona(admin)} className="ml-auto flex shrink-0 items-center gap-1 font-semibold text-brand hover:underline"><ArrowLeft className="size-3" />Back to Admin</button>
    </div>
  );
}

export function NoAccess({ what = 'this area' }: { what?: string }) {
  const v = useViewer();
  return (
    <div className="card mx-auto mt-10 max-w-lg">
      <EmptyState icon={<Lock />} title={`No access to ${what}`} body={`The ${v.role} role can’t open ${what}. An admin can change this in Settings → Roles & permissions.`}
        action={<Button onClick={() => { window.location.hash = '#/'; }}>Go to dashboard</Button>} />
    </div>
  );
}
