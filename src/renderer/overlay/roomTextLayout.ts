const BASE_MS = 4000;
const PER_POINT_MS = 60;
const MAX_MS = 10000;
/** Space kept between a 弹幕 line's tail and the next line in the same lane. */
const LANE_GAP_PX = 24;

/** How long a spot bubble stays: 4 s plus 60 ms per code point, at most 10 s. */
export function textDurationMs(text: string): number {
  return Math.min(MAX_MS, BASE_MS + PER_POINT_MS * [...text].length);
}

/**
 * The anchor for a spot bubble that is centred on x and sits above y, moved so the whole bubble stays on screen.
 * A bubble bigger than the screen keeps its top left corner visible.
 */
export function keepOnScreen(
  anchor: { x: number; y: number }, size: { width: number; height: number }, screen: { width: number; height: number },
  margin: number,
): { x: number; y: number } {
  const half = size.width / 2;
  return {
    x: Math.max(half + margin, Math.min(anchor.x, screen.width - half - margin)),
    y: Math.max(size.height + margin, Math.min(anchor.y, screen.height - margin)),
  };
}

/** At most `max` lines per owner on screen: adding past it names the oldest ones to take down. */
export class OwnerLimit {
  private readonly ids = new Map<string, number[]>();

  constructor(private readonly max: number) {}

  /** Returns the ids of this owner's lines that have to go now. */
  add(owner: string, id: number): number[] {
    const list = this.ids.get(owner) ?? [];
    list.push(id);
    this.ids.set(owner, list);
    return list.splice(0, Math.max(0, list.length - this.max));
  }

  remove(owner: string, id: number): void {
    const list = this.ids.get(owner)?.filter((x) => x !== id);
    if (list === undefined) return;
    if (list.length === 0) this.ids.delete(owner);
    else this.ids.set(owner, list);
  }
}

/** The 弹幕 rows. A row is free again once the line in it has moved its whole width past the right edge, plus a gap. */
export class DanmakuLanes {
  private readonly freeAt: number[];

  constructor(lanes: number, private readonly now: () => number) {
    this.freeAt = Array.from({ length: lanes }, () => 0);
  }

  /** The lowest free lane for a line `widthPx` wide, or null when every lane is busy. Lines start at the screen's right edge. */
  take(widthPx: number, speedPxS: number): number | null {
    const t = this.now();
    const lane = this.freeAt.findIndex((at) => at <= t);
    if (lane < 0) return null;
    this.freeAt[lane] = t + ((widthPx + LANE_GAP_PX) / speedPxS) * 1000;
    return lane;
  }

  /** Milliseconds until some lane is free: 0 when one is now. */
  nextFreeMs(): number {
    return Math.max(0, Math.min(...this.freeAt) - this.now());
  }
}
