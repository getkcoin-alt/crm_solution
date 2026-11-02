import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Copy, CheckCircle2, Loader2, Zap, Filter, Gauge, Route, MessageCircle, PhoneCall, Play, Plug, Inbox, Code2, Mail, Webhook, FileSpreadsheet, KeyRound, Merge, Timer, ArrowRight, Sparkles } from 'lucide-react';
import { useCRM } from '@/store/crm';
import { useSources } from '@/store/sources';
import { useWhatsApp } from '@/store/whatsapp';
import { useTelephony } from '@/store/telephony';
import { toast } from '@/store/ui';
import { SOURCE_DEFS, METHOD_META, CAPTURE_EMAIL, INTAKE_WEBHOOK, type SourceDef } from '@/data/leadSources';
import { PageHeader } from '@/components/shared';
import { Badge, Button, Card, CardHeader } from '@/components/ui/primitives';
import { Field, Input, Segmented, Switch, Select } from '@/components/ui/form';
import { Modal } from '@/components/ui/overlay';
import { cn, DAY, relTime } from '@/lib/utils';

function Mark({ d, size = 34 }: { d: Pick<SourceDef, 'name' | 'hue'>; size?: number }) {
  return <span className="inline-flex shrink-0 items-center justify-center rounded-[28%] font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(150deg, hsl(${d.hue} 70% 56%), hsl(${d.hue} 68% 40%))`, boxShadow: 'inset 0 1px 0 rgb(255 255 255 / .25)' }}>{d.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2)}</span>;
}

function CopyBox({ value, mono = true }: { value: string; mono?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-lg bg-sunken px-3 py-2 text-[12px] text-fg-2 ring-1 ring-inset ring-line', mono && 'font-mono')}>
      <span className="min-w-0 flex-1 truncate whitespace-pre">{value}</span>
      <button onClick={() => { navigator.clipboard?.writeText(value).catch(() => {}); toast({ title: 'Copied to clipboard' }); }} className="shrink-0 text-faint hover:text-fg"><Copy className="size-3.5" /></button>
    </div>
  );
}

const SNIPPET = `<script src="https://cdn.leadvico.com/capture.js"\n  data-workspace="ws_7f3k2m" async></script>`;

