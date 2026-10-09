import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react';
import type { Designer } from '@/hooks/use-designer';
import { FONTS, SWATCHES, r2 } from '@/lib/decal';
import { NumField } from '@/components/num-field';
import { Panel } from '@/components/panel';

const ib = 'flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs transition-all hover:-translate-y-px hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40';

export function PropertiesPanel({ d }: { d: Designer }) {
  const s = d.selected;
  const idx = s ? d.doc.els.findIndex((e) => e.id === s.id) : -1;
  return (
    <Panel step="3" title="Adjust selection" testId="panel-properties">
      {!s ? (
        <p className="text-sm text-muted-foreground" data-testid="text-no-selection">
          Nothing selected. Click an element on the canvas, or pick a layer below. Drag to move; use the corner squares to resize and the circle to rotate.
        </p>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="eyebrow mb-1 block">Layer name</span>
            <input data-testid="input-name" value={s.name} onFocus={() => d.snapshot()} onChange={(e) => d.live(s.id, { name: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm" />
          </label>
          {s.kind === 'text' && (
            <>
              <label className="block">
                <span className="eyebrow mb-1 block">Text</span>
                <input id="prop-text" data-testid="input-text-content" value={s.text ?? ''} onFocus={() => d.snapshot()}
                  onChange={(e) => d.live(s.id, { text: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm" />
              </label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <label className="block">
                  <span className="eyebrow mb-1 block">Font</span>
                  <select data-testid="select-font" value={s.font} onChange={(e) => d.update(s.id, { font: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm">
                    {FONTS.map((f) => <option key={f.label} value={f.css}>{f.label}</option>)}
                  </select>
                </label>
                <button type="button" data-testid="button-bold" aria-pressed={(s.weight ?? 700) >= 700}
                  onClick={() => d.update(s.id, { weight: (s.weight ?? 700) >= 700 ? 400 : 700 })}
                  className={`mt-5 rounded-md border px-3 text-sm font-bold transition-colors ${(s.weight ?? 700) >= 700 ? 'border-primary bg-primary text-primary-foreground' : ''}`}>B</button>
              </div>
            </>
          )}
          {s.kind !== 'image' && (
            <div>
              <span className="eyebrow mb-1.5 block">Colour</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {SWATCHES.map((c) => (
                  <button key={c} type="button" aria-label={`Colour ${c}`} data-testid={`swatch-${c.slice(1)}`} onClick={() => d.update(s.id, { fill: c })}
                    style={{ background: c }} className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${s.fill.toLowerCase() === c ? 'ring-2 ring-ring ring-offset-2' : ''}`} />
                ))}
                <input type="color" aria-label="Custom colour" data-testid="input-color" value={s.fill} onChange={(e) => d.update(s.id, { fill: e.target.value })} className="h-6 w-8 cursor-pointer rounded border bg-transparent p-0" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <NumField label="Width" suffix="cm" value={r2(s.w)} min={0.5} testId="input-el-width"
              onCommit={(v) => d.update(s.id, s.kind !== 'text' && s.kind !== 'image' ? { w: v } : { w: v, h: r2((s.h * v) / s.w), ...(s.kind === 'text' ? { fontSize: r2(((s.fontSize ?? 5) * v) / s.w) } : {}) })} />
            <NumField label="Height" suffix="cm" value={r2(s.h)} min={0.5} testId="input-el-height"
              onCommit={(v) => d.update(s.id, s.kind !== 'text' && s.kind !== 'image' ? { h: v } : { h: v, w: r2((s.w * v) / s.h), ...(s.kind === 'text' ? { fontSize: r2(((s.fontSize ?? 5) * v) / s.h) } : {}) })} />
            <NumField label="Rotate" suffix="deg" value={r2(s.rot)} step={5} testId="input-el-rotation"
              onCommit={(v) => d.update(s.id, { rot: ((v % 360) + 360) % 360 })} />
          </div>
          <div className="flex gap-2">
            <button type="button" className={ib} onClick={() => d.duplicate(s.id)} data-testid="button-duplicate"><Copy className="h-3.5 w-3.5" aria-hidden />Duplicate</button>
            <button type="button" className={ib} onClick={() => d.reorder(s.id, 1)} disabled={idx >= d.doc.els.length - 1} data-testid="button-bring-forward" aria-label="Bring forward"><ArrowUp className="h-3.5 w-3.5" aria-hidden /></button>
            <button type="button" className={ib} onClick={() => d.reorder(s.id, -1)} disabled={idx <= 0} data-testid="button-send-backward" aria-label="Send backward"><ArrowDown className="h-3.5 w-3.5" aria-hidden /></button>
            <button type="button" className={ib + ' hover:!border-destructive hover:!text-destructive'} onClick={() => d.remove(s.id)} data-testid="button-delete" aria-label="Delete element"><Trash2 className="h-3.5 w-3.5" aria-hidden /></button>
          </div>
        </div>
      )}
      <div>
        <span className="eyebrow mb-1.5 block">Layers (top first)</span>
        {d.doc.els.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground" data-testid="text-empty-layers">The canvas is empty. Add text, a shape or an image to begin.</p>
        ) : (
          <ul className="space-y-1" data-testid="list-layers">
            {d.doc.els.slice().reverse().map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => d.select(e.id)} data-testid={`layer-${e.id}`}
                  className={`flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors ${e.id === d.selId ? 'border-primary bg-accent text-accent-foreground' : 'hover:bg-muted'}`}>
                  <span className="truncate">{e.kind === 'text' ? (e.text || 'Text') : e.name}</span>
                  <span className="ml-2 font-mono text-[10px] uppercase text-muted-foreground">{e.kind}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
