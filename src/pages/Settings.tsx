import { useState, type ReactNode } from 'react';
import { MessageCircle, User, Building, Users2, ShieldCheck, KanbanSquare, Phone, Bell, Plug, Sun, Moon, Monitor, Check, Plus, GripVertical, Mic, Voicemail, MapPin, Sparkles, Lock } from 'lucide-react';
import { useCRM, ME } from '@/store/crm';
import { usePrefs, applyTheme } from '@/store/prefs';
import { toast } from '@/store/ui';
import { PageHeader } from '@/components/shared';
import { useSession, PERMISSIONS } from '@/store/session';
import { useCan, useViewer } from '@/lib/access';
import { TelephonySettings } from '@/components/calling/TelephonyPanel';
import { ProviderMark } from '@/components/calling/TelephonyWizard';
import { PROVIDERS } from '@/data/providers';
import { useTelephony } from '@/store/telephony';
import { useWhatsApp } from '@/store/whatsapp';
import { WhatsAppSettings } from '@/components/whatsapp/WhatsAppSettings';
import { ScriwoMark } from '@/components/whatsapp/WhatsAppWizard';
import { Avatar, Badge, Button, Card } from '@/components/ui/primitives';
import { Field, Input, Select, Switch } from '@/components/ui/form';
import { CURRENCIES, cn, money, type Currency } from '@/lib/utils';
import type { Role } from '@/types';

type Section = 'profile' | 'workspace' | 'users' | 'roles' | 'pipeline' | 'calling' | 'notifications' | 'integrations' | 'whatsapp';
const sections: { id: Section; label: string; icon: typeof User; group: string }[] = [
  { id: 'profile', label: 'Profile', icon: User, group: 'Account' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'Account' },
  { id: 'workspace', label: 'Workspace', icon: Building, group: 'Workspace' },
  { id: 'users', label: 'Users', icon: Users2, group: 'Workspace' },
  { id: 'roles', label: 'Roles & permissions', icon: ShieldCheck, group: 'Workspace' },
  { id: 'pipeline', label: 'Pipeline stages', icon: KanbanSquare, group: 'Sales' },
  { id: 'calling', label: 'Calling', icon: Phone, group: 'Sales' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, group: 'Sales' },
  { id: 'integrations', label: 'Integrations', icon: Plug, group: 'Sales' },
];