function SourceModal({ def, onClose }: { def: SourceDef; onClose: () => void }) {
  const src = useSources();
  const wa = useWhatsApp();
  const tel = useTelephony();
  const nav = useNavigate();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [picked, setPicked] = useState<string[]>(def.pickOptions ?? []);
  const [sheet, setSheet] = useState('');
  const isOn = !!src.connected[def.id];
  const done = (account: string) => { src.connect(def.id, account); toast({ tone: 'success', title: `${def.name} connected`, body: `New leads arrive ${def.freq.toLowerCase()} and are routed automatically.` }); onClose(); };
  const fakeConnect = (account: string) => { setBusy(true); setTimeout(() => { setBusy(false); done(account); }, 1100); };

  let body: React.ReactNode = null;
  let footer: React.ReactNode = <Button variant="ghost" onClick={onClose}>Close</Button>;
  if (def.method === 'api') {
    body = <div className="space-y-3">{def.fields!.map((f) => <Field key={f.key} label={f.label} hint={f.help || undefined}><Input type={f.secret ? 'password' : 'text'} value={vals[f.key] ?? ''} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} placeholder={f.placeholder} className="font-mono text-[12.5px]" /></Field>)}
      <button onClick={() => setVals(Object.fromEntries(def.fields!.map((f) => [f.key, 'demo-' + f.key + '-' + Math.random().toString(36).slice(2, 10)])))} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"><Sparkles className="size-3.5" />Fill sample values (demo)</button></div>;
    footer = <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} icon={<KeyRound />} disabled={def.fields!.some((f) => !vals[f.key])} onClick={() => fakeConnect(`${def.name} account`)}>Verify & connect</Button></>;
  } else if (def.method === 'oauth') {
    body = !authed ? (
      <button onClick={() => { setBusy(true); setTimeout(() => { setBusy(false); setAuthed(true); }, 1000); }} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl font-semibold text-white transition hover:brightness-110" style={{ background: `hsl(${def.hue} 70% 45%)` }}>{busy ? <Loader2 className="size-4 animate-spin" /> : null}{def.oauthLabel}</button>
    ) : (
      <div>
        <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-success"><CheckCircle2 className="size-4" />Signed in — choose {def.pickLabel?.toLowerCase()} to sync</div>
        <div className="space-y-1.5">{def.pickOptions!.map((o) => (
          <label key={o} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 shadow-[inset_0_0_0_1px_rgb(var(--line-strong))]"><input type="checkbox" checked={picked.includes(o)} onChange={() => setPicked(picked.includes(o) ? picked.filter((x) => x !== o) : [...picked, o])} className="size-4 accent-[rgb(var(--brand))]" /><span className="text-[13px]">{o}</span></label>
        ))}</div>
      </div>
    );
    footer = <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!authed || !picked.length} onClick={() => done(`${picked.length} ${def.pickLabel?.toLowerCase()}`)}>Start syncing</Button></>;
  } else if (def.method === 'webhook') {
    body = <div className="space-y-3">
      <Field label="Webhook URL"><CopyBox value={`${INTAKE_WEBHOOK}?source=${def.id}`} /></Field>
      <Field label="Key (send as header X-LeadVico-Key)"><CopyBox value="lvk_live_7f3k2m_••••••••••••" /></Field>
      <Field label="Example"><pre className="overflow-x-auto rounded-lg bg-[#0d0e14] p-3 font-mono text-[11px] leading-[1.6] text-[#c9d1d9]">{`curl -X POST '${INTAKE_WEBHOOK}?source=${def.id}' \\\n  -H 'X-LeadVico-Key: lvk_live_…' -H 'Content-Type: application/json' \\\n  -d '{"name":"Rohit Sharma","phone":"+919812345678","email":"rohit@acme.in","company":"Acme","notes":"Demo request"}'`}</pre></Field>
    </div>;
    footer = <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => fakeConnect('Webhook')} loading={busy}>I’ve added it — listen for leads</Button></>;
  } else if (def.method === 'email') {
    body = <div className="space-y-3">
      <Field label="Your capture address"><CopyBox value={CAPTURE_EMAIL} /></Field>
      <div className="rounded-lg bg-sunken p-3 text-[12.5px] leading-[1.55] text-fg-2"><b className="text-fg">Gmail:</b> Settings → Forwarding → Add address, then a filter <span className="font-mono text-[11.5px]">from:({def.id === 'justdial' ? 'justdial.com' : def.id === '99acres' ? '99acres.com' : def.id === 'magicbricks' ? 'magicbricks.com' : 'your-enquiry-sender'})</span> → Forward to the address above.<br /><b className="text-fg">Outlook:</b> Rules → New rule → Forward to.</div>
      <div className="flex items-start gap-2 rounded-lg bg-brand/[.06] px-3 py-2.5 text-xs text-fg-2 ring-1 ring-inset ring-brand/15"><Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand" />Vico AI reads each email and extracts name, phone, email, company, location and requirement — even from free-text enquiries.</div>
    </div>;
    footer = <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => fakeConnect('Email forwarding')} loading={busy}>Forwarding is set up</Button></>;
  } else if (def.method === 'embed') {
    body = <div className="space-y-3">
      <Field label="Paste before </body> on your website"><pre className="overflow-x-auto rounded-lg bg-[#0d0e14] p-3 font-mono text-[11.5px] leading-[1.6] text-[#c9d1d9]">{SNIPPET}</pre></Field>
      <Button size="sm" icon={<Copy />} onClick={() => { navigator.clipboard?.writeText(SNIPPET).catch(() => {}); toast({ title: 'Snippet copied' }); }}>Copy snippet</Button>
      <div className="grid grid-cols-3 gap-2 text-center text-[11.5px] text-muted">{['Works with any form', 'Captures UTM & page', 'No form rebuild'].map((x) => <div key={x} className="rounded-lg bg-sunken px-2 py-2.5">{x}</div>)}</div>
    </div>;
    footer = <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => fakeConnect('leadvico.com')} loading={busy}>Verify installation</Button></>;
  } else if (def.method === 'sheet') {
    body = <div className="space-y-3">
      <Field label="Google Sheet URL" hint="Share the sheet with sync@leadvico.com (viewer)."><Input value={sheet} onChange={(e) => setSheet(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" /></Field>
      {sheet && <div className="rounded-lg p-3 shadow-[inset_0_0_0_1px_rgb(var(--line))]"><div className="label">Column mapping</div>{[['Full Name', 'Name'], ['Mobile', 'Phone'], ['Email Address', 'Email'], ['Company', 'Company'], ['Requirement', 'Notes']].map(([a, b]) => <div key={a} className="flex items-center gap-2 py-1 text-[12.5px]"><span className="w-32 font-mono text-[11.5px] text-fg-2">{a}</span><ArrowRight className="size-3 text-faint" /><span className="font-medium">{b}</span></div>)}</div>}
    </div>;
    footer = <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!sheet} onClick={() => fakeConnect('Google Sheet')} loading={busy}>Start sync</Button></>;
  } else if (def.method === 'native') {
    const ready = def.id === 'whatsapp' ? wa.connected : !!tel.provider;
    body = <div className="space-y-3 text-[13px] text-fg-2">
      <p>{def.how}</p>
      {!ready && <div className="rounded-lg bg-warning/10 px-3 py-2.5 text-xs text-warning">{def.id === 'whatsapp' ? 'WhatsApp isn’t connected yet.' : 'No telephony provider is connected yet.'} It still works in demo mode.</div>}
    </div>;
    footer = <><Button variant="ghost" onClick={onClose}>Cancel</Button>{!ready && <Button onClick={() => { onClose(); if (def.id === 'whatsapp') wa.set({ wizard: true }); else tel.openWizard(); }}>Connect {def.id === 'whatsapp' ? 'WhatsApp' : 'telephony'}</Button>}<Button variant="primary" onClick={() => done(def.id === 'whatsapp' ? 'Scriwo' : 'Telephony')}>Turn on</Button></>;
  } else {
    body = <p className="text-[13px] text-fg-2">{def.how}</p>;
    footer = <><Button variant="ghost" onClick={onClose}>Close</Button><Button variant="primary" onClick={() => { onClose(); nav('/leads'); }}>Go to Leads → Import</Button></>;
  }

  return (
    <Modal open onClose={onClose} width={560} title={<span className="flex items-center gap-2.5"><Mark d={def} size={26} />{isOn ? `${def.name} · connected` : `Connect ${def.name}`}</span>} description={def.desc} footer={footer}>
      {def.method !== 'file' && def.method !== 'native' && <div className="mb-4 rounded-lg bg-sunken px-3 py-2.5 text-xs text-fg-2"><b className="text-fg">How: </b>{def.how}</div>}
      {body}
    </Modal>
  );
}

