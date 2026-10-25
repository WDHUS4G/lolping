import { describe, expect, it } from 'vitest';
import { RoomHistory } from '../../src/main/roomHistory';
import type { HistoryLine } from '../../src/shared/roomHistory';

const line = (n: number): HistoryLine => ({ at: n, kind: 'text', tag: null, text: `line ${n}` });

describe('RoomHistory', () => {
  it('keeps lines in the order they came', () => {
    const history = new RoomHistory();
    history.push(line(1));
    history.push(line(2));
    expect(history.lines().map((l) => l.text)).toEqual(['line 1', 'line 2']);
  });

  it('keeps only the newest 200 lines', () => {
    const history = new RoomHistory();
    for (let n = 1; n <= 205; n++) history.push(line(n));
    expect(history.lines()).toHaveLength(200);
    expect(history.lines()[0].text).toBe('line 6');
    expect(history.lines()[199].text).toBe('line 205');
  });

  it('tells its listener after each pushed line, with the line already in', () => {
    const seen: number[] = [];
    const history: RoomHistory = new RoomHistory(() => seen.push(history.lines().length));
    history.push(line(1));
    history.push(line(2));
    expect(seen).toEqual([1, 2]);
  });

  it('empties on clear', () => {
    const history = new RoomHistory();
    history.push(line(1));
    history.clear();
    expect(history.lines()).toEqual([]);
  });
});
