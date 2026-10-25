import { describe, expect, it } from 'vitest';
import { DanmakuLanes, OwnerLimit, keepOnScreen, textDurationMs } from '../../src/renderer/overlay/roomTextLayout';

describe('roomTextLayout', () => {
  describe('textDurationMs', () => {
    it('shows a short line for 4 s plus 60 ms per character', () => {
      expect(textDurationMs('ab')).toBe(4120);
    });

    it('caps a long line at 10 s', () => {
      expect(textDurationMs('x'.repeat(120))).toBe(10000);
    });

    it('counts an emoji once', () => {
      expect(textDurationMs('😀')).toBe(4060);
    });
  });

  describe('keepOnScreen', () => {
    const size = { width: 200, height: 60 };
    const screen = { width: 1000, height: 600 };

    it('leaves a bubble that fits where it is', () => {
      expect(keepOnScreen({ x: 500, y: 300 }, size, screen, 8)).toEqual({ x: 500, y: 300 });
    });

    it('moves a bubble in from the top and left edges', () => {
      expect(keepOnScreen({ x: 10, y: 20 }, size, screen, 8)).toEqual({ x: 108, y: 68 });
    });

    it('moves a bubble in from the right and bottom edges', () => {
      expect(keepOnScreen({ x: 990, y: 700 }, size, screen, 8)).toEqual({ x: 892, y: 592 });
    });

    it('keeps the top left corner of a bubble that is bigger than the screen', () => {
      expect(keepOnScreen({ x: 0, y: 0 }, { width: 1200, height: 800 }, screen, 8)).toEqual({ x: 608, y: 808 });
    });
  });

  describe('OwnerLimit', () => {
    it('drops the oldest line of an owner once it has more than the maximum', () => {
      const limit = new OwnerLimit(3);
      expect(limit.add('a', 1)).toEqual([]);
      expect(limit.add('a', 2)).toEqual([]);
      expect(limit.add('a', 3)).toEqual([]);
      expect(limit.add('a', 4)).toEqual([1]);
      expect(limit.add('a', 5)).toEqual([2]);
    });

    it('does not count other owners against each other', () => {
      const limit = new OwnerLimit(3);
      for (const id of [1, 2, 3]) limit.add('a', id);
      expect(limit.add('b', 4)).toEqual([]);
      expect(limit.add('a', 5)).toEqual([1]);
    });

    it('frees a place when a line is removed', () => {
      const limit = new OwnerLimit(2);
      limit.add('a', 1);
      limit.add('a', 2);
      limit.remove('a', 1);
      expect(limit.add('a', 3)).toEqual([]);
      expect(limit.add('a', 4)).toEqual([2]);
    });

    it('ignores removing a line it does not know', () => {
      const limit = new OwnerLimit(1);
      expect(() => limit.remove('nobody', 9)).not.toThrow();
      limit.add('a', 1);
      limit.remove('a', 9);
      expect(limit.add('a', 2)).toEqual([1]);
    });
  });

  describe('DanmakuLanes', () => {
    it('gives each simultaneous line its own lane and then none', () => {
      const lanes = new DanmakuLanes(2, () => 0);
      expect(lanes.take(300, 160)).toBe(0);
      expect(lanes.take(300, 160)).toBe(1);
      expect(lanes.take(300, 160)).toBeNull();
    });

    it('frees a lane once the line tail plus a 24 px gap has entered the screen', () => {
      let t = 0;
      const lanes = new DanmakuLanes(1, () => t);
      expect(lanes.take(296, 160)).toBe(0);
      t = 1999;
      expect(lanes.take(296, 160)).toBeNull();
      t = 2000; // (296 + 24) px at 160 px/s
      expect(lanes.take(296, 160)).toBe(0);
    });

    it('reuses the lowest free lane and says how long until one frees', () => {
      let t = 0;
      const lanes = new DanmakuLanes(2, () => t);
      lanes.take(136, 160); // busy for 1000 ms
      lanes.take(456, 160); // busy for 3000 ms
      expect(lanes.nextFreeMs()).toBe(1000);
      t = 1500;
      expect(lanes.nextFreeMs()).toBe(0);
      expect(lanes.take(100, 160)).toBe(0);
    });
  });
});
