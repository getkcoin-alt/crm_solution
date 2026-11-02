import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plug, Megaphone, MessageCircle, MessagesSquare, BellDot, Send, Timer } from 'lucide-react';
import { useWhatsApp, lastMessage, type WaThread } from '@/store/whatsapp';
import { resolveRef, ME } from '@/store/crm';
import { useScope, useCan } from '@/lib/access';
import { PageHeader, StatTile } from '@/components/shared';
import { Avatar, Badge, Button, Card, EmptyState } from '@/components/ui/primitives';
import { SearchInput, Segmented } from '@/components/ui/form';
import { ChatHeader, ChatThread, Ticks, WaIcon } from '@/components/whatsapp/Chat';
import { ScriwoMark } from '@/components/whatsapp/WhatsAppWizard';
import { cn, fmtTime, isSameDay, relTime, fmtDate } from '@/lib/utils';

const labelTone = { Hot: 'danger', 'Follow-up': 'warning', Pricing: 'violet', Demo: 'info' } as const;

function stamp(ts: number) {
  return isSameDay(ts, Date.now()) ? fmtTime(ts) : Date.now() - ts < 6 * 864e5 ? fmtDate(ts, { weekday: 'short' }) : fmtDate(ts);
}

export default function WhatsAppInbox() {
  const wa = useWhatsApp();
  const scope = useScope();
  const isAdmin = useCan()('manageUsers');
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'mine'>('all');
  const activeId = params.get('chat');

  const threads = useMemo(() => wa.threads
    .filter((t) => scope.refIds.has(t.ref.id))
    .map((t) => ({ t, p: resolveRef(t.ref)! }))
    .filter(({ p }) => !!p)
    .filter(({ t, p }) => (!q || `${p.name} ${p.company} ${t.messages.map((m) => m.text).join(' ')}`.toLowerCase().includes(q.toLowerCase())) && (filter !== 'unread' || t.unread > 0) && (filter !== 'mine' || t.assignee === ME))
    .sort((a, b) => lastMessage(b.t).at - lastMessage(a.t).at), [wa.threads, scope.refIds, q, filter]);

  const active: WaThread | undefined = wa.threads.find((t) => t.ref.id === activeId) ?? (activeId ? undefined : threads[0]?.t);
  const unread = threads.reduce((s, x) => s + x.t.unread, 0);
  const today = wa.threads.filter((t) => scope.refIds.has(t.ref.id)).flatMap((t) => t.messages).filter((m) => isSameDay(m.at, Date.now()));

  return (
    <div>
      <PageHeader
        title={<span className="flex items-center gap-2.5"><WaIcon size={16} />WhatsApp</span>}
        subtitle={wa.connected ? <>Connected via Scriwo · {wa.numbers.map((n) => n.number).join(' · ')}</> : 'Chat with leads and customers from your own WhatsApp number — powered by Scriwo.'}
        actions={<>
          {wa.connected && <Button icon={<Megaphone />} onClick={() => { window.location.hash = '#/leads'; }}>New broadcast</Button>}
          {!wa.connected && isAdmin && <Button variant="primary" icon={<Plug />} onClick={() => wa.set({ wizard: true })}>Connect WhatsApp</Button>}
        </>}
      />

      {!wa.connected && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-card md:flex-row md:items-center">
          <ScriwoMark size={40} />
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold">Showing sample conversations</div>
            <div className="text-xs text-muted">{isAdmin ? 'Link your WhatsApp through Scriwo in 2 minutes — no Meta Business API, no template approvals.' : 'Your admin hasn’t connected WhatsApp yet. Sending is disabled until Scriwo is linked.'}</div>
          </div>
          {isAdmin && <Button variant="primary" icon={<Plug />} onClick={() => wa.set({ wizard: true })}>Connect with Scriwo</Button>}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Open conversations" value={threads.length} sub="In your scope" icon={<MessagesSquare />} accent="#1fa855" />
        <StatTile label="Unread" value={unread} sub="Waiting for a reply" icon={<BellDot />} accent="#e05260" />
        <StatTile label="Messages today" value={today.length} sub={`${today.filter((m) => m.dir === 'in').length} received · ${today.filter((m) => m.dir === 'out').length} sent`} icon={<Send />} accent="#5856ee" />
        <StatTile label="Avg. first reply" value="6m" sub="Last 7 days · target < 15m" icon={<Timer />} accent="#e8a23b" />
      </div>

      <Card className="flex h-[calc(100vh-200px)] min-h-[560px] overflow-hidden">
        <div className={cn('flex w-full flex-col border-r md:w-[340px] md:shrink-0', activeId && 'max-md:hidden')}>
          <div className="space-y-2 border-b p-3">
            <SearchInput value={q} onChange={setQ} placeholder="Search chats & messages…" />
            <Segmented size="sm" value={filter} onChange={setFilter} className="flex w-full [&>button]:flex-1 [&>button]:justify-center" options={[{ value: 'all', label: 'All' }, { value: 'unread', label: `Unread${unread ? ` · ${unread}` : ''}` }, { value: 'mine', label: 'Mine' }]} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.map(({ t, p }) => {
              const lm = lastMessage(t);
              const on = active?.ref.id === t.ref.id;
              return (
                <button key={t.ref.id} onClick={() => setParams({ chat: t.ref.id })} className={cn('flex w-full items-center gap-3 border-b border-line/60 px-3 py-3 text-left transition-colors', on ? 'bg-[#25d366]/[.08]' : 'hover:bg-surface-2')}>
                  <Avatar name={p.name} hue={p.hue} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('truncate text-[13.5px]', t.unread ? 'font-semibold' : 'font-medium')}>{p.name}</span>
                      <span className={cn('ml-auto shrink-0 text-[11px]', t.unread ? 'font-semibold text-[#1fa855]' : 'text-faint')}>{stamp(lm.at)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {lm.dir === 'out' && <span className="text-muted"><Ticks ack={lm.ack} /></span>}
                      <span className={cn('truncate text-xs', t.unread ? 'text-fg' : 'text-muted')}>{wa.typing === t.ref.id ? <i className="text-[#1fa855]">typing…</i> : lm.text}</span>
                      {t.unread > 0 && <span className="num ml-auto flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[#25d366] px-1 text-[10.5px] font-bold text-white">{t.unread}</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-faint">
                      <span className="truncate">{p.company}</span>
                      {t.label && <Badge tone={labelTone[t.label]} className="!h-4 !px-1 !text-[10px]">{t.label}</Badge>}
                    </div>
                  </div>
                </button>
              );
            })}
            {!threads.length && <EmptyState icon={<MessageCircle />} title="No conversations" body={q || filter !== 'all' ? 'Try another filter.' : 'Message a lead from their profile to start a chat.'} />}
          </div>
        </div>
        <div className={cn('flex min-w-0 flex-1 flex-col', !activeId && 'max-md:hidden')}>
          {active ? (
            <>
              <div className="flex items-center border-b md:hidden"><button onClick={() => setParams({})} className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-muted"><ArrowLeft className="size-3.5" />All chats</button></div>
              <ChatHeader entity={active.ref} />
              <ChatThread key={active.ref.id} entity={active.ref} />
            </>
          ) : <div className="flex flex-1 items-center justify-center"><EmptyState icon={<MessageCircle />} title="Select a conversation" body={`Last synced ${relTime(Date.now() - 60_000)}`} /></div>}
        </div>
      </Card>
    </div>
  );
}
