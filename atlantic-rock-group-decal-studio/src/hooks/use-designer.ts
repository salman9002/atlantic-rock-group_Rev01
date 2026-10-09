import { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG } from '@/config';
import { type Doc, type El, type Kind, clamp, fitText, initialDoc, loadDoc, makeShape, makeText, saveDoc, uid } from '@/lib/decal';

export function validateUpload(file: File): string | null {
  const okExt = /\.(svg|png|jpe?g)$/i.test(file.name);
  if (!CONFIG.ACCEPTED_TYPES.includes(file.type) || !okExt) return 'Unsupported file. Please upload an SVG, PNG or JPG.';
  if (file.size > CONFIG.MAX_UPLOAD_BYTES) return `File is too large. Maximum size is ${Math.round(CONFIG.MAX_UPLOAD_BYTES / 1048576)} MB.`;
  if (file.size === 0) return 'That file is empty.';
  return null;
}

export function useDesigner() {
  const [doc, setDocState] = useState<Doc>(() => loadDoc() ?? initialDoc());
  const [selId, setSelId] = useState<string | null>(null);
  const [, tick] = useState(0);
  const docRef = useRef(doc);
  const past = useRef<Doc[]>([]);
  const future = useRef<Doc[]>([]);

  const setDoc = useCallback((d: Doc) => { docRef.current = d; setDocState(d); }, []);
  useEffect(() => { const t = setTimeout(() => saveDoc(doc), 400); return () => clearTimeout(t); }, [doc]);

  const snapshot = useCallback(() => {
    past.current.push(docRef.current);
    if (past.current.length > CONFIG.HISTORY_LIMIT) past.current.shift();
    future.current = []; tick((n) => n + 1);
  }, []);
  const commit = useCallback((fn: (d: Doc) => Doc) => { snapshot(); setDoc(fn(docRef.current)); }, [snapshot, setDoc]);

  const patchEl = (d: Doc, id: string, patch: Partial<El>): Doc => ({
    ...d, els: d.els.map((e) => (e.id === id ? fitIfText({ ...e, ...patch }, patch) : e)),
  });
  const fitIfText = (e: El, p: Partial<El>) =>
    e.kind === 'text' && ('text' in p || 'font' in p || 'weight' in p || 'fontSize' in p) && !('w' in p) ? fitText(e) : e;

  const live = useCallback((id: string, patch: Partial<El>) => setDoc(patchEl(docRef.current, id, patch)), [setDoc]);
  const update = useCallback((id: string, patch: Partial<El>) => commit((d) => patchEl(d, id, patch)), [commit]);

  const add = useCallback((el: El) => { commit((d) => ({ ...d, els: [...d.els, el] })); setSelId(el.id); }, [commit]);
  const addText = useCallback(() => add(makeText(docRef.current)), [add]);
  const addShape = useCallback((k: Exclude<Kind, 'text' | 'image'>) => add(makeShape(docRef.current, k)), [add]);

  const addImage = useCallback((file: File): Promise<string | null> => {
    const err = validateUpload(file);
    if (err) return Promise.resolve(err);
    return new Promise((resolve) => {
      const fr = new FileReader();
      fr.onerror = () => resolve('Could not read that file.');
      fr.onload = () => {
        const href = String(fr.result);
        const img = new Image();
        img.onerror = () => resolve('That image could not be opened. It may be corrupt.');
        img.onload = () => {
          const d = docRef.current;
          const ar = (img.naturalWidth || 1) / (img.naturalHeight || 1);
          let w = d.widthCm * 0.5; let h = w / ar;
          if (h > d.heightCm * 0.8) { h = d.heightCm * 0.8; w = h * ar; }
          add({ id: uid(), kind: 'image', name: file.name.slice(0, 28), x: d.widthCm / 2, y: d.heightCm / 2, w, h, rot: 0, fill: '#000000', href });
          resolve(null);
        };
        img.src = href;
      };
      fr.readAsDataURL(file);
    });
  }, [add]);

  const remove = useCallback((id: string) => { commit((d) => ({ ...d, els: d.els.filter((e) => e.id !== id) })); setSelId(null); }, [commit]);
  const duplicate = useCallback((id: string) => {
    const src = docRef.current.els.find((e) => e.id === id); if (!src) return;
    const copy = { ...src, id: uid(), x: src.x + 2, y: src.y + 2, name: src.name.replace(/ copy$/, '') + ' copy' };
    add(copy);
  }, [add]);
  const reorder = useCallback((id: string, dir: 1 | -1) => commit((d) => {
    const i = d.els.findIndex((e) => e.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= d.els.length) return d;
    const els = d.els.slice(); [els[i], els[j]] = [els[j], els[i]]; return { ...d, els };
  }), [commit]);
  const setSize = useCallback((widthCm: number, heightCm: number) =>
    commit((d) => ({ ...d, widthCm: clamp(widthCm, CONFIG.MIN_CM, CONFIG.MAX_CM), heightCm: clamp(heightCm, CONFIG.MIN_CM, CONFIG.MAX_CM) })), [commit]);

  const undo = useCallback(() => {
    const p = past.current.pop(); if (!p) return;
    future.current.push(docRef.current); setDoc(p); tick((n) => n + 1);
  }, [setDoc]);
  const redo = useCallback(() => {
    const f = future.current.pop(); if (!f) return;
    past.current.push(docRef.current); setDoc(f); tick((n) => n + 1);
  }, [setDoc]);
  const reset = useCallback(() => { commit(() => initialDoc()); setSelId(null); }, [commit]);
  const clear = useCallback(() => { commit((d) => ({ ...d, els: [] })); setSelId(null); }, [commit]);

  const selected = doc.els.find((e) => e.id === selId) ?? null;
  return {
    doc, selId, selected, select: setSelId, snapshot, live, update, addText, addShape, addImage, remove, duplicate, reorder,
    setSize, undo, redo, reset, clear, canUndo: past.current.length > 0, canRedo: future.current.length > 0,
  };
}
export type Designer = ReturnType<typeof useDesigner>;
