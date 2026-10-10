import { useEffect, useState } from 'react';

interface Props { label: string; value: number; onCommit: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string; testId: string; id?: string }

export function NumField({ label, value, onCommit, min, max, step = 0.5, suffix, testId, id }: Props) {
  const [s, setS] = useState(String(value));
  useEffect(() => setS(String(Math.round(value * 100) / 100)), [value]);
  const fid = id ?? testId;
  const commit = () => {
    const n = Number(s);
    if (!Number.isFinite(n) || s.trim() === '') { setS(String(value)); return; }
    const c = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
    setS(String(c)); if (c !== value) onCommit(c);
  };
  return (
    <label htmlFor={fid} className="block">
      <span className="eyebrow mb-1 block">{label}</span>
      <span className="flex items-center rounded-md border border-input bg-background transition-shadow focus-within:ring-2 focus-within:ring-ring/40">
        <input id={fid} data-testid={testId} type="number" inputMode="decimal" value={s} step={step} min={min} max={max}
          onChange={(e) => setS(e.target.value)} onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') { commit(); (e.target as HTMLInputElement).blur(); } }}
          className="w-full min-w-0 bg-transparent px-2.5 py-1.5 font-mono text-sm outline-none" />
        {suffix && <span className="pr-2.5 font-mono text-xs text-muted-foreground">{suffix}</span>}
      </span>
    </label>
  );
}
