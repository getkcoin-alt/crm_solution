import { Plug, Smartphone, Unplug, RefreshCw, KeyRound, Webhook, Check, Users, Zap, Sparkles, ExternalLink } from 'lucide-react';
import { useWhatsApp, SCRIWO_EVENTS } from '@/store/whatsapp';
import { toast } from '@/store/ui';
import { Badge, Button } from '../ui/primitives';
import { Switch } from '../ui/form';
import { ScriwoMark } from './WhatsAppWizard';
import { relTime } from '@/lib/utils';

/** Settings → WhatsApp (admin). */
export function WhatsAppSettings() {
  const wa = useWhatsApp();
  return (
    <div className="space-y-4">
      <div className="card animate-fade-in">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div><div className="text-[14px] font-semibold">WhatsApp</div><div className="mt-0.5 text-xs text-muted">Powered by Scriwo — your own WhatsApp numbers, linked by QR. No Meta Business API.</div></div>
          {wa.connected && <div className="flex gap-1.5"><Button size="sm" icon={<RefreshCw />} onClick={() => wa.set({ wizard: true })}>Reconnect</Button><Button size="sm" variant="ghost" className="!text-danger" icon={<Unplug />} onClick={() => { wa.disconnect(); toast({ title: 'WhatsApp disconnected', body: 'Chats stay in Scriwo; syncing to leadVico has stopped.' }); }}>Disconnect</Button></div>}
        </div>
        <div className="p-5">
          {wa.connected ? (
            <div className="flex flex-wrap items-center gap-4">
              <ScriwoMark size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[14px] font-semibold">Scriwo · {wa.workspace}<Badge tone="success" dot>Connected</Badge></div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="flex items-center gap-1"><KeyRound className="size-3" /><span className="font-mono">{wa.keyPrefix}</span></span>
                  <span>Scopes: inbox · contacts · sessions</span>
                  <span>Connected {relTime(wa.connectedAt)}</span>
                </div>
              </div>
              <a href="https://app.scriwo.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-[#1fa855] hover:underline">Open Scriwo<ExternalLink className="size-3" /></a>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <ScriwoMark size={44} />
              <div className="min-w-0 flex-1 text-[13px] text-fg-2">Connect a Scriwo workspace to message leads from leadVico, log every chat on the timeline and run WhatsApp broadcasts.</div>
              <Button variant="primary" icon={<Plug />} onClick={() => wa.set({ wizard: true })}>Connect WhatsApp</Button>
            </div>
          )}
        </div>
      </div>

      {wa.connected && (
        <>
          <div className="card animate-fade-in">
            <div className="border-b px-5 py-4"><div className="text-[14px] font-semibold">Linked numbers</div><div className="mt-0.5 text-xs text-muted">Add or re-link numbers by QR code in Scriwo → Sessions.</div></div>
            <div className="p-5">
              {wa.numbers.map((n) => (
                <div key={n.number} className="flex items-center gap-4 border-b py-3 first:pt-0 last:border-0 last:pb-0">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#25d366]/10 text-[#1fa855]"><Smartphone className="size-4" /></span>
                  <div className="min-w-0 flex-1"><div className="num text-[13px] font-medium">{n.number}</div><div className="text-xs text-muted">{n.name} · linked {relTime(n.linkedAt)}</div></div>
                  <Badge tone="success" dot>Online</Badge>
                </div>
              ))}
            </div>
          </div>
          <div className="card animate-fade-in">
            <div className="border-b px-5 py-4"><div className="text-[14px] font-semibold">Webhook events</div><div className="mt-0.5 text-xs text-muted">Signed with X-Scriwo-Signature (HMAC-SHA256) and verified on every delivery.</div></div>
            <div className="flex flex-wrap gap-2 p-5">
              {SCRIWO_EVENTS.map((e) => <span key={e} className="flex items-center gap-2 rounded-lg bg-sunken px-3 py-2 text-xs"><Webhook className="size-3.5 text-muted" /><span className="font-mono">{e}</span><Badge tone="success">Healthy</Badge></span>)}
            </div>
          </div>
        </>
      )}

      <div className="card animate-fade-in">
        <div className="border-b px-5 py-4"><div className="text-[14px] font-semibold">Automation</div><div className="mt-0.5 text-xs text-muted">How WhatsApp activity flows into the CRM.</div></div>
        <div className="px-5 py-2">
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
      </div>
    </div>
  );
}
