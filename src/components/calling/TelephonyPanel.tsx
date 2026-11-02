import { useState } from 'react';
import { Plug, PhoneForwarded, Monitor, Smartphone, ShieldCheck, ArrowRight, X, Phone, RefreshCw, Unplug, Sparkles } from 'lucide-react';
import { PROVIDERS, MODE_META, type CallMode } from '@/data/providers';
import { useTelephony, useActiveProvider } from '@/store/telephony';
import { toast } from '@/store/ui';
import { Badge, Button } from '../ui/primitives';
import { ProviderMark } from './TelephonyWizard';
import { cn, relTime } from '@/lib/utils';

const modeIcon: Record<CallMode, typeof Monitor> = { bridge: PhoneForwarded, browser: Monitor, sim: Smartphone };

/** Compact status / call-to-action strip for the Calling page and Dashboard. */
export function TelephonyBanner({ dismissible }: { dismissible?: boolean }) {
  const t = useTelephony();
  const p = useActiveProvider();
  const [hidden, setHidden] = useState(false);
  if (p) {
    if (dismissible) return null;
    const I = modeIcon[t.mode];
    return (
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-surface px-4 py-2.5 shadow-card">
        <span className="flex items-center gap-2.5"><ProviderMark p={p} size={26} /><span className="text-[13px] font-semibold">{p.name}</span><Badge tone="success" dot>Live</Badge></span>
        <span className="flex items-center gap-1.5 text-xs text-muted"><I className="size-3.5" />{MODE_META[t.mode].title}{t.mode !== 'browser' && t.myMobile && <span className="num text-fg-2">· {t.myMobile}</span>}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted"><Phone className="size-3.5" />Caller ID <span className="num text-fg-2">{t.defaultNumber}</span></span>
        <button onClick={() => t.openWizard(p.id)} className="ml-auto text-xs font-semibold text-brand hover:underline">Manage</button>
      </div>
    );
  }
  if (hidden) return null;
  return (
    <div className="relative mb-4 overflow-hidden rounded-xl bg-surface p-4 shadow-card">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_0%_0%,rgb(var(--brand)/.10),transparent_60%)]" />
      <div className="relative flex flex-col gap-3 md:flex-row md:items-center">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-[0_6px_16px_-6px_rgb(var(--brand)/.7)]"><Plug className="size-[18px]" /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold">Connect your phone system in 2 minutes</div>
          <div className="text-xs text-muted">Calls are in demo mode. Plug in Exotel, Knowlarity, MyOperator, Plivo, Twilio or Vonage to call customers from leadVico.</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden -space-x-1.5 sm:flex">{PROVIDERS.map((x) => <span key={x.id} className="rounded-[30%] ring-2 ring-surface"><ProviderMark p={x} size={24} /></span>)}</div>
          <Button variant="primary" iconRight={<ArrowRight />} onClick={() => t.openWizard()}>Connect provider</Button>
          {dismissible && <button onClick={() => setHidden(true)} className="rounded p-1 text-faint hover:bg-sunken hover:text-fg"><X className="size-4" /></button>}
        </div>
      </div>
    </div>
  );
}

