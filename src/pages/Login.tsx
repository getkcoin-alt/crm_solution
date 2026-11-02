import { useState } from 'react';
import { ArrowRight, Sparkles, PhoneCall, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { PERSONAS, useSession } from '@/store/session';
import { useCRM } from '@/store/crm';
import { Logo } from '@/components/layout/Sidebar';
import { PersonaList, switchPersona } from '@/components/layout/ViewAs';
import { Button } from '@/components/ui/primitives';
import { Field, Input } from '@/components/ui/form';
import { toast } from '@/store/ui';
import { Toaster } from '@/components/shared';

export default function Login() {
  const current = useSession((s) => s.viewAs);
  const reps = useCRM((s) => s.reps);
  const [email, setEmail] = useState(PERSONAS.find((p) => p.repId === current)?.email ?? PERSONAS[0]!.email);
  const [pw, setPw] = useState('demo-password');
  const [show, setShow] = useState(false);
  const signIn = () => {
    const p = PERSONAS.find((x) => x.email === email.trim().toLowerCase());
    if (!p) { toast({ tone: 'danger', title: 'Unknown demo account', body: 'Pick one of the demo panels on the right.' }); return; }
    switchPersona(p.repId);
  };

  return (
    <div className="flex min-h-full bg-bg">
      <div className="relative hidden w-[46%] overflow-hidden bg-[#0d0e14] p-10 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_10%_0%,rgb(88_86_238/.45),transparent_60%),radial-gradient(60%_50%_at_100%_100%,rgb(139_108_246/.25),transparent_60%)]" />
        <div className="relative [&_div]:text-white"><Logo /></div>
        <div className="relative mt-auto max-w-md">
          <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.03em]">Every call, lead and deal — in one place.</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/65">leadVico is the sales CRM with calling built in. Dial from any record, record and transcribe automatically, and let Vico AI tell you who to call next.</p>
          <div className="mt-8 space-y-3 text-sm text-white/80">
            <div className="flex items-center gap-3"><PhoneCall className="size-4 text-[#9d9bff]" />Click-to-call with Exotel, Knowlarity, MyOperator, Plivo, Twilio & Vonage</div>
            <div className="flex items-center gap-3"><Sparkles className="size-4 text-[#9d9bff]" />Vico AI transcripts, summaries & live coaching</div>
            <div className="flex items-center gap-3"><ShieldCheck className="size-4 text-[#9d9bff]" />Role-based panels for admins, managers, AEs & SDRs</div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[420px] animate-slide-up">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em]">Sign in to leadVico</h2>
          <p className="mt-1 text-[13px] text-muted">Demo workspace · choose a panel or sign in with a demo account.</p>

          <div className="mt-6 rounded-xl bg-surface p-2 shadow-card">
            <div className="eyebrow px-2 pb-1 pt-1.5">Demo panels</div>
            <PersonaList onPick={(id) => switchPersona(id)} />
          </div>

          <div className="my-6 flex items-center gap-3 text-[11px] font-medium text-faint"><span className="h-px flex-1 bg-line" />OR<span className="h-px flex-1 bg-line" /></div>

          <form onSubmit={(e) => { e.preventDefault(); signIn(); }} className="space-y-3">
            <Field label="Work email"><Input value={email} onChange={(e) => setEmail(e.target.value)} list="demo-emails" /></Field>
            <datalist id="demo-emails">{PERSONAS.map((p) => <option key={p.email} value={p.email}>{reps.find((r) => r.id === p.repId)?.role}</option>)}</datalist>
            <Field label="Password">
              <div className="relative">
                <Input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} className="pr-9" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-faint hover:text-fg">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
              </div>
            </Field>
            <Button type="submit" variant="primary" size="lg" className="w-full" iconRight={<ArrowRight />}>Sign in</Button>
          </form>
          <p className="mt-6 text-center text-[11.5px] text-faint">Demo environment · sample data resets on reload · <a href="/__auth/logout" className="font-medium text-muted hover:text-fg hover:underline">Log out of demo</a></p>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
