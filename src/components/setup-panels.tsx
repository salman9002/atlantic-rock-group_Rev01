import { useRef, useState, type DragEvent } from 'react';
import { Circle, ImagePlus, Square, Star, Triangle, Type } from 'lucide-react';
import { CONFIG } from '@/config';
import type { Designer } from '@/hooks/use-designer';
import { PRESETS, inches } from '@/lib/decal';
import { useToast } from '@/hooks/use-toast';
import { NumField } from '@/components/num-field';
import { Panel } from '@/components/panel';

export function SizePanel({ d }: { d: Designer }) {
  const { doc } = d;
  return (
    <Panel step="1" title="Set the size" testId="panel-size">
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Width" value={doc.widthCm} min={CONFIG.MIN_CM} max={CONFIG.MAX_CM} step={1} suffix="cm" testId="input-width-cm" onCommit={(v) => d.setSize(v, doc.heightCm)} />
        <NumField label="Height" value={doc.heightCm} min={CONFIG.MIN_CM} max={CONFIG.MAX_CM} step={1} suffix="cm" testId="input-height-cm" onCommit={(v) => d.setSize(doc.widthCm, v)} />
      </div>
      <p className="font-mono text-xs text-muted-foreground" data-testid="text-approx-size">
        Approx. {inches(doc.widthCm)} x {inches(doc.heightCm)} in. Allowed {CONFIG.MIN_CM}-{CONFIG.MAX_CM} cm.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" onClick={() => d.setSize(p.w, p.h)} data-testid={`button-preset-${p.w}x${p.h}`}
            className="rounded-md border px-2.5 py-1 text-xs transition-all hover:-translate-y-px hover:border-primary hover:text-primary active:translate-y-0">
            {p.label} <span className="font-mono text-muted-foreground">{p.w}x{p.h}</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

export function AddPanel({ d }: { d: Designer }) {
  const { toast } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const handle = async (f?: File | null) => {
    if (!f) return;
    const err = await d.addImage(f);
    if (err) toast({ title: 'Upload not accepted', description: err, variant: 'destructive' });
    else toast({ title: 'Image added', description: f.name });
    if (input.current) input.current.value = '';
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); void handle(e.dataTransfer.files?.[0]); };
  const shape = (label: string, Icon: typeof Square, k: 'rect' | 'ellipse' | 'triangle' | 'star') => (
    <button key={k} type="button" onClick={() => d.addShape(k)} data-testid={`button-add-${k}`}
      className="flex flex-col items-center gap-1 rounded-md border py-2.5 text-xs transition-all hover:-translate-y-px hover:border-primary hover:bg-accent hover:text-primary active:translate-y-0">
      <Icon className="h-4 w-4" aria-hidden />{label}
    </button>
  );
  return (
    <Panel step="2" title="Add artwork" testId="panel-add">
      <button type="button" onClick={d.addText} data-testid="button-add-text"
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-px hover:shadow-md active:translate-y-0">
        <Type className="h-4 w-4" aria-hidden /> Add text
      </button>
      <div className="grid grid-cols-4 gap-2">
        {shape('Bar', Square, 'rect')}{shape('Oval', Circle, 'ellipse')}{shape('Triangle', Triangle, 'triangle')}{shape('Star', Star, 'star')}
      </div>
      <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}
        className={`rounded-md border border-dashed p-3 text-center transition-colors ${over ? 'border-primary bg-accent' : 'border-input'}`}>
        <button type="button" onClick={() => input.current?.click()} data-testid="button-upload"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ImagePlus className="h-4 w-4" aria-hidden /> Upload SVG, PNG or JPG
        </button>
        <p className="mt-1 text-xs text-muted-foreground">or drop a file here. Max {Math.round(CONFIG.MAX_UPLOAD_BYTES / 1048576)} MB.</p>
        <input ref={input} type="file" accept={CONFIG.ACCEPT_ATTR} className="sr-only" data-testid="input-upload" aria-label="Upload artwork file"
          onChange={(e) => void handle(e.target.files?.[0])} />
      </div>
    </Panel>
  );
}
