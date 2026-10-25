import { describe, expect, it } from 'vitest';
import { centredIn, READY_SIZE, SURRENDER_SIZE, votePlacement } from '../../src/main/panelPlacement';

const area = { x: 100, y: 50, width: 1920, height: 1000 };

describe('votePlacement', () => {
  it('puts a surrender or kick widget at the right edge, 40% down', () => {
    for (const kind of ['ff', 'kick'] as const) {
      expect(votePlacement(kind, area)).toEqual({ ...SURRENDER_SIZE, x: 100 + 1920 - SURRENDER_SIZE.width - 16, y: 50 + 400 });
    }
  });

  it('centres the ready check', () => {
    expect(votePlacement('ready', area)).toEqual({ ...READY_SIZE, x: 100 + Math.round((1920 - READY_SIZE.width) / 2), y: 50 + Math.round((1000 - READY_SIZE.height) / 2) });
  });
});

describe('centredIn', () => {
  it('centres a box in a work area that does not start at the origin', () => {
    expect(centredIn({ width: 200, height: 100 }, { x: -1920, y: 0, width: 1920, height: 1080 })).toEqual({ x: -1060, y: 490, width: 200, height: 100 });
  });
});
