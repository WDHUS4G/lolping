import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { EMOTE_DURATION_S, EMOTE_FX_VARIANTS, type EmoteRef } from '../../../shared/emotes';
import { emoteFxContent } from '../../shared/emoteFx';
import { useText } from '../text';

/** What a right-click on one of our emotes asks the settings to store. */
export interface FxPickerTarget {
  id: EmoteRef;
  /** Where the picker opens, viewport coordinates. */
  x: number;
  y: number;
  /** The emote's still image, which every tile plays its effect on. */
  url: string;
  /** The effect stored on it (the plain pop when absent), whose tile is marked as the current one. */
  fx?: number;
}

/** The art plays at half its on-screen size inside an 88 px stage. */
const STAGE_PX = 88;
const ART_PX = 44;
/** One play lasts --dur; restart everything a little after that so the tiles keep looping. */
const LOOP_MS = EMOTE_DURATION_S * 1000 + 400;

/**
 * The right-click effect picker: a grid of tiles in variant order — the plain pop first, what an emote without a stored
 * effect plays — each playing live on the emote's own image, its name underneath. Rendered once per WheelEditor; closes
 * on any click elsewhere, on Escape and after a pick.
 */
export function FxPicker({ target, onPick, onClose }: { target: FxPickerTarget; onPick(id: EmoteRef, fx: number | undefined): void; onClose(): void }) {
  const t = useText();
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: target.x, top: target.y });
  const [tick, setTick] = useState(0);

  // Keep the panel inside the window: clamp it to the viewport. Layout (not effect) so it never paints at the cursor
  // first and jumps.
  useLayoutEffect(() => {
    const el = panel.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      left: Math.min(Math.max(8, target.x), window.innerWidth - r.width - 8),
      top: Math.min(Math.max(8, target.y), window.innerHeight - r.height - 8),
    });
  }, [target]);

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (!panel.current?.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', away);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('mousedown', away);
      window.removeEventListener('keydown', key);
    };
  }, [onClose]);

  // One clock for every tile: bumping the tick remounts the stages, restarting each effect from its entrance.
  useEffect(() => {
    const iv = setInterval(() => setTick((n) => n + 1), LOOP_MS);
    return () => clearInterval(iv);
  }, []);

  const pick = (fx: number | undefined) => {
    onPick(target.id, fx);
    onClose();
  };

  const tiles: ReactNode[] = [];
  for (let v = 0; v < EMOTE_FX_VARIANTS; v++) {
    const fx = v === 0 ? undefined : v; // the plain pop stores nothing: it is what an emote without an effect plays
    tiles.push(
      <button key={v} type="button" className={`fxCell${(target.fx ?? 0) === v ? ' current' : ''}`} onClick={() => pick(fx)}>
        <FxStage v={v} url={target.url} tick={tick} />
        <span className="fxName">{t.fxNames[v]}</span>
      </button>,
    );
  }

  return (
    <div ref={panel} className="fxPicker" aria-label={t.fxMenuTitle} style={{ left: pos.left, top: pos.top }}>
      <div className="fxPickerTitle">{t.fxMenuTitle}</div>
      {tiles}
    </div>
  );
}

/** One tile's stage: the shared effect node, remounted on every tick so its entrance plays again. */
function FxStage({ v, url, tick }: { v: number; url: string; tick: number }) {
  const stage = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const root = document.createElement('div');
    root.className = 'emote';
    root.style.left = '50%';
    root.style.top = '50%';
    root.style.setProperty('--size', `${ART_PX}px`);
    root.style.setProperty('--dur', `${EMOTE_DURATION_S}s`);
    root.append(emoteFxContent(v, url));
    el.replaceChildren(root);
  }, [v, url, tick]);
  return <span className="fxStage" style={{ width: STAGE_PX, height: STAGE_PX }} ref={stage} aria-hidden />;
}