function Section({ title, desc, children, action }: { title: string; desc?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="animate-fade-in">
      <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
        <div><div className="text-[14px] font-semibold">{title}</div>{desc && <div className="mt-0.5 text-xs text-muted">{desc}</div>}</div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}
function Row({ title, desc, children, icon }: { title: string; desc?: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b py-3.5 first:pt-0 last:border-0 last:pb-0">
      {icon && <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sunken text-muted [&_svg]:size-4">{icon}</span>}
      <div className="min-w-0 flex-1"><div className="text-[13px] font-medium">{title}</div>{desc && <div className="text-xs text-muted">{desc}</div>}</div>
      {children}
    </div>
  );
}

const ROLES: Role[] = ['Admin', 'Sales Manager', 'Account Executive', 'SDR'];

export default function Settings() {
  const [secState, setSec] = useState<Section>('profile');
  const { reps, updateRep, stages } = useCRM();
  const me = reps.find((r) => r.id === ME)!;
  const prefs = usePrefs();
  const tel = useTelephony();
  const wa = useWhatsApp();
  const matrix = useSession((x) => x.matrix);
  const setPerm = useSession((x) => x.setPerm);
  const can = useCan();
  const viewer = useViewer();
  const allowed: Record<Section, boolean> = { profile: true, notifications: true, calling: true, workspace: true, users: can('manageUsers'), roles: can('manageUsers'), integrations: can('manageUsers'), whatsapp: can('manageUsers'), pipeline: can('managePipeline') };
  const [notif, setNotif] = useState({ deal: true, missed: true, assigned: true, mention: true, digest: true, task: false });
  const [integ, setInteg] = useState<Record<string, boolean>>({ Gmail: true, 'Google Calendar': true, Slack: true, Zoom: false, 'Microsoft Teams': false, Zapier: false, LinkedIn: false, DocuSign: false });
  const [probs, setProbs] = useState(stages.map((s) => Math.round(s.probability * 100)));
  const save = () => toast({ tone: 'success', title: 'Settings saved' });
  const sec: Section = allowed[secState] ? secState : 'profile';

  return (
    <div>
      <PageHeader title="Settings" subtitle={viewer.role === 'Admin' ? 'Manage your profile, workspace, team access and calling configuration.' : `Signed in as ${viewer.name} · ${viewer.role}. Workspace administration is managed by your admin.`} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 lg:sticky lg:top-20 lg:flex-col lg:self-start">
          {['Account', 'Workspace', 'Sales'].map((g) => (
            <div key={g} className="contents lg:block lg:pb-3">
              <div className="eyebrow hidden px-2 pb-1 lg:block">{g}</div>
              {sections.filter((s) => s.group === g && allowed[s.id]).map((s) => (
                <button key={s.id} onClick={() => setSec(s.id)} className={cn('flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-[13px] font-medium transition lg:w-full', sec === s.id ? 'bg-surface text-fg shadow-[0_0_0_1px_rgb(var(--line-strong))]' : 'text-fg-2 hover:bg-sunken')}>
                  <s.icon className={cn('size-4', sec === s.id ? 'text-brand' : 'text-muted')} />{s.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="min-w-0 space-y-4">
          {sec === 'profile' && (
            <Section title="Profile" desc="How you appear to teammates and customers." action={<Button variant="primary" size="sm" onClick={save}>Save</Button>}>
              <div className="mb-5 flex items-center gap-4">
                <Avatar name={me.name} hue={me.hue} size={64} presence="online" />
                <div><Button size="sm" onClick={() => toast({ title: 'Upload a photo', body: 'PNG or JPG, max 2MB' })}>Change photo</Button><div className="mt-1 text-xs text-muted">Shown in calls, emails and the activity feed.</div></div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name"><Input defaultValue={me.name} /></Field>
                <Field label="Job title"><Input defaultValue={me.title} /></Field>
                <Field label="Email"><Input defaultValue={me.email} /></Field>
                <Field label="Direct line"><Input defaultValue={me.phone} /></Field>
                <Field label="Timezone"><Select value="ny" onChange={() => {}} options={[{ value: 'ny', label: '(GMT-5) Eastern Time' }, { value: 'ldn', label: '(GMT+0) London' }, { value: 'ist', label: '(GMT+5:30) India Standard Time' }]} /></Field>
                <Field label="Email signature"><Input key={me.id} defaultValue={`${me.name} · ${me.title} · leadVico`} /></Field>
              </div>
            </Section>
          )}

          {sec === 'workspace' && (
            <>
              <Section title="Appearance" desc="Personalise how leadVico looks for you.">
                <div className="grid grid-cols-3 gap-3">
                  {([['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]] as const).map(([v, l, I]) => (
                    <button key={v} onClick={() => { prefs.setTheme(v); applyTheme(v); }} className={cn('group overflow-hidden rounded-xl text-left transition', prefs.theme === v ? 'shadow-[0_0_0_2px_rgb(var(--brand))]' : 'shadow-[0_0_0_1px_rgb(var(--line-strong))] hover:shadow-[0_0_0_1px_rgb(var(--faint))]')}>
                      <div className={cn('flex h-20 gap-1.5 p-2', v === 'dark' ? 'bg-[#0b0c0f]' : v === 'light' ? 'bg-[#f4f4f6]' : 'bg-gradient-to-r from-[#f4f4f6] from-50% to-[#0b0c0f] to-50%')}>
                        <div className={cn('w-1/4 rounded', v === 'dark' ? 'bg-[#16171c]' : 'bg-white')} />
                        <div className="flex flex-1 flex-col gap-1.5"><div className={cn('h-3 rounded', v === 'dark' ? 'bg-[#1c1d23]' : 'bg-white')} /><div className={cn('flex-1 rounded', v === 'light' ? 'bg-white' : 'bg-[#16171c]')} /></div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium"><I className="size-3.5 text-muted" />{l}{prefs.theme === v && <Check className="ml-auto size-3.5 text-brand" />}</div>
                    </button>
                  ))}
                </div>
              </Section>
              {can('manageUsers') && <Section title="Workspace" desc="Applies to everyone in leadVico Inc." action={<Button variant="primary" size="sm" onClick={save}>Save</Button>}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Company name"><Input defaultValue="leadVico Inc." /></Field>
                  <Field label="Workspace URL"><Input defaultValue="app.leadvico.com" /></Field>
                  <Field label="Reporting currency" hint={`Preview: ${money(125000)} — every amount in the app updates instantly.`}>
                    <Select<Currency> value={prefs.currency} onChange={(v) => { prefs.setCurrency(v); toast({ tone: 'success', title: `Currency set to ${v}`, body: CURRENCIES[v].label }); }} options={(Object.keys(CURRENCIES) as Currency[]).map((c) => ({ value: c, label: `${c} — ${CURRENCIES[c].label}` }))} />
                  </Field>
                  <Field label="Fiscal year starts"><Select value="jan" onChange={() => {}} options={[{ value: 'jan', label: 'January' }, { value: 'apr', label: 'April' }, { value: 'jul', label: 'July' }]} /></Field>
                </div>
              </Section>}
            </>
          )}

          {sec === 'users' && (
            <Section title="Users" desc={`${reps.length} seats used of 25 · Enterprise plan`} action={<Button variant="primary" size="sm" icon={<Plus />} onClick={() => toast({ title: 'Use Team → Invite to add teammates' })}>Invite</Button>}>
              <div className="-mx-5 -my-5 scroll-x">
                <table className="w-full min-w-[640px] text-[13px]">
                  <thead className="border-b bg-surface-2 text-left text-[11.5px] text-muted"><tr><th className="h-9 pl-5 font-medium">User</th><th className="font-medium">Team</th><th className="font-medium">Role</th><th className="font-medium">Status</th><th className="pr-5 text-right font-medium">2FA</th></tr></thead>
                  <tbody>{reps.map((r) => (
                    <tr key={r.id} className="h-14 border-b border-line/70 last:border-0">
                      <td className="pl-5"><div className="flex items-center gap-2.5"><Avatar name={r.name} hue={r.hue} size={30} presence={r.presence} /><div><div className="font-medium">{r.name}{r.id === ME && <span className="ml-1.5 text-xs text-faint">(you)</span>}</div><div className="text-xs text-muted">{r.email}</div></div></div></td>
                      <td className="text-fg-2">{r.team}</td>
                      <td><Select size="sm" value={r.role} onChange={(v) => { updateRep(r.id, { role: v }); toast({ tone: 'success', title: 'Role updated', body: `${r.name} is now ${v}` }); }} options={ROLES.map((x) => ({ value: x, label: x }))} className="!w-44" /></td>
                      <td><Badge tone={r.presence === 'offline' ? 'neutral' : 'success'} dot>{r.presence === 'offline' ? 'Inactive today' : 'Active'}</Badge></td>
                      <td className="pr-5 text-right">{r.role === 'SDR' ? <Badge tone="warning">Pending</Badge> : <Badge tone="success"><Lock className="size-3" />On</Badge>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Section>
          )}

          {sec === 'roles' && (
            <Section title="Roles & permissions" desc="Control what each role can see and do. Changes apply instantly to every panel." action={<Button size="sm" variant="ghost" onClick={() => { useSession.getState().resetMatrix(); toast({ title: 'Permissions reset to defaults' }); }}>Reset defaults</Button>}>
              <div className="-mx-5 -my-5 scroll-x">
                <table className="w-full min-w-[640px] text-[13px]">
                  <thead className="border-b bg-surface-2"><tr><th className="h-10 pl-5 text-left text-[11.5px] font-medium text-muted">Permission</th>{ROLES.map((r) => <th key={r} className="px-3 text-center text-[11.5px] font-medium text-muted">{r}<div className="font-normal text-faint">{reps.filter((x) => x.role === r).length} users</div></th>)}</tr></thead>
                  <tbody>{PERMISSIONS.map((p) => (
                    <tr key={p.key} className="h-14 border-b border-line/70 last:border-0">
                      <td className="pl-5"><div className="font-medium text-fg-2">{p.label}</div><div className="text-[11px] text-faint">{p.desc}</div></td>
                      {ROLES.map((r) => (
                        <td key={r} className="text-center"><div className="flex justify-center"><Switch size="sm" checked={r === 'Admin' || matrix[r][p.key]} onChange={(v) => { if (r === 'Admin') { toast({ title: 'Admins always have full access' }); return; } setPerm(r, p.key, v); toast({ title: `${r}: ${p.label} ${v ? 'enabled' : 'disabled'}`, body: 'Applies instantly — switch panels with “View as” to see it.' }); }} /></div></td>
                      ))}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Section>
          )}

          {sec === 'pipeline' && (
            <Section title="Pipeline stages" desc="Stages and win probabilities drive the weighted forecast." action={<Button variant="primary" size="sm" onClick={save}>Save</Button>}>
              <div className="space-y-2">
                {stages.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl bg-surface p-2.5 shadow-[0_0_0_1px_rgb(var(--line-strong))]">
                    <GripVertical className="size-4 cursor-grab text-faint" />
                    <span className="size-3 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 text-[13px] font-medium">{s.id}</span>
                    <span className="text-xs text-muted">Win probability</span>
                    <div className="relative w-20"><Input type="number" value={probs[i]} onChange={(e) => setProbs(probs.map((p, j) => (j === i ? Number(e.target.value) : p)))} disabled={s.id.startsWith('Closed')} className="pr-6 text-right" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-faint">%</span></div>
                  </div>
                ))}
                <Button size="sm" variant="ghost" icon={<Plus />} onClick={() => toast({ title: 'Stage added', body: 'Drag to reorder' })}>Add stage</Button>
              </div>
            </Section>
          )}

          {sec === 'calling' && (
            <>
              <TelephonySettings />
              <Section title="Call settings" desc="Applies to the whole team, on any provider.">
                <Row icon={<Mic />} title="Record calls automatically" desc="Recordings are stored for 12 months and attached to the timeline."><Switch checked={prefs.recordCalls} onChange={(v) => prefs.set({ recordCalls: v })} /></Row>
                <Row icon={<Sparkles />} title="Live transcription & Vico AI" desc="Real-time transcript, talk-ratio and next-step suggestions during calls."><Switch checked={prefs.liveTranscript} onChange={(v) => prefs.set({ liveTranscript: v })} /></Row>
                <Row icon={<MapPin />} title="Local presence dialing" desc="Show a local caller ID matching the prospect’s area code."><Switch checked onChange={() => toast({ title: 'Local presence is included in your plan' })} /></Row>
                <Row icon={<Voicemail />} title="Voicemail drop" desc="Leave a pre-recorded voicemail with one click."><Switch checked onChange={() => {}} /></Row>
                <Row icon={<ShieldCheck />} title="Recording consent message" desc="Plays “This call may be recorded for quality purposes.”"><Switch checked onChange={() => {}} /></Row>
              </Section>
            </>
          )}

          {sec === 'notifications' && (
            <Section title="Notifications" desc="Choose what you hear about, and where.">
              {([['deal', 'Deal stage changes', 'When deals you own or follow move stage'], ['missed', 'Missed calls & voicemails', 'Instant push + desktop notification'], ['assigned', 'New lead assigned', 'When a lead is routed to you'], ['mention', 'Mentions', 'When someone @mentions you in a note'], ['task', 'Task reminders', '15 minutes before a task is due'], ['digest', 'Weekly performance digest', 'Every Monday at 8:00 AM']] as const).map(([k, t, d]) => (
                <Row key={k} title={t} desc={d}><Switch checked={notif[k]} onChange={(v) => setNotif({ ...notif, [k]: v })} /></Row>
              ))}
            </Section>
          )}

          {sec === 'whatsapp' && <WhatsAppSettings />}

          {sec === 'integrations' && (
            <>
            <Section title="Messaging" desc="WhatsApp without the Meta Business API.">
              <div className="flex flex-wrap items-center gap-3 rounded-xl p-4 shadow-[0_0_0_1px_rgb(var(--line-strong))]">
                <ScriwoMark size={36} />
                <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold">WhatsApp via Scriwo</div><div className="text-xs text-muted">Your own numbers, linked by QR · chats, broadcasts & timeline sync</div></div>
                {wa.connected ? <Badge tone="success" dot>Connected</Badge> : <span className="text-xs text-faint">Not connected</span>}
                <Button size="xs" variant={wa.connected ? 'ghost' : 'secondary'} onClick={() => (wa.connected ? setSec('whatsapp') : wa.set({ wizard: true }))}>{wa.connected ? 'Manage' : 'Connect'}</Button>
              </div>
            </Section>
            <Section title="Telephony" desc="Bring your own carrier and numbers — guided setup, no code.">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {PROVIDERS.map((x) => {
                  const on = tel.provider === x.id;
                  return (
                    <div key={x.id} className={cn('flex flex-col rounded-xl p-4', on ? 'shadow-[0_0_0_1.5px_rgb(var(--success)/.6)]' : 'shadow-[0_0_0_1px_rgb(var(--line-strong))]')}>
                      <div className="flex items-center gap-3">
                        <ProviderMark p={x} />
                        <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold">{x.name}</div><div className="truncate text-xs text-muted">{x.tagline}</div></div>
                        <Badge>{x.region}</Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        {on ? <Badge tone="success" dot>Connected</Badge> : <span className="text-xs text-faint">{tel.provider ? 'Switch provider' : 'Not connected'}</span>}
                        <Button size="xs" variant={on ? 'ghost' : 'secondary'} onClick={() => tel.openWizard(x.id)}>{on ? 'Manage' : 'Connect'}</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
            <Section title="Apps" desc="Connect the tools your team already uses.">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Object.entries(integ).map(([name, on], i) => (
                  <div key={name} className="flex flex-col rounded-xl p-4 shadow-[0_0_0_1px_rgb(var(--line-strong))]">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: `hsl(${(i * 67 + 210) % 360} 55% 50%)` }}>{name[0]}</span>
                      <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold">{name}</div><div className="text-xs text-muted">{['Email sync & tracking', 'Meeting scheduling', 'Deal alerts in channels', 'Video meetings', 'Video meetings', 'Workflow automation', 'Prospect enrichment', 'E-signatures'][i]}</div></div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      {on ? <Badge tone="success" dot>Connected</Badge> : <span className="text-xs text-faint">Not connected</span>}
                      <Button size="xs" variant={on ? 'ghost' : 'secondary'} onClick={() => { setInteg({ ...integ, [name]: !on }); toast({ tone: on ? 'default' : 'success', title: on ? `${name} disconnected` : `${name} connected` }); }}>{on ? 'Disconnect' : 'Connect'}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
