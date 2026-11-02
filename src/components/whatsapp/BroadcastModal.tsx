import { useState } from 'react';
import { Megaphone, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/overlay';
import { Button } from '../ui/primitives';
import { Textarea, Segmented } from '../ui/form';
import { useWhatsApp } from '@/store/whatsapp';
import { resolveRef } from '@/store/crm';
import { toast } from '@/store/ui';
import type { EntityRef } from '@/types';

const TEMPLATES = {
  followup: 'Hi {{first_name}}, thanks for your interest in leadVico! Would a quick 20-min call this week help your team at {{company}}? 🙂',
  webinar: 'Hi {{first_name}}! We’re hosting a live session on cutting call-logging time by 80% — Thursday 4 PM. Want me to save you a seat?',
  offer: 'Hi {{first_name}}, this month teams like {{company}} get onboarding free with an annual plan. Shall I share the details?',
};

/** Bulk WhatsApp send, delivered through a paced Scriwo campaign. */
export function BroadcastModal({ refs, onClose }: { refs: EntityRef[]; onClose: () => void }) {
  const wa = useWhatsApp();
  const [tpl, setTpl] = useState<keyof typeof TEMPLATES>('followup');
  const [text, setText] = useState(TEMPLATES.followup);
  const sample = resolveRef(refs[0]!);
  const preview = text.replace(/\{\{\s*first_name\s*\}\}/g, sample?.name.split(' ')[0] ?? 'there').replace(/\{\{\s*company\s*\}\}/g, sample?.company ?? 'your team');
  const send = () => {
    if (!wa.connected) { toast({ title: 'Connect WhatsApp first', body: 'An admin can link Scriwo in Settings → WhatsApp.' }); return; }
    const n = wa.broadcast(refs, text);
    toast({ tone: 'success', title: `WhatsApp broadcast queued · ${n} recipients`, body: 'Sent as a Scriwo campaign with human-like pacing; opt-outs are skipped.' });
    onClose();
  };
  return (
    <Modal open onClose={onClose} width={560} icon={<Megaphone />} title={`WhatsApp broadcast · ${refs.length} ${refs.length === 1 ? 'lead' : 'leads'}`} description="Each person receives a personal 1:1 message from your WhatsApp number."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={send} disabled={!text.trim()}>Send to {refs.length}</Button></>}>
      <div className="space-y-4">
        <Segmented value={tpl} onChange={(v) => { setTpl(v); setText(TEMPLATES[v]); }} className="flex w-full [&>button]:flex-1 [&>button]:justify-center" options={[{ value: 'followup', label: 'Follow-up' }, { value: 'webinar', label: 'Event invite' }, { value: 'offer', label: 'Offer' }]} />
        <div>
          <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="mt-1 text-2xs text-faint">Variables: <code className="font-mono">{'{{first_name}}'}</code> · <code className="font-mono">{'{{company}}'}</code></div>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: 'rgb(var(--sunken))', backgroundImage: 'radial-gradient(rgb(var(--line-strong) / .55) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
          <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint">Preview · {sample?.name}</div>
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#d9fdd3] px-3 py-2 text-[13px] leading-[1.45] text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">{preview}</div>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-success/[.06] px-3 py-2.5 text-xs text-fg-2 ring-1 ring-inset ring-success/20">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />Scriwo paces delivery, skips contacts who opted out and stops if the campaign is paused — protecting your number’s health.
        </div>
      </div>
    </Modal>
  );
}
