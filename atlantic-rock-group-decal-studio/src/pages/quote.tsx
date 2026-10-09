import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { Check, Copy, Download, ExternalLink } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/site-header';
import { CONFIG } from '@/config';
import { validateUpload } from '@/hooks/use-designer';
import { useToast } from '@/hooks/use-toast';
import { downloadBlob, exportSvg, fileBase, loadDoc, orderSummary, svgToPng } from '@/lib/decal';

const TYPES = ['Vehicle lettering', 'Door or panel logo', 'Windshield banner', 'Stripes or graphic', 'Custom artwork', 'Other'];
const COLOURS = ['White', 'Black', 'Grey', 'Blue', 'Red', 'Yellow', 'Other (describe in notes)'];
const SURFACES = ['Painted body panel', 'Window glass', 'Bumper or plastic trim', 'Trailer or box side', 'Other'];

const field = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/40';

export default function QuotePage() {
  const { toast } = useToast();
  const doc = useMemo(() => loadDoc(), []);
  const [f, setF] = useState({
    name: '', email: '', phone: '', type: TYPES[0], dims: doc ? `${doc.widthCm} x ${doc.heightCm} cm` : '',
    colour: COLOURS[0], qty: '1', surface: SURFACES[0], install: 'no', notes: '', consent: false,
  });
  const [files, setFiles] = useState<string[]>([]);
  const [fileErr, setFileErr] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Enter a valid email address.';
    if (f.phone && !/^[0-9+()\-.\s]{7,20}$/.test(f.phone)) e.phone = 'Phone number looks invalid.';
    if (!f.dims.trim()) e.dims = 'Enter the dimensions you need, for example 60 x 20 cm.';
    if (!(Number(f.qty) >= 1 && Number.isInteger(Number(f.qty)))) e.qty = 'Quantity must be a whole number, 1 or more.';
    if (!f.consent) e.consent = 'Please confirm to continue.';
    setErrs(e); return Object.keys(e).length === 0;
  };
  const summary = () => [
    'ATLANTIC ROCK GROUP - QUOTE PREPARATION SUMMARY', '(Prepared in the browser. Nothing has been submitted.)', '',
    `Name: ${f.name}`, `Email: ${f.email}`, `Phone: ${f.phone || 'not provided'}`, '',
    `Decal type: ${f.type}`, `Dimensions: ${f.dims}`, `Vinyl colour: ${f.colour}`, `Quantity: ${f.qty}`,
    `Application surface: ${f.surface}`, `Installation requested: ${f.install === 'yes' ? 'Yes' : 'No'}`,
    `Notes: ${f.notes || 'none'}`, `Artwork files to attach: ${files.length ? files.join(', ') : 'none selected'}`,
    ...(doc ? ['', orderSummary(doc)] : []),
  ].join('\n');

  const onFile = (list: FileList | null) => {
    setFileErr(''); if (!list) return;
    const names: string[] = [];
    for (const file of Array.from(list)) {
      const err = validateUpload(file);
      if (err) { setFileErr(file.name + ': ' + err); setFiles([]); if (fileRef.current) fileRef.current.value = ''; return; }
      names.push(file.name);
    }
    setFiles(names);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(summary()); setCopied(true); setTimeout(() => setCopied(false), 2000); toast({ title: 'Summary copied' }); }
    catch { toast({ title: 'Copy blocked by the browser', description: 'Use Download summary instead.', variant: 'destructive' }); }
  };
  const dl = () => downloadBlob(new Blob([summary()], { type: 'text/plain' }), 'atlantic-quote-summary.txt');
  const open = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast({ title: 'Check the highlighted fields', variant: 'destructive' }); return; }
    window.open(CONFIG.QUOTE_URL, '_blank', 'noopener,noreferrer');
  };
  const artwork = async (kind: 'svg' | 'png') => {
    if (!doc || !doc.els.length) return;
    try {
      if (kind === 'svg') downloadBlob(new Blob([exportSvg(doc)], { type: 'image/svg+xml' }), fileBase(doc) + '.svg');
      else downloadBlob(await svgToPng(doc, 'transparent'), fileBase(doc) + '-transparent.png');
    } catch { toast({ title: 'Export failed', variant: 'destructive' }); }
  };
  const Err = ({ k }: { k: string }) => errs[k] ? <p className="mt-1 text-xs text-destructive" role="alert" data-testid={`error-${k}`}>{errs[k]}</p> : null;
  const L = ({ t, children, id }: { t: string; children: React.ReactNode; id: string }) => (
    <label htmlFor={id} className="block"><span className="eyebrow mb-1 block">{t}</span>{children}</label>
  );

  return (
    <div className="min-h-[100dvh]">
      <SiteHeader />
      <main className="mx-auto grid max-w-[1200px] gap-6 px-4 py-6 lg:grid-cols-[1fr_340px] lg:px-6">
        <form onSubmit={open} noValidate className="rise space-y-5" data-testid="form-quote">
          <div>
            <p className="eyebrow">Step 5 - Prepare your quote</p>
            <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl" data-testid="text-quote-title">Quote preparation</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">Fill this in so your details are ready, then continue to the official quote page. This page sends nothing by itself and gives no price.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <L t="Full name" id="q-name"><input id="q-name" data-testid="input-name" className={field} value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" /><Err k="name" /></L>
            <L t="Email" id="q-email"><input id="q-email" data-testid="input-email" type="email" className={field} value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" /><Err k="email" /></L>
            <L t="Phone (optional)" id="q-phone"><input id="q-phone" data-testid="input-phone" type="tel" className={field} value={f.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" /><Err k="phone" /></L>
            <L t="Decal type" id="q-type"><select id="q-type" data-testid="select-type" className={field} value={f.type} onChange={(e) => set('type', e.target.value)}>{TYPES.map((x) => <option key={x}>{x}</option>)}</select></L>
            <L t="Dimensions" id="q-dims"><input id="q-dims" data-testid="input-dimensions" className={field} value={f.dims} onChange={(e) => set('dims', e.target.value)} placeholder="60 x 20 cm" /><Err k="dims" /></L>
            <L t="Preferred vinyl colour" id="q-colour"><select id="q-colour" data-testid="select-colour" className={field} value={f.colour} onChange={(e) => set('colour', e.target.value)}>{COLOURS.map((x) => <option key={x}>{x}</option>)}</select></L>
            <L t="Quantity" id="q-qty"><input id="q-qty" data-testid="input-quantity" type="number" min={1} step={1} className={field} value={f.qty} onChange={(e) => set('qty', e.target.value)} /><Err k="qty" /></L>
            <L t="Application surface" id="q-surface"><select id="q-surface" data-testid="select-surface" className={field} value={f.surface} onChange={(e) => set('surface', e.target.value)}>{SURFACES.map((x) => <option key={x}>{x}</option>)}</select></L>
          </div>
          <fieldset>
            <legend className="eyebrow mb-1">Installation by Atlantic Rock Group</legend>
            <div className="flex gap-2">
              {['yes', 'no'].map((v) => (
                <label key={v} className={`flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors ${f.install === v ? 'border-primary bg-accent' : 'hover:bg-muted'}`}>
                  <input type="radio" name="install" value={v} checked={f.install === v} onChange={() => set('install', v)} data-testid={`radio-install-${v}`} className="accent-[hsl(214_52%_28%)]" />
                  {v === 'yes' ? 'Yes, please' : 'No, I will apply it'}
                </label>
              ))}
            </div>
          </fieldset>
          <L t="Notes" id="q-notes"><textarea id="q-notes" data-testid="input-notes" rows={4} className={field} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Vehicle make and model, fonts, deadlines, anything we should know." /></L>
          <div className="rounded-lg border bg-accent/50 p-4">
            <p className="text-sm font-semibold" data-testid="text-attach-instruction">Download your artwork first, then attach it on the quote page.</p>
            <p className="mt-1 text-xs text-muted-foreground">Browsers cannot pass files to another website, so pick your file here to record its name in the summary, then attach it again on the official page. Accepted: SVG, PNG, JPG up to {Math.round(CONFIG.MAX_UPLOAD_BYTES / 1048576)} MB.</p>
            <input ref={fileRef} type="file" multiple accept={CONFIG.ACCEPT_ATTR} onChange={(e) => onFile(e.target.files)} data-testid="input-artwork" aria-label="Artwork attachment" className="mt-3 block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm" />
            {fileErr && <p className="mt-1 text-xs text-destructive" role="alert" data-testid="error-artwork">{fileErr}</p>}
            {files.length > 0 && <p className="mt-1 font-mono text-xs" data-testid="text-artwork-files">{files.join(', ')}</p>}
          </div>
          <div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} data-testid="checkbox-consent" className="mt-1 h-4 w-4 accent-[hsl(214_52%_28%)]" />
              <span>I understand this form only prepares my details. I will submit my request and artwork myself on the Atlantic Rock Group quote page, and that my design is a preview pending confirmation.</span>
            </label>
            <Err k="consent" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" data-testid="button-open-quote" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-px hover:shadow-md active:translate-y-0">
              Open official quote page <ExternalLink className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" onClick={() => void copy()} data-testid="button-copy-summary" className="inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-all hover:-translate-y-px hover:border-primary">
              {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} Copy summary
            </button>
            <button type="button" onClick={dl} data-testid="button-download-summary" className="inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-all hover:-translate-y-px hover:border-primary">
              <Download className="h-4 w-4" aria-hidden /> Download summary
            </button>
          </div>
          <p className="text-xs text-muted-foreground" data-testid="text-no-submission">Nothing has been sent. The button opens an external page in a new tab where you complete your request.</p>
        </form>

        <aside className="space-y-4 lg:pt-24">
          <section className="rounded-lg border bg-card p-4 shadow-sm" data-testid="panel-saved-design">
            <h2 className="text-[15px] font-bold">Your saved design</h2>
            {doc && doc.els.length ? (
              <>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{doc.widthCm} x {doc.heightCm} cm, {doc.els.length} element{doc.els.length === 1 ? '' : 's'}</p>
                <p className="mt-2 text-xs text-muted-foreground">Preview files only; not confirmed cut-ready data.</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => void artwork('svg')} data-testid="button-quote-download-svg" className="flex-1 rounded-md border px-3 py-2 text-sm hover:border-primary">SVG</button>
                  <button type="button" onClick={() => void artwork('png')} data-testid="button-quote-download-png" className="flex-1 rounded-md border px-3 py-2 text-sm hover:border-primary">Transparent PNG</button>
                </div>
              </>
            ) : <p className="mt-1 text-sm text-muted-foreground" data-testid="text-no-design">No design saved in this browser yet.</p>}
            <Link href="/" data-testid="link-back-designer" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Back to the designer</Link>
          </section>
          <section className="rounded-lg border p-4 text-xs leading-relaxed text-muted-foreground">
            <h2 className="mb-1 text-[15px] font-bold text-foreground">How the handoff works</h2>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Download your artwork from the designer.</li>
              <li>Complete this form and copy or download the summary.</li>
              <li>Open the official quote page and paste the summary.</li>
              <li>Attach your artwork there. Atlantic Rock Group reviews it and replies.</li>
            </ol>
          </section>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}
