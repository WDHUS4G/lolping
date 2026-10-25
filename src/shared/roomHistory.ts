import type { TagRgb } from './roomColors';

/** A line of this session's room chat. `tag` is who said it; a vote result has none. */
export interface HistoryLine {
  at: number;
  kind: 'text' | 'alive' | 'vote';
  tag: { name: string; color: number; rgb: TagRgb | null } | null;
  text: string;
}
