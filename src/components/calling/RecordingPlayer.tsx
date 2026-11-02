import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, Download, Gauge, Lock } from 'lucide-react';
import { useCan } from '@/lib/access';
import { ME } from '@/store/crm';
import { cn, duration } from '@/lib/utils';
import { toast } from '@/store/ui';

/** Simulated call-recording player with a deterministic waveform. */
export function RecordingPlayer(props: { seed: string; length: number; compact?: boolean; ownerId?: string }) {
  const can = useCan();
  if (props.ownerId && props.ownerId !== ME && !can('recordings')) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-sunken px-3 py-2.5 text-xs text-muted shadow-[inset_0_0_0_1px_rgb(var(--line))]">
        <Lock className="size-3.5 shrink-0" />Recording restricted — your role can only play your own calls.
      </div>
    );
  }
  return <Player {...props} />;
}

function Player({ seed, length, compact }: { seed: string; length: number; compact?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [speed, setSpeed] = useState(1);
  const bars = useMemo(() => {
    let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return Array.from({ length: compact ? 48 : 72 }, (_, i) => { h = (h * 1103515245 + 12345) >>> 0; const base = (h % 1000) / 1000; return 0.15 + Math.abs(Math.sin(i / 4)) * 0.35 + base * 0.5; });
  }, [seed, compact]);
  useEffect(() => {
    if (!playing) return;
    const i = setInterval(() => setPos((p) => { const n = p + 0.25 * speed; if (n >= length) { setPlaying(false); return length; } return n; }), 250);
    return () => clearInterval(i);
  }, [playing, length, speed]);
  const prog = pos / length;
  return (
    <div className={cn('flex items-center gap-3 rounded-xl bg-sunken px-2.5 py-2 shadow-[inset_0_0_0_1px_rgb(var(--line))]', compact && 'py-1.5')}>
      <button onClick={() => { if (pos >= length) setPos(0); setPlaying(!playing); }} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fg text-bg transition hover:scale-105">
        {playing ? <Pause className="size-3.5 fill-current" /> : <Play className="ml-0.5 size-3.5 fill-current" />}
      </button>
      <div
        className="flex h-8 flex-1 cursor-pointer items-center gap-[2px]"
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos(((e.clientX - r.left) / r.width) * length); }}
      >
        {bars.map((b, i) => (
          <span key={i} className={cn('flex-1 rounded-full transition-colors', i / bars.length <= prog ? 'bg-brand' : 'bg-line-strong')} style={{ height: `${b * 100}%` }} />
        ))}
      </div>
      <span className="num w-[76px] shrink-0 text-right text-[11px] text-muted">{duration(pos)} / {duration(length)}</span>
      {!compact && (
        <>
          <button onClick={() => setSpeed(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1)} className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold text-muted hover:bg-line"><Gauge className="size-3" />{speed}×</button>
          <button onClick={() => toast({ title: 'Recording downloaded', body: `call-${seed}.mp3` })} className="rounded-md p-1 text-muted hover:bg-line hover:text-fg"><Download className="size-3.5" /></button>
        </>
      )}
    </div>
  );
}
