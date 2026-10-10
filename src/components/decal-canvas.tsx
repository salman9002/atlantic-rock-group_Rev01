import { createElement, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPE, type ReactNode } from 'react';
import type { Designer } from '@/hooks/use-designer';
import { type Bg, type El, nodeOf, r2, transformOf } from '@/lib/decal';

type Drag = { mode: 'move' | 'resize' | 'rotate'; id: string; start: El; dx: number; dy: number };
const camel = (k: string) => (k.includes('-') ? k.replace(/-(\w)/g, (_, c: string) => c.toUpperCase()) : k);

export function DecalCanvas({ d, bg }: { d: Designer; bg: Bg }) {
  const { doc, selected } = d;
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [k, setK] = useState(0.1);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const measure = () => { const a = svg.getScreenCTM()?.a; if (a) setK(1 / a); };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(svg);
    return () => ro.disconnect();
  }, [doc.widthCm, doc.heightCm]);

  const m = Math.max(doc.widthCm, doc.heightCm) * 0.06;
  const cell = Math.max(doc.widthCm, doc.heightCm) / 48;
  const pt = (e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current!; const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM()!.inverse());
  };
  const begin = (e: RPE, el: El, mode: Drag['mode']) => {
    e.stopPropagation(); d.select(el.id); d.snapshot();
    const p = pt(e); drag.current = { mode, id: el.id, start: el, dx: p.x - el.x, dy: p.y - el.y };
    svgRef.current?.setPointerCapture(e.pointerId); wrapRef.current?.focus({ preventScroll: true });
  };
  const onMove = (e: RPE) => {
    const g = drag.current; if (!g) return;
    const p = pt(e); const s = g.start;
    if (g.mode === 'move') { d.live(g.id, { x: r2(p.x - g.dx), y: r2(p.y - g.dy) }); return; }
    const vx = p.x - s.x; const vy = p.y - s.y;
    if (g.mode === 'rotate') {
      let a = (Math.atan2(vy, vx) * 180) / Math.PI + 90; if (e.shiftKey) a = Math.round(a / 15) * 15;
      d.live(g.id, { rot: r2(((a % 360) + 360) % 360) }); return;
    }
    const r = (s.rot * Math.PI) / 180;
    const lx = Math.abs(vx * Math.cos(r) + vy * Math.sin(r)); const ly = Math.abs(-vx * Math.sin(r) + vy * Math.cos(r));
    if (s.kind === 'text' || s.kind === 'image' || e.shiftKey) {
      const f = Math.max(0.05, Math.max(lx / (s.w / 2), ly / (s.h / 2)));
      d.live(g.id, s.kind === 'text' ? { w: r2(s.w * f), h: r2(s.h * f), fontSize: r2((s.fontSize ?? 5) * f) } : { w: r2(s.w * f), h: r2(s.h * f) });
    } else d.live(g.id, { w: r2(Math.max(0.5, lx * 2)), h: r2(Math.max(0.5, ly * 2)) });
  };
  const end = () => { drag.current = null; };

  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
    const mod = e.ctrlKey || e.metaKey; const key = e.key.toLowerCase();
    if (mod && key === 'z') { e.preventDefault(); e.shiftKey ? d.redo() : d.undo(); return; }
    if (mod && key === 'y') { e.preventDefault(); d.redo(); return; }
    if (!selected) return;
    if (mod && key === 'd') { e.preventDefault(); d.duplicate(selected.id); return; }
    const step = e.shiftKey ? 5 : 0.5;
    const nudge: Record<string, [number, number]> = { arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step] };
    if (nudge[key]) { e.preventDefault(); const [a, b] = nudge[key]; d.update(selected.id, { x: r2(selected.x + a), y: r2(selected.y + b) }); }
    else if (key === 'delete' || key === 'backspace') { e.preventDefault(); d.remove(selected.id); }
    else if (key === '[' || key === ']') d.update(selected.id, { rot: ((selected.rot + (key === ']' ? 1 : -1) * (e.shiftKey ? 15 : 5)) % 360 + 360) % 360 });
    else if (key === 'escape') d.select(null);
  };

  const hs = 11 * k;
  const bgFill = bg === 'white' ? '#ffffff' : bg === 'dark' ? '#1c232d' : 'url(#checks)';
  const gridStroke = bg === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(31,58,95,0.10)';
  const gridLines: ReactNode[] = [];
  const stepG = doc.widthCm > 150 ? 20 : doc.widthCm > 50 ? 10 : 5;
  for (let x = stepG; x < doc.widthCm; x += stepG) gridLines.push(<line key={'v' + x} x1={x} x2={x} y1={0} y2={doc.heightCm} stroke={gridStroke} strokeWidth={k} />);
  for (let y = stepG; y < doc.heightCm; y += stepG) gridLines.push(<line key={'h' + y} x1={0} x2={doc.widthCm} y1={y} y2={y} stroke={gridStroke} strokeWidth={k} />);

  return (
    <div ref={wrapRef} tabIndex={-1} onKeyDown={onKey} data-testid="canvas-wrapper"
      className="blueprint-grid flex items-center justify-center rounded-lg border bg-muted/40 p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:p-4">
      <svg ref={svgRef} data-testid="decal-canvas" role="application"
        aria-label={`Decal canvas, ${doc.widthCm} by ${doc.heightCm} centimetres. Select an element and use arrow keys to move, brackets to rotate, Delete to remove.`}
        viewBox={`${-m} ${-m} ${doc.widthCm + 2 * m} ${doc.heightCm + 2 * m}`}
        style={{ width: '100%', maxHeight: '62vh', touchAction: 'none', userSelect: 'none' }}
        onPointerMove={onMove} onPointerUp={end} onPointerCancel={end}
        onPointerDown={() => { d.select(null); wrapRef.current?.focus({ preventScroll: true }); }}>
        <defs>
          <pattern id="checks" width={cell * 2} height={cell * 2} patternUnits="userSpaceOnUse">
            <rect width={cell * 2} height={cell * 2} fill="#f4f6f9" />
            <rect width={cell} height={cell} fill="#e3e8ef" /><rect x={cell} y={cell} width={cell} height={cell} fill="#e3e8ef" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={doc.widthCm} height={doc.heightCm} fill={bgFill} data-testid="canvas-surface" />
        {gridLines}
        <svg x={0} y={0} width={doc.widthCm} height={doc.heightCm} viewBox={`0 0 ${doc.widthCm} ${doc.heightCm}`} overflow="visible">
          {doc.els.map((el) => {
            const n = nodeOf(el);
            const props: Record<string, unknown> = {};
            Object.entries(n.attrs).forEach(([a, v]) => (props[camel(a)] = v));
            return (
              <g key={el.id} transform={transformOf(el)} className="el-hit" tabIndex={0} role="button"
                aria-label={`${el.name}, ${r2(el.w)} by ${r2(el.h)} cm${el.id === d.selId ? ', selected' : ''}`}
                data-testid={`element-${el.id}`}
                onPointerDown={(e) => begin(e, el, 'move')} onFocus={() => d.select(el.id)}
                onDoubleClick={() => el.kind === 'text' && document.getElementById('prop-text')?.focus()}>
                <rect x={-el.w / 2} y={-el.h / 2} width={el.w} height={el.h} fill="transparent" />
                {createElement(n.tag, props, n.text)}
              </g>
            );
          })}
        </svg>
        <rect x={0} y={0} width={doc.widthCm} height={doc.heightCm} fill="none" stroke="hsl(214 52% 28%)" strokeWidth={1.5 * k} pointerEvents="none" />
        {selected && (
          <g transform={transformOf(selected)} data-testid="selection-box">
            <rect x={-selected.w / 2} y={-selected.h / 2} width={selected.w} height={selected.h} fill="none" stroke="hsl(212 62% 46%)" strokeWidth={1.5 * k} strokeDasharray={`${5 * k} ${3 * k}`} pointerEvents="none" />
            <line x1={0} y1={-selected.h / 2} x2={0} y2={-selected.h / 2 - 26 * k} stroke="hsl(212 62% 46%)" strokeWidth={k} pointerEvents="none" />
            <circle cx={0} cy={-selected.h / 2 - 26 * k} r={hs * 0.62} fill="#fff" stroke="hsl(212 62% 46%)" strokeWidth={1.5 * k}
              style={{ cursor: 'grab' }} data-testid="handle-rotate" onPointerDown={(e) => begin(e, selected, 'rotate')} />
            {([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([sx, sy], i) => (
              <rect key={i} x={(sx * selected.w) / 2 - hs / 2} y={(sy * selected.h) / 2 - hs / 2} width={hs} height={hs} fill="#fff"
                stroke="hsl(212 62% 46%)" strokeWidth={1.5 * k} data-testid={`handle-resize-${i}`}
                style={{ cursor: sx * sy > 0 ? 'nwse-resize' : 'nesw-resize' }} onPointerDown={(e) => begin(e, selected, 'resize')} />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
