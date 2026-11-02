import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CircleCheck, Copy, ExternalLink, KeyRound, Loader2, QrCode, ShieldCheck, Smartphone, Sparkles, Check, Users, Zap } from 'lucide-react';
import { Modal } from '../ui/overlay';
import { Badge, Button } from '../ui/primitives';
import { Field, Input, Switch } from '../ui/form';
import { useWhatsApp, DEMO_NUMBERS, SCRIWO_API, SCRIWO_EVENTS } from '@/store/whatsapp';
import { toast } from '@/store/ui';
import { cn } from '@/lib/utils';
import { WaIcon } from './Chat';

const STEPS = ['Scriwo', 'API key', 'Verify', 'Numbers', 'Automation', 'Done'] as const;
const KEY_RE = /^wpp_[A-Za-z0-9_-]{20,}$/;
const WEBHOOK = 'https://api.leadvico.com/v1/whatsapp/scriwo/events/ws_7f3k2m';

export function ScriwoMark({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-[28%] font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.46, background: 'linear-gradient(150deg,#2bd47a,#0f9d58)', boxShadow: 'inset 0 1px 0 rgb(255 255 255 / .25)' }}>S</span>
  );
}

export function WhatsAppWizard() {
  const wa = useWhatsApp();
  const [step, setStep] = useState(0);
  const [key, setKey] = useState('');
  const [err, setErr] = useState('');
  const [checks, setChecks] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => { if (wa.wizard) { setStep(0); setKey(''); setErr(''); setChecks(0); } }, [wa.wizard]);
  useEffect(() => () => clearInterval(timer.current), []);
  if (!wa.wizard) return null;
  const close = () => { clearInterval(timer.current); wa.set({ wizard: false }); };
  const verify = () => {
    if (!KEY_RE.test(key.trim())) { setErr('Scriwo API keys start with “wpp_” — copy it from Scriwo → Developers → API keys.'); return; }
    setStep(2); setChecks(0);
    clearInterval(timer.current);
    timer.current = setInterval(() => setChecks((c) => { if (c >= 4) { clearInterval(timer.current); return c; } return c + 1; }), 650);
  };
  const finish = () => {
    wa.connect({ workspace: 'leadVico Sales', keyPrefix: `${key.trim().slice(0, 8)}…${key.trim().slice(-4)}`, numbers: DEMO_NUMBERS });
    setStep(5);
    toast({ tone: 'success', title: 'WhatsApp connected via Scriwo', body: `${DEMO_NUMBERS.length} numbers linked · chats now sync to leadVico` });
  };
  const back = step > 0 && step < 5 && step !== 2 ? <Button variant="ghost" icon={<ArrowLeft />} className="mr-auto" onClick={() => setStep(step - 1)}>Back</Button> : null;

  const footer = [
    <><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="primary" onClick={() => setStep(1)}>I have a Scriwo workspace</Button></>,
    <>{back}<Button variant="ghost" onClick={close}>Cancel</Button><Button variant="primary" icon={<KeyRound />} onClick={verify}>Connect</Button></>,
    <Button variant="primary" disabled={checks < 4} onClick={() => setStep(3)}>Continue</Button>,
    <>{back}<Button variant="primary" onClick={() => setStep(4)}>Continue</Button></>,
    <>{back}<Button variant="primary" onClick={finish}>Finish setup</Button></>,
    <Button variant="primary" onClick={() => { close(); window.location.hash = '#/whatsapp'; }}>Open WhatsApp inbox</Button>,
  ][step];

  return (
    <Modal open onClose={close} width={620} title={<span className="flex items-center gap-2.5"><WaIcon size={16} />Connect WhatsApp</span>} description="Powered by Scriwo — uses your existing WhatsApp number. No Meta Business API or template approval needed." footer={footer}>
      <div className="mb-5 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col gap-1.5">
            <div className={cn('h-1 rounded-full transition-colors duration-300', i <= step ? 'bg-[#25d366]' : 'bg-line')} />
            <span className={cn('hidden text-[10.5px] font-medium sm:block', i === step ? 'text-fg' : i < step ? 'text-muted' : 'text-faint')}>{s}</span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl p-4 shadow-[0_0_0_1px_rgb(var(--line-strong))]">
            <ScriwoMark size={40} />
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">Scriwo</div>
              <div className="text-xs text-muted">WhatsApp shared inbox & automation · scriwo.com</div>
              <div className="mt-2 flex flex-wrap gap-1"><Badge tone="success">No Meta API</Badge><Badge>QR-linked numbers</Badge><Badge>Signed webhooks</Badge><Badge>Campaigns</Badge></div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[[QrCode, '1. Link your number', 'Scan a QR code in Scriwo with the WhatsApp app — like WhatsApp Web.'], [KeyRound, '2. Create an API key', 'Scriwo → Developers → API keys, with Inbox, Contacts & Sessions scopes.'], [Zap, '3. Paste it here', 'Chats, contacts and delivery ticks sync into leadVico automatically.']].map(([I, t, d]) => {
              const Icon = I as typeof QrCode;
              return <div key={t as string} className="rounded-xl bg-sunken p-3"><Icon className="size-4 text-[#1fa855]" /><div className="mt-2 text-[12.5px] font-semibold">{t as string}</div><div className="mt-0.5 text-[11.5px] leading-[1.4] text-muted">{d as string}</div></div>;
            })}
          </div>
          <div className="flex items-center justify-between rounded-lg bg-brand/[.06] px-3 py-2.5 text-xs text-fg-2 ring-1 ring-inset ring-brand/15">
            <span>No Scriwo workspace yet?</span>
            <a href="https://scriwo.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold text-brand hover:underline">Create one at scriwo.com<ExternalLink className="size-3" /></a>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl bg-[#25d366]/[.07] p-3 text-[12.5px] text-fg-2 ring-1 ring-inset ring-[#25d366]/25">
            <KeyRound className="mt-0.5 size-4 shrink-0 text-[#1fa855]" />
            <div><div className="font-semibold text-fg">Where to find it</div>Scriwo → Developers → API keys → <b>New key</b>. Tick <b>Inbox</b>, <b>Contacts</b> and <b>Sessions</b>. The key is shown once.</div>
            <a href={`${SCRIWO_API}`} target="_blank" rel="noreferrer" className="ml-auto flex shrink-0 items-center gap-1 text-xs font-semibold text-[#1fa855] hover:underline">Open Scriwo<ExternalLink className="size-3" /></a>
          </div>
          <Field label="Scriwo API key" hint={err ? undefined : 'Sent as a Bearer token to app.scriwo.com. Stored encrypted; only the prefix is shown afterwards.'}>
            <Input autoFocus value={key} onChange={(e) => { setKey(e.target.value); setErr(''); }} placeholder="wpp_…" className={cn('font-mono text-[12.5px]', err && '!shadow-[inset_0_0_0_1px_rgb(var(--danger))]')} spellCheck={false} autoComplete="off" />
            {err && <span className="mt-1 block text-2xs font-medium text-danger">{err}</span>}
          </Field>
          <button onClick={() => { setKey('wpp_' + 'demo'.repeat(3) + '_' + Math.random().toString(36).slice(2, 14)); setErr(''); }} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"><Sparkles className="size-3.5" />Fill a sample key (demo)</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2 py-2">
          {['Authenticating with app.scriwo.com', 'Checking key scopes · inbox, contacts, sessions', 'Finding linked WhatsApp numbers', 'Subscribing to message & receipt webhooks'].map((label, i) => {
            const done = checks > i, active = checks === i;
            return (
              <div key={label} className={cn('flex items-center gap-3 rounded-xl px-3 py-3 transition', done ? 'bg-success/[.06]' : 'bg-sunken')}>
                {done ? <CircleCheck className="size-5 text-success" /> : active ? <Loader2 className="size-5 animate-spin text-[#1fa855]" /> : <span className="size-5 rounded-full border-2 border-line-strong" />}
                <span className={cn('text-[13px] font-medium', !done && !active && 'text-faint')}>{label}</span>
                {done && i === 2 && <Badge tone="success" className="ml-auto">{DEMO_NUMBERS.length} online</Badge>}
              </div>
            );
          })}
          {checks >= 4 && <div className="flex animate-fade-in items-center gap-2 pt-2 text-[13px] font-medium text-success"><ShieldCheck className="size-4" />Connected to Scriwo workspace “leadVico Sales”</div>}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <div className="label">Linked WhatsApp numbers</div>
            <div className="space-y-1.5">
              {DEMO_NUMBERS.map((n) => (
                <div key={n.number} className="flex items-center gap-3 rounded-xl px-3 py-2.5 shadow-[0_0_0_1px_rgb(var(--line-strong))]">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[#25d366]/10 text-[#1fa855]"><Smartphone className="size-4" /></span>
                  <div className="min-w-0 flex-1"><div className="num text-[13px] font-semibold">{n.number}</div><div className="text-xs text-muted">{n.name}</div></div>
                  <Badge tone="success" dot>Online</Badge>
                </div>
              ))}
            </div>
            <div className="mt-1.5 text-2xs text-faint">To add another number, link it by QR code in Scriwo → Sessions; it appears here automatically.</div>
          </div>
          <div>
            <div className="label">Webhook (registered automatically)</div>
            <div className="flex items-center gap-2 rounded-lg bg-sunken px-3 py-2 font-mono text-[11.5px] text-fg-2 ring-1 ring-inset ring-line">
              <span className="min-w-0 flex-1 truncate">{WEBHOOK}</span>
              <button onClick={() => { navigator.clipboard?.writeText(WEBHOOK).catch(() => {}); toast({ title: 'Webhook URL copied' }); }} className="text-faint hover:text-fg"><Copy className="size-3.5" /></button>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">{SCRIWO_EVENTS.map((e) => <Badge key={e} className="font-mono">{e}</Badge>)}<span className="ml-1 text-2xs text-faint">verified with X-Scriwo-Signature (HMAC-SHA256)</span></div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-1">
          {([
            ['autoLog', 'Log every chat on the CRM timeline', 'Incoming and outgoing messages appear on the matching lead or contact.', Check],
            ['autoCreateLeads', 'Create a lead from new WhatsApp numbers', 'Unknown senders become a New lead with source “WhatsApp”.', Users],
            ['autoAssign', 'Route chats to the record owner', 'Replies go to the rep who owns the lead; unassigned chats go round-robin.', Zap],
            ['recapAfterCalls', 'Offer a WhatsApp recap after calls', 'One click in call wrap-up sends the Vico AI summary to the customer.', Sparkles],
          ] as const).map(([k, t, d, I]) => (
            <div key={k} className="flex items-center gap-3 border-b py-3 last:border-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sunken text-muted"><I className="size-4" /></span>
              <div className="min-w-0 flex-1"><div className="text-[13px] font-medium">{t}</div><div className="text-xs text-muted">{d}</div></div>
              <Switch checked={wa[k]} onChange={(v) => wa.set({ [k]: v })} />
            </div>
          ))}
        </div>
      )}

      {step === 5 && (
        <div className="py-2 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#25d366]/12 text-[#1fa855]"><CircleCheck className="size-7" /></div>
          <div className="mt-3 text-[15px] font-semibold">WhatsApp is live in leadVico</div>
          <div className="mx-auto mt-1 max-w-sm text-xs text-muted">Message any lead or contact, run broadcasts from the Leads list, and see every chat on the timeline — all through your own WhatsApp number.</div>
        </div>
      )}
    </Modal>
  );
}
