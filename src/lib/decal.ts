import { CONFIG } from '@/config';

export type Kind = 'text' | 'rect' | 'ellipse' | 'triangle' | 'star' | 'image';
export interface El {
  id: string; kind: Kind; name: string;
  x: number; y: number; w: number; h: number; rot: number; fill: string;
  text?: string; font?: string; weight?: number; fontSize?: number;
  href?: string;
}
export interface Doc { widthCm: number; heightCm: number; els: El[] }
export type Bg = 'transparent' | 'white' | 'dark';

export const FONTS: { label: string; css: string }[] = [
  { label: 'Arial Black', css: "'Arial Black', 'Helvetica Neue', Arial, sans-serif" },
  { label: 'Arial', css: "Arial, 'Helvetica Neue', sans-serif" },
  { label: 'Impact', css: "Impact, 'Arial Narrow Bold', sans-serif" },
  { label: 'Trebuchet', css: "'Trebuchet MS', Arial, sans-serif" },
  { label: 'Verdana', css: 'Verdana, Geneva, sans-serif' },
  { label: 'Georgia', css: "Georgia, 'Times New Roman', serif" },
  { label: 'Courier New', css: "'Courier New', Courier, monospace" },
];
export const SWATCHES = ['#1f3a5f', '#14181f', '#ffffff', '#c8372d', '#e2401c', '#d9a21b', '#2f7d4f', '#7b8794'];
export const PRESETS = [
  { label: 'Banner strip', w: 100, h: 15 },
  { label: 'Door panel', w: 50, h: 30 },
  { label: 'Rear window', w: 90, h: 25 },
  { label: 'Badge', w: 20, h: 20 },
];

export const uid = () => Math.random().toString(36).slice(2, 9);
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const r2 = (v: number) => Math.round(v * 100) / 100;
export const inches = (cm: number) => (cm / 2.54).toFixed(1);

let mctx: CanvasRenderingContext2D | null = null;
export function fitText(el: El): El {
  if (el.kind !== 'text') return el;
  mctx = mctx ?? document.createElement('canvas').getContext('2d');
  const fs = el.fontSize ?? 5;
  if (!mctx) return { ...el, w: fs * 5, h: fs * 1.2 };
  mctx.font = `${el.weight ?? 700} 100px ${el.font ?? FONTS[0].css}`;
  const m = mctx.measureText(el.text || ' ').width / 100;
  return { ...el, w: Math.max(0.5, m * fs), h: fs * 1.2 };
}

export function makeText(doc: Doc, text = 'YOUR TEXT'): El {
  return fitText({
    id: uid(), kind: 'text', name: 'Text', x: doc.widthCm / 2, y: doc.heightCm / 2, w: 10, h: 5, rot: 0,
    fill: '#1f3a5f', text, font: FONTS[0].css, weight: 700, fontSize: r2(doc.heightCm * 0.35),
  });
}
export function makeShape(doc: Doc, kind: Exclude<Kind, 'text' | 'image'>): El {
  const s = Math.max(1, Math.min(doc.widthCm, doc.heightCm) * 0.4);
  const names = { rect: 'Rectangle', ellipse: 'Ellipse', triangle: 'Triangle', star: 'Star' };
  return {
    id: uid(), kind, name: names[kind], x: doc.widthCm / 2, y: doc.heightCm / 2,
    w: kind === 'rect' ? s * 2 : s, h: kind === 'rect' ? s * 0.3 : s, rot: 0, fill: '#c8372d',
  };
}

type Attrs = Record<string, string | number>;
export interface Node { tag: string; attrs: Attrs; text?: string }

export function nodeOf(el: El): Node {
  const { w, h } = el;
  switch (el.kind) {
    case 'text':
      return { tag: 'text', text: el.text || '', attrs: {
        x: 0, y: 0, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: el.fill,
        'font-size': r2(el.fontSize ?? 5), 'font-family': el.font ?? FONTS[0].css, 'font-weight': el.weight ?? 700,
      } };
    case 'rect': return { tag: 'rect', attrs: { x: -w / 2, y: -h / 2, width: w, height: h, fill: el.fill } };
    case 'ellipse': return { tag: 'ellipse', attrs: { cx: 0, cy: 0, rx: w / 2, ry: h / 2, fill: el.fill } };
    case 'triangle': return { tag: 'polygon', attrs: { points: `0,${-h / 2} ${w / 2},${h / 2} ${-w / 2},${h / 2}`, fill: el.fill } };
    case 'star': {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 ? 0.2 : 0.5; const a = ((-90 + 36 * i) * Math.PI) / 180;
        return `${r2(Math.cos(a) * r * w)},${r2(Math.sin(a) * r * h)}`;
      }).join(' ');
      return { tag: 'polygon', attrs: { points: pts, fill: el.fill } };
    }
    default:
      return { tag: 'image', attrs: { href: el.href ?? '', x: -w / 2, y: -h / 2, width: w, height: h, preserveAspectRatio: 'none' } };
  }
}
export const transformOf = (el: El) => `translate(${r2(el.x)} ${r2(el.y)}) rotate(${r2(el.rot)})`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function exportSvg(doc: Doc): string {
  const body = doc.els.map((el) => {
    const n = nodeOf(el);
    const a = Object.entries(n.attrs).map(([k, v]) => `${k}="${esc(String(v))}"`).join(' ');
    const inner = n.tag === 'text' ? `<text ${a}>${esc(n.text ?? '')}</text>` : `<${n.tag} ${a}/>`;
    return `  <g id="${el.id}" transform="${transformOf(el)}">\n    ${inner}\n  </g>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Atlantic Rock Group Decal Studio. PREVIEW ARTWORK: text is live (not outlined) and raster images are embedded. Not confirmed cut-ready production data. -->
<svg xmlns="http://www.w3.org/2000/svg" width="${doc.widthCm}cm" height="${doc.heightCm}cm" viewBox="0 0 ${doc.widthCm} ${doc.heightCm}">
  <title>Decal preview ${doc.widthCm} x ${doc.heightCm} cm</title>
${body}
</svg>
`;
}

export function svgToPng(doc: Doc, bg: Bg): Promise<Blob> {
  const svg = exportSvg(doc);
  const scale = CONFIG.PNG_MAX_PX / Math.max(doc.widthCm, doc.heightCm);
  const pw = Math.round(doc.widthCm * scale); const ph = Math.round(doc.heightCm * scale);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = pw; c.height = ph;
      const ctx = c.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); return reject(new Error('Canvas unavailable')); }
      if (bg !== 'transparent') { ctx.fillStyle = bg === 'white' ? '#ffffff' : '#1c232d'; ctx.fillRect(0, 0, pw, ph); }
      ctx.drawImage(img, 0, 0, pw, ph);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not render artwork')); };
    img.src = url;
  });
}

