import { useState } from 'react';
import { Redo2, RotateCcw, Undo2 } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/site-header';
import { DecalCanvas } from '@/components/decal-canvas';
import { SizePanel, AddPanel } from '@/components/setup-panels';
import { PropertiesPanel } from '@/components/properties-panel';
import { ExportPanel } from '@/components/export-panel';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDesigner } from '@/hooks/use-designer';
import { type Bg, inches } from '@/lib/decal';

const BGS: { id: Bg; label: string }[] = [
  { id: 'transparent', label: 'Transparent' }, { id: 'white', label: 'White' }, { id: 'dark', label: 'Dark' },
];
const STEPS = ['Set the size', 'Add artwork', 'Adjust', 'Download', 'Prepare quote'];

export default function DesignerPage() {
  const d = useDesigner();
  const [bg, setBg] = useState<Bg>('transparent');
  const [confirmReset, setConfirmReset] = useState(false);
  const tool = 'inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm transition-all hover:-translate-y-px hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40';
  return (
    <div className="min-h-[100dvh] bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1500px] px-4 py-5 lg:px-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="rise">
            <p className="eyebrow">Vehicle lettering workshop - {'Newfoundland'}</p>
            <h1 className="mt-1 text-3xl font-extrabold text-foreground sm:text-4xl" data-testid="text-page-title">Design your own car decal</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">Compose lettering and artwork at real size, download your files, then prepare a quote. This is a preview tool; Atlantic Rock Group confirms everything before production.</p>
          </div>
          <ol className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground" aria-label="Steps" data-testid="list-steps">
            {STEPS.map((s, i) => <li key={s}><span className="text-primary">{i + 1}</span> {s}</li>)}
          </ol>
        </div>

        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
          <div className="order-2 space-y-4 lg:order-1">
            <SizePanel d={d} />
            <AddPanel d={d} />
          </div>

          <div className="order-1 min-w-0 space-y-3 lg:order-2">
            <div className="flex flex-wrap items-center gap-2" data-testid="toolbar">
              <button type="button" className={tool} onClick={d.undo} disabled={!d.canUndo} data-testid="button-undo"><Undo2 className="h-4 w-4" aria-hidden />Undo</button>
              <button type="button" className={tool} onClick={d.redo} disabled={!d.canRedo} data-testid="button-redo"><Redo2 className="h-4 w-4" aria-hidden />Redo</button>
              <button type="button" className={tool} onClick={() => setConfirmReset(true)} data-testid="button-reset"><RotateCcw className="h-4 w-4" aria-hidden />Reset</button>
              <div role="radiogroup" aria-label="Preview background" className="ml-auto inline-flex overflow-hidden rounded-md border">
                {BGS.map((b) => (
                  <button key={b.id} type="button" role="radio" aria-checked={bg === b.id} onClick={() => setBg(b.id)} data-testid={`button-bg-${b.id}`}
                    className={`px-3 py-1.5 text-xs transition-colors ${bg === b.id ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>{b.label}</button>
                ))}
              </div>
            </div>
            <DecalCanvas d={d} bg={bg} />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <p className="font-mono" data-testid="text-canvas-dimensions">
                {d.doc.widthCm} x {d.doc.heightCm} cm (approx. {inches(d.doc.widthCm)} x {inches(d.doc.heightCm)} in) - preview only
              </p>
              <p>Keys: arrows move, [ ] rotate, Delete removes, Ctrl+Z undo, Ctrl+D duplicate.</p>
            </div>
          </div>

          <div className="order-3 space-y-4">
            <PropertiesPanel d={d} />
            <ExportPanel d={d} bg={bg} />
          </div>
        </div>
      </main>
      <SiteFooter />

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent data-testid="dialog-reset">
          <DialogHeader>
            <DialogTitle>Reset the design?</DialogTitle>
            <DialogDescription>This restores the starter layout and size. You can undo it afterwards.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" className="rounded-md border px-4 py-2 text-sm hover:bg-muted" onClick={() => setConfirmReset(false)} data-testid="button-reset-cancel">Cancel</button>
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" data-testid="button-reset-confirm"
              onClick={() => { d.reset(); setConfirmReset(false); }}>Reset design</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