/** Full telephony configuration for Settings → Calling. */
export function TelephonySettings() {
  const t = useTelephony();
  const p = useActiveProvider();
  return (
    <div className="space-y-4">
      <div className="card animate-fade-in">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div><div className="text-[14px] font-semibold">Telephony provider</div><div className="mt-0.5 text-xs text-muted">The carrier that places calls, provides numbers and stores recordings.</div></div>
          {p && <div className="flex gap-1.5"><Button size="sm" icon={<RefreshCw />} onClick={() => t.openWizard(p.id)}>Reconfigure</Button><Button size="sm" variant="ghost" className="!text-danger" icon={<Unplug />} onClick={() => { t.disconnect(); toast({ title: `${p.name} disconnected`, body: 'Calls are back in demo mode.' }); }}>Disconnect</Button></div>}
        </div>
        <div className="p-5">
          {p ? (
            <div className="flex flex-wrap items-center gap-4">
              <ProviderMark p={p} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[14px] font-semibold">{p.name}<Badge tone="success" dot>Connected</Badge></div>
                <div className="text-xs text-muted">Account “{t.accountLabel}” · connected {relTime(t.connectedAt)} · webhooks healthy</div>
                <div className="mt-2 flex flex-wrap gap-1">{p.features.map((f) => <Badge key={f}>{f}</Badge>)}</div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs text-muted"><ShieldCheck className="size-3.5" />No provider connected — calls are simulated. Pick one to start the guided setup.</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PROVIDERS.map((x) => (
                  <button key={x.id} onClick={() => t.openWizard(x.id)} className="flex items-center gap-2.5 rounded-xl p-2.5 text-left shadow-[0_0_0_1px_rgb(var(--line-strong))] transition hover:bg-surface-2 hover:shadow-[0_0_0_1.5px_rgb(var(--brand))]">
                    <ProviderMark p={x} size={30} />
                    <div className="min-w-0"><div className="text-[13px] font-semibold">{x.name}</div><div className="text-[11px] text-muted">{x.region === 'India' ? 'India' : 'Global'}</div></div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {p && (
        <div className="card animate-fade-in">
          <div className="border-b px-5 py-4"><div className="text-[14px] font-semibold">My calling setup</div><div className="mt-0.5 text-xs text-muted">How calls connect for you. Each teammate chooses their own.</div></div>
          <div className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-3">
            {(['bridge', 'browser', 'sim'] as CallMode[]).map((m) => {
              const I = modeIcon[m];
              const ok = p.modes.includes(m);
              return (
                <button key={m} disabled={!ok} onClick={() => { if (m !== 'browser' && !t.myMobile) { t.openWizard(p.id); return; } t.set({ mode: m }); toast({ title: `Calling mode: ${MODE_META[m].title}` }); }}
                  className={cn('rounded-xl p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40', t.mode === m ? 'bg-brand/[.05] shadow-[0_0_0_1.5px_rgb(var(--brand))]' : 'shadow-[0_0_0_1px_rgb(var(--line-strong))] hover:bg-surface-2')}>
                  <I className={cn('size-4', t.mode === m ? 'text-brand' : 'text-muted')} />
                  <div className="mt-2 text-[13px] font-semibold">{MODE_META[m].title}</div>
                  <div className="mt-0.5 text-[11.5px] leading-[1.4] text-muted">{MODE_META[m].desc}</div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 border-t px-5 py-3.5 text-[13px]">
            <Smartphone className="size-4 text-muted" />
            <span className="text-muted">My mobile</span>
            {t.myMobile ? <><span className="num font-medium">{t.myMobile}</span><Badge tone="success">Verified</Badge></> : <span className="text-faint">Not added</span>}
            <button onClick={() => t.openWizard(p.id)} className="ml-auto text-xs font-semibold text-brand hover:underline">{t.myMobile ? 'Change' : 'Add & verify'}</button>
          </div>
        </div>
      )}

      <div className="card animate-fade-in">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div><div className="text-[14px] font-semibold">Phone numbers</div><div className="mt-0.5 text-xs text-muted">{p ? `Imported from ${p.name}. Used as caller ID.` : 'Numbers are imported from your provider.'}</div></div>
        </div>
        <div className="p-5">
          {t.numbers.length ? t.numbers.map((n) => (
            <div key={n.number} className="flex items-center gap-4 border-b py-3 first:pt-0 last:border-0 last:pb-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sunken text-muted"><Phone className="size-4" /></span>
              <div className="min-w-0 flex-1"><div className="num text-[13px] font-medium">{n.number}</div><div className="text-xs text-muted">{n.label} · {n.region} · {n.kind}</div></div>
              {t.defaultNumber === n.number ? <Badge tone="brand">Default</Badge> : <Button size="xs" variant="ghost" onClick={() => { t.set({ defaultNumber: n.number }); toast({ title: `${n.number} is now the default caller ID` }); }}>Make default</Button>}
            </div>
          )) : (
            <div className="flex items-center gap-3 text-xs text-muted"><Sparkles className="size-4 text-brand" />Connect a provider and your numbers appear here automatically.</div>
          )}
        </div>
      </div>
    </div>
  );
}