export function downloadBlob(blob: Blob, name: string) {
  const u = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1500);
}
export const fileBase = (d: Doc) => `atlantic-decal-${d.widthCm}x${d.heightCm}cm`;

export function validateDoc(doc: Doc): { errors: string[]; warnings: string[] } {
  const errors: string[] = []; const warnings: string[] = [];
  const { MIN_CM: lo, MAX_CM: hi } = CONFIG;
  if (!(doc.widthCm >= lo && doc.widthCm <= hi)) errors.push(`Width must be between ${lo} and ${hi} cm.`);
  if (!(doc.heightCm >= lo && doc.heightCm <= hi)) errors.push(`Height must be between ${lo} and ${hi} cm.`);
  if (doc.els.length === 0) errors.push('Add at least one element before exporting.');
  const out = doc.els.some((e) => {
    const r = Math.abs((e.rot * Math.PI) / 180);
    const bw = Math.abs(e.w * Math.cos(r)) + Math.abs(e.h * Math.sin(r));
    const bh = Math.abs(e.w * Math.sin(r)) + Math.abs(e.h * Math.cos(r));
    return e.x - bw / 2 < -0.01 || e.y - bh / 2 < -0.01 || e.x + bw / 2 > doc.widthCm + 0.01 || e.y + bh / 2 > doc.heightCm + 0.01;
  });
  if (out) warnings.push('Some elements extend past the decal edge and will be cropped in PNG exports.');
  if (doc.els.some((e) => e.kind === 'image')) warnings.push('Uploaded raster or embedded images are not vector cut paths and will need to be re-drawn or traced before cutting.');
  if (doc.els.some((e) => e.kind === 'text')) warnings.push('Text is live, not converted to outlines. Fonts may differ on another computer.');
  return { errors, warnings };
}

export function orderSummary(doc: Doc): string {
  const lines = [
    'ATLANTIC ROCK GROUP - DECAL DESIGN SUMMARY (PREVIEW)',
    '-----------------------------------------------------',
    `Overall size: ${doc.widthCm} cm x ${doc.heightCm} cm (approx. ${inches(doc.widthCm)} in x ${inches(doc.heightCm)} in)`,
    `Elements: ${doc.els.length}`, '',
  ];
  doc.els.forEach((e, i) => {
    const base = `${i + 1}. ${e.name} [${e.kind}] - ${r2(e.w)} x ${r2(e.h)} cm, rotation ${Math.round(e.rot)} deg`;
    const extra = e.kind === 'text' ? `, text "${e.text}", font ${(FONTS.find((f) => f.css === e.font)?.label) ?? 'custom'}, colour ${e.fill}`
      : e.kind === 'image' ? ', uploaded image' : `, colour ${e.fill}`;
    lines.push(base + extra);
  });
  lines.push('', 'NOTES',
    '- This is a design preview. Dimensions are approximate until confirmed by Atlantic Rock Group.',
    '- Regular text and raster images are not production-ready cut data. Artwork and cuttability must be confirmed before production.',
    '- No price is implied by this summary.');
  return lines.join('\n');
}

const KEY = 'arg-decal-doc';
export function loadDoc(): Doc | null {
  try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); return d && Array.isArray(d.els) ? d : null; } catch { return null; }
}
export function saveDoc(d: Doc) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* quota */ } }
export function initialDoc(): Doc {
  const d: Doc = { widthCm: CONFIG.DEFAULT_WIDTH_CM, heightCm: CONFIG.DEFAULT_HEIGHT_CM, els: [] };
  const t = makeText(d, 'YOUR NAME HERE'); t.fontSize = 8; d.els.push(fitText(t));
  const bar = makeShape(d, 'rect'); bar.name = 'Underline bar'; bar.y = d.heightCm * 0.78; bar.w = 40; bar.h = 1; bar.fill = '#c8372d';
  d.els.push(bar);
  return d;
}
