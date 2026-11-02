import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCheck, Clock3, Paperclip, Send, Sparkles, Smile, Zap, Phone, MessageCircle, Lock, X, ExternalLink } from 'lucide-react';
import { useWhatsApp, type Ack, type WaMessage } from '@/store/whatsapp';
import { useCRM, resolveRef } from '@/store/crm';
import { usePhone } from '@/store/phone';
import { toast } from '@/store/ui';
import type { EntityRef } from '@/types';
import { Avatar, Badge, Button, IconButton, ScoreRing } from '../ui/primitives';
import { Popover, Drawer } from '../ui/overlay';
import { LeadStatusBadge } from '../shared';
import { cn, dayLabel, fmtTime, startOfDay } from '@/lib/utils';

export const WA_GREEN = '#25d366';

export function WaIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full text-white', className)} style={{ width: size + 8, height: size + 8, background: `linear-gradient(150deg, #3ee07a, #1fa855)` }}>
      <MessageCircle style={{ width: size * 0.78, height: size * 0.78 }} strokeWidth={2.4} />
    </span>
  );
}

export function Ticks({ ack }: { ack: Ack }) {
  if (ack === 0) return <Clock3 className="size-3 opacity-60" />;
  if (ack === 1) return <Check className="size-3.5 opacity-70" />;
  return <CheckCheck className={cn('size-3.5', ack === 3 ? 'text-[#53bdeb]' : 'opacity-70')} />;
}

const QUICK = [
  { t: 'Pricing', v: 'Hi {first}, sharing our pricing for your team size. Happy to walk you through it on a quick call.' },
  { t: 'Book demo', v: 'Hi {first}! Would you like a 30-min demo this week? Pick a slot here: leadvico.com/book' },
  { t: 'Follow-up', v: 'Hi {first}, just checking in on our last conversation — any questions I can help with?' },
  { t: 'Thanks', v: 'Thanks for your time today, {first}! I’ll send a recap shortly.' },
];

function Bubble({ m, showTime }: { m: WaMessage; showTime: boolean }) {
  const out = m.dir === 'out';
  return (
    <div className={cn('flex animate-fade-in', out ? 'justify-end' : 'justify-start')}>
      <div className={cn('relative max-w-[78%] rounded-2xl px-3 py-1.5 text-[13px] leading-[1.45] shadow-[0_1px_1px_rgb(var(--shadow)/.08)]',
        out ? 'rounded-br-md bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]' : 'rounded-bl-md bg-surface text-fg')}>
        {m.auto && <div className="mb-0.5 flex items-center gap-1 text-[10.5px] font-semibold opacity-60"><Zap className="size-3" />Auto recap</div>}
        <span className="whitespace-pre-wrap">{m.text}</span>
        <span className={cn('float-right ml-2 mt-1.5 flex items-center gap-0.5 text-[10.5px]', out ? 'text-[#111b21]/55 dark:text-white/55' : 'text-faint')}>
          {showTime && fmtTime(m.at)}{out && <Ticks ack={m.ack} />}
        </span>
      </div>
    </div>
  );
}

