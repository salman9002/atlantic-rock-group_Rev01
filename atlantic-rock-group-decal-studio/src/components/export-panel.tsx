import { useState } from 'react';
import { AlertTriangle, FileImage, FileText, FileType2, Image as ImageIcon } from 'lucide-react';
import { Link } from 'wouter';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Designer } from '@/hooks/use-designer';
import { type Bg, downloadBlob, exportSvg, fileBase, orderSummary, svgToPng, validateDoc } from '@/lib/decal';
import { Panel } from '@/components/panel';

type Job = 'svg' | 'png' | 'preview' | 'summary';
const LABEL: Record<Job, string> = { svg: 'SVG', png: 'transparent PNG', preview: 'preview PNG', summary: 'order summary' };

export function ExportPanel({ d, bg }: { d: Designer; bg: Bg }) {
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const check = validateDoc(d.doc);

  const ask = (j: Job) => {
    if (check.errors.length) { toast({ title: 'Cannot export yet', description: check.errors[0], variant: 'destructive' }); return; }
    setAck(false); setJob(j);
  };
  const run = async () => {
    if (!job) return; setBusy(true);
    try {
      const base = fileBase(d.doc);
      if (job === 'svg') downloadBlob(new Blob([exportSvg(d.doc)], { type: 'image/svg+xml' }), base + '.svg');
      if (job === 'png') downloadBlob(await svgToPng(d.doc, 'transparent'), base + '-transparent.png');
      if (job === 'preview') downloadBlob(await svgToPng(d.doc, bg === 'transparent' ? 'white' : bg), base + '-preview.png');
      if (job === 'summary') downloadBlob(new Blob([orderSummary(d.doc)], { type: 'text/plain' }), base + '-summary.txt');
      toast({ title: 'Download started', description: `Your ${LABEL[job]} is downloading.` });
      setJob(null);
    } catch (e) {
      toast({ title: 'Export failed', description: e instanceof Error ? e.message : 'Please try again.', variant: 'destructive' });
    } finally { setBusy(false); }
  };
  const btn = (j: Job, Icon: typeof FileText, title: string, sub: string) => (
    <button type="button" onClick={() => ask(j)} data-testid={`button-export-${j}`}
      className="group flex items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-all hover:-translate-y-px hover:border-primary hover:shadow-sm active:translate-y-0">
      <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <span><span className="block text-sm font-semibold">{title}</span><span className="block text-xs text-muted-foreground">{sub}</span></span>
    </button>
  );
  return (
    <Panel step="4" title="Review and download" testId="panel-export">
      {check.errors.length > 0 && (
        <p className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2.5 text-xs text-destructive" role="alert" data-testid="text-export-errors">
          <AlertTriangle className="mt-px h-4 w-4 shrink-0" aria-hidden />{check.errors.join(' ')}
        </p>
      )}
      <div className="grid gap-2">
        {btn('svg', FileType2, 'SVG file', 'Vector text and shapes, images embedded')}
        {btn('png', ImageIcon, 'Transparent PNG', 'Artwork only, no background')}
        {btn('preview', FileImage, 'Preview PNG', 'Uses your chosen preview background')}
        {btn('summary', FileText, 'Order summary', 'Plain-text sizes and elements')}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Downloads are previews. Download your artwork first, then attach it on the quote page.
      </p>
      <Link href="/quote" data-testid="link-to-quote"
        className="flex items-center justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-px hover:shadow-md">
        Continue to quote preparation
      </Link>

      <Dialog open={job !== null} onOpenChange={(o) => !o && setJob(null)}>
        <DialogContent data-testid="dialog-export-confirm">
          <DialogHeader>
            <DialogTitle>Before you download</DialogTitle>
            <DialogDescription>Production confirmation: this is a design preview, not confirmed cut data.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>Size: <span className="font-mono">{d.doc.widthCm} x {d.doc.heightCm} cm</span>, {d.doc.els.length} element{d.doc.els.length === 1 ? '' : 's'}.</p>
            <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground" data-testid="list-export-warnings">
              <li>Regular text and raster images are not production-ready cut data. Atlantic Rock Group must confirm cuttability before anything is made.</li>
              {check.warnings.map((x) => <li key={x}>{x}</li>)}
            </ul>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} data-testid="checkbox-export-ack" className="mt-1 h-4 w-4 accent-[hsl(214_52%_28%)]" />
              <span>I understand this is a preview and that artwork will be reviewed before production.</span>
            </label>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setJob(null)} data-testid="button-export-cancel" className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
            <button type="button" disabled={!ack || busy} onClick={() => void run()} data-testid="button-export-confirm"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">
              {busy ? 'Preparing...' : `Download ${job ? LABEL[job] : ''}`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
