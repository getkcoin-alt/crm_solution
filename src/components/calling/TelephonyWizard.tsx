import { useEffect, useRef, useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, Copy, ShieldCheck, Smartphone, Monitor, PhoneForwarded, Loader2, CircleCheck, Plug, ArrowLeft, ExternalLink, Sparkles, PhoneCall, Lock } from 'lucide-react';
import { Modal } from '../ui/overlay';
import { Badge, Button } from '../ui/primitives';
import { Field, Input } from '../ui/form';
import { PROVIDERS, MODE_META, providerById, type CallMode, type Provider, type ProviderId } from '@/data/providers';
import { useTelephony } from '@/store/telephony';
import { usePhone } from '@/store/phone';
import { toast } from '@/store/ui';
import { cn } from '@/lib/utils';

const STEPS = ['Provider', 'Credentials', 'Verify', 'Numbers', 'Your phone', 'Done'] as const;

export function ProviderMark({ p, size = 36 }: { p: Pick<Provider, 'name' | 'hue'>; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-[28%] font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(150deg, hsl(${p.hue} 72% 56%), hsl(${p.hue} 70% 40%))`, boxShadow: 'inset 0 1px 0 rgb(255 255 255 / .25)' }}>
      {p.name[0]}
    </span>
  );
}

const modeIcon: Record<CallMode, typeof Monitor> = { bridge: PhoneForwarded, browser: Monitor, sim: Smartphone };

function ProviderGrid({ onPick }: { onPick: (id: ProviderId) => void }) {
  return (
    <div className="space-y-5">
      {(['India', 'Global'] as const).map((r) => (
        <div key={r}>
          <div className="eyebrow mb-2">{r === 'India' ? 'Built for India' : 'International'}</div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {PROVIDERS.filter((p) => p.region === r).map((p) => (
              <button key={p.id} onClick={() => onPick(p.id)} className="group flex items-start gap-3 rounded-xl p-3 text-left shadow-[0_0_0_1px_rgb(var(--line-strong))] transition hover:bg-surface-2 hover:shadow-[0_0_0_1.5px_rgb(var(--brand))]">
                <ProviderMark p={p} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[13.5px] font-semibold">{p.name}</div>
                  <div className="text-xs text-muted">{p.tagline}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1">{p.modes.map((m) => <Badge key={m}>{MODE_META[m].hint}</Badge>)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-lg bg-sunken px-3 py-2.5 text-xs text-muted"><Lock className="size-3.5 shrink-0" />Credentials are encrypted at rest and only used to place calls on your behalf. You can disconnect at any time.</div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="mb-5 flex items-center gap-1.5">
      {STEPS.map((s, i) => (
        <div key={s} className="flex flex-1 flex-col gap-1.5">
          <div className={cn('h-1 rounded-full transition-colors duration-300', i <= step ? 'bg-brand' : 'bg-line')} />
          <span className={cn('hidden text-[10.5px] font-medium sm:block', i === step ? 'text-fg' : i < step ? 'text-muted' : 'text-faint')}>{s}</span>
        </div>
      ))}
    </div>
  );
}

export function TelephonyWizard() {
  const t = useTelephony();
  const [step, setStep] = useState(0);
  const [pid, setPid] = useState<ProviderId | null>(null);
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [def, setDef] = useState<string | null>(null);
  const [mode, setMode] = useState<CallMode>('bridge');
  const [mobile, setMobile] = useState(t.myMobile ?? '');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(t.mobileVerified && !!t.myMobile);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  const p = providerById(pid);

  // Reset on open; jump straight to credentials when a provider was pre-selected.
  useEffect(() => {
    if (!t.wizard) return;
    const pre = t.wizardProvider;
    setPid(pre); setStep(pre ? 1 : 0); setCreds({}); setErrors({}); setChecks(0); setOtpSent(false); setOtp('');
    const st = useTelephony.getState(); setMobile(st.myMobile ?? ''); setVerified(st.mobileVerified && !!st.myMobile);
  }, [t.wizard, t.wizardProvider]);

  useEffect(() => {
    if (!p) return;
    setPicked(p.numbers.map((n) => n.number)); setDef(p.numbers[0]!.number); setMode(p.modes[0]!);
  }, [p]);

  useEffect(() => () => clearInterval(timer.current), []);

  if (!t.wizard) return null;
  const close = () => { clearInterval(timer.current); t.closeWizard(); };
  const webhook = p ? `https://api.leadvico.com/v1/telephony/${p.id}/events/ws_7f3k2m` : '';

  const validate = () => {
    if (!p) return false;
    const e: Record<string, string> = {};
    p.fields.forEach((f) => {
      const v = (creds[f.key] ?? '').trim();
      if (!v) e[f.key] = 'Required';
      else if (f.pattern && !f.pattern.test(v)) e[f.key] = `That doesn’t look like a valid ${f.label}`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const runChecks = () => {
    setStep(2); setChecks(0);
    clearInterval(timer.current);
    timer.current = setInterval(() => setChecks((c) => { if (c >= 4) { clearInterval(timer.current); return c; } return c + 1; }), 650);
  };
  const needsMobile = mode !== 'browser';
  const finish = () => {
    if (!p || !def) return;
    t.connect({ provider: p.id, accountLabel: creds[p.fields[0]!.key] ?? p.name, numbers: p.numbers.filter((n) => picked.includes(n.number)), defaultNumber: def, mode, myMobile: needsMobile ? mobile : t.myMobile });
    toast({ tone: 'success', title: `${p.name} connected`, body: `${picked.length} numbers imported · ${MODE_META[mode].title.toLowerCase()}` });
  };

  const footer = (() => {
    const back = step > (t.wizardProvider ? 1 : 0) && step < 5 && step !== 2 ? <Button variant="ghost" icon={<ArrowLeft />} onClick={() => setStep(step - 1)} className="mr-auto">Back</Button> : null;
    if (step === 0) return <Button variant="ghost" onClick={close}>Cancel</Button>;
    if (step === 1) return <>{back}<Button variant="ghost" onClick={close}>Cancel</Button><Button variant="primary" icon={<Plug />} onClick={() => validate() && runChecks()}>Connect {p?.name}</Button></>;
    if (step === 2) return <Button variant="primary" disabled={checks < 4} onClick={() => setStep(3)}>Continue</Button>;
    if (step === 3) return <>{back}<Button variant="primary" disabled={!picked.length || !def} onClick={() => setStep(4)}>Continue</Button></>;
    if (step === 4) return <>{back}<Button variant="primary" disabled={needsMobile && !verified} onClick={() => { finish(); setStep(5); }}>Finish setup</Button></>;
    return <>
      <Button icon={<PhoneCall />} onClick={() => { close(); usePhone.getState().dial({ name: 'Test call', subtitle: `Via ${p?.name} · ${def}`, phone: needsMobile ? mobile : def ?? '', hue: p?.hue }); }}>Make a test call</Button>
      <Button variant="primary" onClick={close}>Done</Button>
    </>;
  })();

  return (
    <Modal
      open
      onClose={close}
      width={640}
      icon={p ? undefined : <Plug />}
      title={p ? <span className="flex items-center gap-2.5"><ProviderMark p={p} size={26} />Connect {p.name}</span> : 'Connect a telephony provider'}
      description={p ? p.bestFor : 'Bring your own numbers and carrier. Calls, recordings and logs flow into leadVico automatically.'}
      footer={footer}
    >
      <Stepper step={step} />

      {step === 0 && <ProviderGrid onPick={(id) => { setPid(id); setStep(1); }} />}

      {step === 1 && p && (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl bg-brand/[.06] p-3 text-[12.5px] text-fg-2 ring-1 ring-inset ring-brand/15">
            <KeyRound className="mt-0.5 size-4 shrink-0 text-brand" />
            <div>
              <div className="font-semibold text-fg">Where to find these</div>
              <div>{p.consolePath}</div>
            </div>
            <button onClick={() => toast({ title: `Opening ${p.name} console…`, body: 'Opens in a new tab in production.' })} className="ml-auto flex shrink-0 items-center gap-1 text-xs font-semibold text-brand hover:underline">Open console<ExternalLink className="size-3" /></button>
          </div>
          {p.fields.map((f) => (
            <Field key={f.key} label={f.label} hint={errors[f.key] ? undefined : f.help}>
              <div className="relative">
                <Input
                  type={f.secret && !show[f.key] ? 'password' : 'text'}
                  value={creds[f.key] ?? ''}
                  onChange={(e) => { setCreds({ ...creds, [f.key]: e.target.value }); setErrors({ ...errors, [f.key]: '' }); }}
                  placeholder={f.placeholder}
                  className={cn('font-mono text-[12.5px]', f.secret && 'pr-9', errors[f.key] && '!shadow-[inset_0_0_0_1px_rgb(var(--danger))]')}
                  autoComplete="off"
                  spellCheck={false}
                />
                {f.secret && <button type="button" onClick={() => setShow({ ...show, [f.key]: !show[f.key] })} className="absolute right-2 top-1/2 -translate-y-1/2 text-faint hover:text-fg">{show[f.key] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>}
              </div>
              {errors[f.key] && <span className="mt-1 block text-2xs font-medium text-danger">{errors[f.key]}</span>}
            </Field>
          ))}
          <button onClick={() => { setCreds(Object.fromEntries(p.fields.map((f) => [f.key, f.sample]))); setErrors({}); }} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"><Sparkles className="size-3.5" />Fill sample credentials (demo)</button>
        </div>
      )}

      {step === 2 && p && (
        <div className="space-y-2 py-2">
          {['Authenticating account', 'Fetching phone numbers', 'Registering call event webhooks', 'Checking recording & compliance settings'].map((label, i) => {
            const done = checks > i, active = checks === i;
            return (
              <div key={label} className={cn('flex items-center gap-3 rounded-xl px-3 py-3 transition', done ? 'bg-success/[.06]' : 'bg-sunken')}>
                {done ? <CircleCheck className="size-5 text-success" /> : active ? <Loader2 className="size-5 animate-spin text-brand" /> : <span className="size-5 rounded-full border-2 border-line-strong" />}
                <span className={cn('text-[13px] font-medium', !done && !active && 'text-faint')}>{label}</span>
                {done && i === 1 && <Badge tone="success" className="ml-auto">{p.numbers.length} found</Badge>}
              </div>
            );
          })}
          {checks >= 4 && <div className="flex animate-fade-in items-center gap-2 pt-2 text-[13px] font-medium text-success"><ShieldCheck className="size-4" />Connected to {p.name} account “{creds[p.fields[0]!.key]}”</div>}
        </div>
      )}

      {step === 3 && p && (
        <div className="space-y-4">
          <div>
            <div className="label">Numbers to use in leadVico</div>
            <div className="space-y-1.5">
              {p.numbers.map((n) => {
                const on = picked.includes(n.number);
                return (
                  <div key={n.number} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 transition', on ? 'shadow-[0_0_0_1px_rgb(var(--brand)/.45)]' : 'shadow-[0_0_0_1px_rgb(var(--line-strong))]')}>
                    <input type="checkbox" checked={on} onChange={() => { const next = on ? picked.filter((x) => x !== n.number) : [...picked, n.number]; setPicked(next); if (on && def === n.number) setDef(next[0] ?? null); }} className="size-4 accent-[rgb(var(--brand))]" />
                    <div className="min-w-0 flex-1"><div className="num text-[13px] font-semibold">{n.number}</div><div className="text-xs text-muted">{n.label} · {n.region}</div></div>
                    <Badge>{n.kind}</Badge>
                    <button disabled={!on} onClick={() => setDef(n.number)} className={cn('h-6 rounded-md px-2 text-[11px] font-semibold transition disabled:opacity-30', def === n.number ? 'bg-brand text-white' : 'text-muted hover:bg-sunken')}>{def === n.number ? 'Default caller ID' : 'Set default'}</button>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div className="label">Call events webhook</div>
            <div className="flex items-center gap-2 rounded-lg bg-sunken px-3 py-2 font-mono text-[11.5px] text-fg-2 ring-1 ring-inset ring-line">
              <span className="min-w-0 flex-1 truncate">{webhook}</span>
              <button onClick={() => { navigator.clipboard?.writeText(webhook).catch(() => {}); toast({ title: 'Webhook URL copied' }); }} className="text-faint hover:text-fg"><Copy className="size-3.5" /></button>
            </div>
            <div className="mt-1 text-2xs text-faint">{p.id === 'knowlarity' || p.id === 'myoperator' ? `Paste this into ${p.name} → Webhooks so call status and recordings reach leadVico.` : `Registered automatically on your ${p.name} account — nothing to paste.`}</div>
          </div>
        </div>
      )}

      {step === 4 && p && (
        <div className="space-y-4">
          <div>
            <div className="label">How should your calls connect?</div>
            <div className="grid grid-cols-1 gap-2">
              {(['bridge', 'browser', 'sim'] as CallMode[]).map((m) => {
                const I = modeIcon[m];
                const ok = p.modes.includes(m);
                return (
                  <button key={m} disabled={!ok} onClick={() => setMode(m)} className={cn('flex items-start gap-3 rounded-xl p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40', mode === m ? 'bg-brand/[.05] shadow-[0_0_0_1.5px_rgb(var(--brand))]' : 'shadow-[0_0_0_1px_rgb(var(--line-strong))] hover:bg-surface-2')}>
                    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', mode === m ? 'bg-brand text-white' : 'bg-sunken text-muted')}><I className="size-4" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[13px] font-semibold">{MODE_META[m].title}{!ok && <span className="text-[11px] font-normal text-faint">Not available on {p.name}</span>}</div>
                      <div className="text-xs text-muted">{MODE_META[m].desc}</div>
                    </div>
                    {mode === m && <Check className="mt-1 size-4 text-brand" />}
                  </button>
                );
              })}
            </div>
          </div>
          {needsMobile && (
            <div className="rounded-xl p-3.5 shadow-[0_0_0_1px_rgb(var(--line-strong))]">
              <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold"><Smartphone className="size-4 text-muted" />Your mobile number</div>
              {verified ? (
                <div className="flex items-center gap-2 text-[13px]"><CircleCheck className="size-4 text-success" /><span className="num font-medium">{mobile}</span><Badge tone="success">Verified</Badge><button onClick={() => { setVerified(false); setOtpSent(false); setOtp(''); }} className="ml-auto text-xs font-medium text-muted hover:text-fg">Change</button></div>
              ) : !otpSent ? (
                <div className="flex gap-2">
                  <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 98765 43210" className="num flex-1" />
                  <Button variant="primary" disabled={mobile.replace(/\D/g, '').length < 10} onClick={() => { setOtpSent(true); toast({ title: 'Verification code sent', body: `SMS sent to ${mobile} · demo code 123456` }); }}>Send code</Button>
                </div>
              ) : (
                <div>
                  <div className="mb-2 text-xs text-muted">Enter the 6-digit code sent to <span className="num font-medium text-fg">{mobile}</span></div>
                  <div className="flex gap-2">
                    <Input autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" className="num w-36 text-center text-[15px] tracking-[0.4em]" />
                    <Button variant="primary" disabled={otp.length !== 6} onClick={() => { setVerified(true); toast({ tone: 'success', title: 'Mobile verified' }); }}>Verify</Button>
                    <Button variant="ghost" onClick={() => toast({ title: 'Code resent', body: 'Demo code 123456' })}>Resend</Button>
                  </div>
                </div>
              )}
              <div className="mt-2 text-2xs text-faint">{mode === 'bridge' ? 'leadVico rings this number first, then connects the customer. Customers see your caller ID, not your mobile.' : 'Install the leadVico Android app and sign in — calls from this SIM sync automatically.'}</div>
            </div>
          )}
        </div>
      )}

      {step === 5 && p && (
        <div className="py-2 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success"><CircleCheck className="size-7" /></div>
          <div className="mt-3 text-[15px] font-semibold">You’re ready to call</div>
          <div className="mx-auto mt-1 max-w-sm text-xs text-muted">Every Call button in leadVico now places real calls through {p.name}. Recordings, durations and Vico AI summaries land on the right timeline.</div>
          <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-xl bg-line text-left shadow-[0_0_0_1px_rgb(var(--line))]">
            {[['Provider', p.name], ['Caller ID', def ?? '—'], ['Mode', MODE_META[mode].hint]].map(([k, v]) => (
              <div key={k} className="bg-surface px-3 py-2.5"><div className="text-[10.5px] text-faint">{k}</div><div className="num mt-0.5 truncate text-[12.5px] font-semibold">{v}</div></div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