/** Conversation thread + composer, shared by the inbox and the record drawer. */
export function ChatThread({ entity, compact }: { entity: EntityRef; compact?: boolean }) {
  const wa = useWhatsApp();
  const thread = wa.threads.find((t) => t.ref.id === entity.id);
  const party = resolveRef(entity);
  const [text, setText] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const msgs = thread?.messages ?? [];
  const first = party?.name.split(' ')[0] ?? '';
  useEffect(() => { scroller.current?.scrollTo({ top: 9e9, behavior: 'smooth' }); }, [msgs.length, wa.typing]);
  useEffect(() => { if (thread?.unread) wa.markRead(entity.id); }, [thread?.unread, entity.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = () => {
    const v = text.trim();
    if (!v) return;
    if (!wa.connected) { toast({ title: 'Connect WhatsApp first', body: 'An admin can link Scriwo in Settings → WhatsApp.' }); return; }
    wa.send(entity, v);
    setText('');
  };
  let lastDay = 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scroller} className={cn('min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 py-4', compact ? 'max-h-none' : '')}
        style={{ backgroundColor: 'rgb(var(--sunken))', backgroundImage: 'radial-gradient(rgb(var(--line-strong) / .55) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
        <div className="mx-auto mb-3 flex w-fit items-center gap-1.5 rounded-lg bg-[#fff6d6] px-3 py-1.5 text-center text-[11px] text-[#54656f] shadow-sm dark:bg-[#182229] dark:text-[#ffd279]">
          <Lock className="size-3" />Messages are sent from your linked WhatsApp number via Scriwo
        </div>
        {msgs.map((m, i) => {
          const d = startOfDay(m.at);
          const head = d !== lastDay; lastDay = d;
          return (
            <div key={m.id}>
              {head && <div className="my-2 flex justify-center"><span className="rounded-md bg-surface px-2 py-0.5 text-[10.5px] font-medium text-muted shadow-sm">{dayLabel(m.at)}</span></div>}
              <Bubble m={m} showTime={i === msgs.length - 1 || msgs[i + 1]!.dir !== m.dir || msgs[i + 1]!.at - m.at > 5 * 60_000} />
            </div>
          );
        })}
        {!msgs.length && <div className="py-10 text-center text-xs text-muted">No messages yet — say hi to {first} 👋</div>}
        {wa.typing === entity.id && (
          <div className="flex justify-start"><div className="flex gap-1 rounded-2xl rounded-bl-md bg-surface px-3 py-2.5 shadow-sm">{[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-blink rounded-full bg-faint" style={{ animationDelay: `${i * 0.2}s` }} />)}</div></div>
        )}
      </div>
      <div className="border-t bg-surface p-2.5">
        <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
          {QUICK.map((q) => (
            <button key={q.t} onClick={() => setText(q.v.replace('{first}', first))} className="h-6 shrink-0 rounded-full bg-sunken px-2.5 text-[11px] font-medium text-fg-2 shadow-[inset_0_0_0_1px_rgb(var(--line))] hover:bg-line">{q.t}</button>
          ))}
          <button onClick={() => setText(`Hi ${first}, great speaking with you! As discussed, I’ll send the proposal for 40 seats with SSO and audit trail today. Does Thursday 3pm work for the technical demo?`)} className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-brand/10 px-2.5 text-[11px] font-semibold text-brand hover:bg-brand/15"><Sparkles className="size-3" />Vico AI reply</button>
        </div>
        <div className="flex items-end gap-2">
          <Popover side="top" width={250} trigger={({ toggle }) => <IconButton label="Emoji" onClick={toggle}><Smile className="size-4" /></IconButton>}>
            {(close) => <div className="grid grid-cols-8 gap-0.5 p-1">{'👍🙏🎉😊👋✅📎📅🔥💡🚀🤝😀👌📞⭐'.match(/\p{Extended_Pictographic}/gu)!.map((e) => <button key={e} onClick={() => { setText((t) => t + e); close(); }} className="rounded p-1 text-lg hover:bg-sunken">{e}</button>)}</div>}
          </Popover>
          <IconButton label="Attach" onClick={() => toast({ title: 'Attach a file', body: 'PDF, images and documents up to 16 MB are sent through Scriwo.' })}><Paperclip className="size-4" /></IconButton>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder={wa.connected ? 'Type a message' : 'Connect WhatsApp to send messages'}
            className="input max-h-32 min-h-[36px] flex-1 resize-none !py-2"
          />
          <button onClick={send} disabled={!text.trim()} className="flex size-9 shrink-0 items-center justify-center rounded-full text-white transition hover:brightness-110 disabled:opacity-40" style={{ background: WA_GREEN }}><Send className="size-4" /></button>
        </div>
      </div>
    </div>
  );
}

/** Header strip with the linked CRM record. */
export function ChatHeader({ entity, onClose }: { entity: EntityRef; onClose?: () => void }) {
  const party = resolveRef(entity);
  const lead = useCRM((s) => (entity.type === 'lead' ? s.leads.find((l) => l.id === entity.id) : undefined));
  const dial = usePhone((s) => s.dial);
  if (!party) return null;
  return (
    <div className="flex items-center gap-3 border-b bg-surface px-4 py-3">
      <Avatar name={party.name} hue={party.hue} size={38} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><Link to={party.href} className="truncate text-[14px] font-semibold hover:underline">{party.name}</Link>{lead && <LeadStatusBadge status={lead.status} />}</div>
        <div className="num truncate text-xs text-muted">{party.phone} · {party.company}</div>
      </div>
      {lead && <ScoreRing score={lead.score} size={30} />}
      <IconButton label="Call" variant="secondary" size="sm" onClick={() => dial(entity)}><Phone className="size-3.5" /></IconButton>
      <Link to={party.href} title="Open record" className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-fg"><ExternalLink className="size-3.5" /></Link>
      {onClose && <IconButton label="Close" size="sm" onClick={onClose}><X className="size-4" /></IconButton>}
    </div>
  );
}

/** Slide-over chat that can be opened from any lead or contact. */
export function WhatsAppDrawer() {
  const ref = useWhatsApp((s) => s.drawer);
  const close = () => useWhatsApp.setState({ drawer: null });
  if (!ref) return null;
  return (
    <Drawer open onClose={close} width={460}>
      <div className="flex h-full flex-col overflow-hidden sm:rounded-xl">
        <ChatHeader entity={ref} onClose={close} />
        <ChatThread entity={ref} compact />
      </div>
    </Drawer>
  );
}

export function WhatsAppButton({ entity, size = 'md', label = 'WhatsApp' }: { entity: EntityRef; size?: 'sm' | 'md'; label?: string }) {
  const open = useWhatsApp((s) => s.openChat);
  const unread = useWhatsApp((s) => s.threads.find((t) => t.ref.id === entity.id)?.unread ?? 0);
  return (
    <Button size={size} onClick={() => open(entity)} icon={<MessageCircle className="!text-[#1fa855]" />} className="relative">
      {label}
      {unread > 0 && <Badge tone="success" className="!h-4 !px-1 !text-[10px]">{unread}</Badge>}
    </Button>
  );
}
