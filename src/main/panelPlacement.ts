import type { VoteKind } from '../shared/roomProtocol';
import type { Rect } from './coords';

/** Window sizes in DIPs. A kick uses the surrender widget. */
export const SURRENDER_SIZE = { width: 223, height: 113 };
export const READY_SIZE = { width: 442, height: 452 };
export const ROSTER_SIZE = { width: 720, height: 470 };

const EDGE_GAP = 16;
/** How far down the display the surrender widget starts, like League's. */
const WIDGET_TOP = 0.4;

export const voteSize = (kind: VoteKind): { width: number; height: number } => (kind === 'ready' ? READY_SIZE : SURRENDER_SIZE);

/** Surrender and kick sit at the right edge, about 40% down; the ready check is centred. `area` is the primary display's work area. */
export function votePlacement(kind: VoteKind, area: Rect): Rect {
  const size = voteSize(kind);
  if (kind === 'ready') return centredIn(size, area);
  return { ...size, x: area.x + area.width - size.width - EDGE_GAP, y: area.y + Math.round(area.height * WIDGET_TOP) };
}

export function centredIn(size: { width: number; height: number }, area: Rect): Rect {
  return { ...size, x: area.x + Math.round((area.width - size.width) / 2), y: area.y + Math.round((area.height - size.height) / 2) };
}