export default function Sources() {
  const src = useSources();
  const leads = useCRM((s) => s.leads);
  const nav = useNavigate();
  const [open, setOpen] = useState<SourceDef | null>(null);
  const [group, setGroup] = useState<'all' | 'connected'>('all');

  const last30 = useMemo(() => leads.filter((l) => l.createdAt > Date.now() - 30 * DAY), [leads]);
  const bySource = useMemo(() => {
    const m: Record<string, number> = {};
    last30.forEach((l) => { m[l.source] = (m[l.source] ?? 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [last30]);
  const max = Math.max(1, ...bySource.map((x) => x[1]));
  const groups = [...new Set(SOURCE_DEFS.map((d) => d.group))];
  const count = Object.keys(src.connected).length;

  const pipeline = [
    { icon: Inbox, t: 'Capture', d: 'Every channel lands in one inbox' },
    { icon: Merge, t: 'De-duplicate', d: 'Same phone/email → merged' },
    { icon: Gauge, t: 'Score', d: 'Fit + intent scoring' },
    { icon: Route, t: 'Route', d: src.rules.routing === 'round-robin' ? 'Round-robin to SDRs' : src.rules.routing === 'territory' ? 'By territory' : 'By source owner' },
    { icon: Timer, t: 'Respond', d: `WhatsApp now · call in ${src.rules.slaMinutes} min` },
  ];

  return (
    <div>
      <PageHeader title="Lead sources" subtitle="Bring every enquiry — marketplaces, ads, portals, website, WhatsApp, calls — into one pipeline, and respond in minutes."
        actions={<><Button icon={<Mail />} onClick={() => { navigator.clipboard?.writeText(CAPTURE_EMAIL).catch(() => {}); toast({ title: 'Capture address copied', body: CAPTURE_EMAIL }); }}>Copy capture email</Button><Button variant="primary" icon={<Plug />} onClick={() => setOpen(SOURCE_DEFS[0]!)}>Connect a source</Button></>} />

      <Card className="mb-4 overflow-hidden">
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-5">
          {pipeline.map((p, i) => (
            <div key={p.t} className="relative bg-surface px-4 py-3.5">
              <div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg bg-brand/10 text-brand"><p.icon className="size-3.5" /></span><span className="text-[11px] font-semibold text-faint">STEP {i + 1}</span></div>
              <div className="mt-2 text-[13px] font-semibold">{p.t}</div>
              <div className="text-[11.5px] text-muted">{p.d}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-5">
          <div className="flex items-center justify-between">
            <Segmented value={group} onChange={setGroup} options={[{ value: 'all', label: `All sources · ${SOURCE_DEFS.length}` }, { value: 'connected', label: `Connected · ${count}` }]} />
          </div>
          {groups.map((g) => {
            const defs = SOURCE_DEFS.filter((d) => d.group === g && (group === 'all' || src.connected[d.id]));
            if (!defs.length) return null;
            return (
              <div key={g}>
                <div className="eyebrow mb-2">{g}</div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {defs.map((d) => {
                    const on = src.connected[d.id];
                    const n = last30.filter((l) => l.source === d.source).length;
                    return (
                      <div key={d.id} className={cn('card flex flex-col p-4 transition', on && 'shadow-[0_0_0_1.5px_rgb(var(--success)/.55)]')}>
                        <div className="flex items-start gap-3">
                          <Mark d={d} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[13.5px] font-semibold">{d.name}</div>
                            <div className="mt-0.5 line-clamp-2 text-[12px] leading-[1.4] text-muted">{d.desc}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <Badge tone={METHOD_META[d.method].tone}>{METHOD_META[d.method].label}</Badge>
                          <Badge>{d.freq}</Badge>
                          {n > 0 && <span className="num ml-auto text-[11px] text-muted">{n} leads · 30d</span>}
                        </div>
                        <div className="mt-3 flex items-center gap-2 border-t border-dashed pt-3">
                          {on ? <Badge tone="success" dot>Connected</Badge> : <span className="text-xs text-faint">Not connected</span>}
                          <div className="ml-auto flex gap-1.5">
                            {on && <Button size="xs" icon={<Play />} onClick={() => src.ingest(d.id)}>Test lead</Button>}
                            <Button size="xs" variant={on ? 'ghost' : 'secondary'} onClick={() => setOpen(d)}>{on ? 'Settings' : 'Connect'}</Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Live intake" icon={<Radio />} subtitle="Leads arriving right now" action={<span className="flex items-center gap-1.5 text-xs text-success"><span className="size-1.5 animate-blink rounded-full bg-success" />Listening</span>} />
            <div className="max-h-[360px] overflow-y-auto px-3 pb-3">
              {src.feed.map((e) => {
                const d = SOURCE_DEFS.find((x) => x.id === e.sourceId)!;
                return (
                  <button key={e.id} onClick={() => nav(`/leads/${e.leadId}`)} className="mb-2 w-full animate-slide-up rounded-xl p-3 text-left shadow-[inset_0_0_0_1px_rgb(var(--line))] hover:bg-surface-2">
                    <div className="flex items-center gap-2"><Mark d={d} size={22} /><span className="text-[13px] font-semibold">{e.name}</span>{e.duplicate ? <Badge tone="warning">Merged</Badge> : <Badge tone="success">New</Badge>}<span className="ml-auto text-[11px] text-faint">{relTime(e.at)}</span></div>
                    <ol className="mt-2 space-y-1 border-l border-line pl-3">{e.steps.map((s) => <li key={s} className="flex items-center gap-1.5 text-[11.5px] text-fg-2"><CheckCircle2 className="size-3 shrink-0 text-success" />{s}</li>)}</ol>
                  </button>
                );
              })}
              {!src.feed.length && (
                <div className="py-6 text-center">
                  <div className="text-xs text-muted">No test leads yet. Send one from a connected source.</div>
                  <Button size="sm" className="mt-3" icon={<Play />} onClick={() => src.ingest(Object.keys(src.connected).find((k) => k !== 'csv') ?? 'website')}>Send a test lead</Button>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Intake rules" icon={<Filter />} subtitle="Applied to every source" />
            <div className="space-y-3.5 px-4 pb-4">
              <div className="flex items-center gap-3"><Merge className="size-4 text-muted" /><div className="flex-1"><div className="text-[13px] font-medium">Merge duplicates</div><div className="text-[11.5px] text-muted">Match on phone or email</div></div><Switch checked={src.rules.dedupe} onChange={(v) => src.setRules({ dedupe: v })} /></div>
              <div className="flex items-center gap-3"><Route className="size-4 text-muted" /><div className="flex-1"><div className="text-[13px] font-medium">Assignment</div></div>
                <Select size="sm" className="!w-40" value={src.rules.routing} onChange={(v) => src.setRules({ routing: v })} options={[{ value: 'round-robin', label: 'Round-robin (SDRs)' }, { value: 'territory', label: 'By territory' }, { value: 'source-owner', label: 'By source owner' }]} />
              </div>
              <div className="flex items-center gap-3"><MessageCircle className="size-4 text-[#1fa855]" /><div className="flex-1"><div className="text-[13px] font-medium">Instant WhatsApp reply</div><div className="text-[11.5px] text-muted">Within seconds, via Scriwo</div></div><Switch checked={src.rules.autoWhatsApp} onChange={(v) => src.setRules({ autoWhatsApp: v })} /></div>
              <div className="flex items-center gap-3"><PhoneCall className="size-4 text-muted" /><div className="flex-1"><div className="text-[13px] font-medium">Call task (speed-to-lead)</div><div className="text-[11.5px] text-muted">Due within</div></div>
                <Select size="sm" className="!w-28" value={String(src.rules.slaMinutes)} onChange={(v) => src.setRules({ slaMinutes: Number(v) })} options={['5', '15', '30', '60'].map((x) => ({ value: x, label: `${x} min` }))} />
                <Switch checked={src.rules.callTask} onChange={(v) => src.setRules({ callTask: v })} />
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-brand/[.06] px-3 py-2.5 text-[12px] leading-[1.45] text-fg-2 ring-1 ring-inset ring-brand/15"><Zap className="mt-0.5 size-3.5 shrink-0 text-brand" />Leads contacted within 5 minutes are far more likely to convert than those reached after an hour — this is why every source gets an instant reply and a call task.</div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Leads by source" subtitle="Last 30 days" />
            <div className="space-y-2.5 px-4 pb-4">
              {bySource.slice(0, 8).map(([s, n]) => (
                <div key={s}><div className="mb-1 flex justify-between text-xs"><span className="text-fg-2">{s}</span><span className="num font-semibold">{n}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-sunken"><div className="h-full rounded-full bg-brand" style={{ width: `${(n / max) * 100}%` }} /></div></div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold"><Code2 className="size-4 text-muted" />Anything else?</div>
            <p className="mt-1 text-xs text-muted">Use the <b>Webhook / REST API</b> (works with Zapier, Make, Pabbly, n8n) or the <b>capture email</b> — any tool that can send an email or HTTP request can create leads.</p>
            <div className="mt-2 flex gap-2"><Button size="xs" icon={<Webhook />} onClick={() => setOpen(SOURCE_DEFS.find((d) => d.id === 'webhook')!)}>Webhook</Button><Button size="xs" icon={<FileSpreadsheet />} onClick={() => setOpen(SOURCE_DEFS.find((d) => d.id === 'gforms')!)}>Google Sheet</Button></div>
          </Card>
        </div>
      </div>

      {open && <SourceModal def={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
