import { EMOTE_DURATION_S } from '../../shared/emotes';

const div = (cls: string): HTMLDivElement => {
  const d = document.createElement('div');
  d.className = cls;
  return d;
};

function image(cls = ''): HTMLImageElement {
  const el = document.createElement('img');
  if (cls) el.className = cls;
  el.alt = '';
  el.draggable = false;
  return el;
}

/** What stands in for an emote whose files are missing. */
export function bubble(): HTMLDivElement {
  const b = div('bubble');
  b.textContent = '?';
  return b;
}

/** The CSS envelope a custom image or the placeholder plays in: what the baked animation does for a bundled emote. */
export function envelope(child: HTMLElement, variant: number): HTMLDivElement {
  const fx = div(`fx v${variant}`);
  fx.append(child);
  return fx;
}

/**
 * The `.fx` div playing `variant` on the image at `url` — what a custom emote shows inside its `.emote` box. The
 * overlay spawns it once per emote; the effect picker's tiles remount it on a timer, which restarts the entrance and
 * keeps the effects looping.
 */
export function emoteFxContent(variant: number, url: string): HTMLDivElement {
  const img = image();
  img.addEventListener('error', () => img.replaceWith(bubble()), { once: true });
  img.src = url;
  return envelope(img, variant);
}
