import { describe, expect, it } from 'vitest';
import { countdownRate, readyPhase, readySounds } from '../../src/renderer/panel/readyCheck';

describe('readyPhase', () => {
  it('counts down until we answer, then shows our answer even after the vote ends', () => {
    expect(readyPhase(undefined, false)).toBe('countdown');
    expect(readyPhase(true, false)).toBe('accepted');
    expect(readyPhase(false, true)).toBe('declined');
  });

  it('stops the countdown when the vote ends before we answer', () => {
    expect(readyPhase(undefined, true)).toBe('ended');
  });
});

describe('countdownRate', () => {
  it('slows the 10.7 s video so it ends with a 15 s vote', () => {
    expect(countdownRate(10.733, 0, 15)).toBeCloseTo(0.7155, 3);
  });

  it('catches up when the video is behind the time left', () => {
    expect(countdownRate(10.733, 2.733, 4)).toBe(2);
  });

  it('plays at normal speed with no time left or no video loaded yet', () => {
    expect(countdownRate(10.733, 5, 0)).toBe(1);
    expect(countdownRate(10.733, 5, -1)).toBe(1);
    expect(countdownRate(Number.NaN, 0, 10)).toBe(1);
  });
});

describe('readySounds', () => {
  it('plays match found and the countdown when the card appears', () => {
    expect(readySounds(null, 'countdown')).toEqual({ play: ['intro', 'countdown'], fade: ['acceptedLoop'] });
  });

  it('plays match found and the accepted loop for a card that appears already accepted', () => {
    expect(readySounds(null, 'accepted')).toEqual({ play: ['intro', 'acceptedLoop'], fade: ['countdown'] });
  });

  it('swaps the countdown for the accepted loop when we accept', () => {
    expect(readySounds('countdown', 'accepted')).toEqual({ play: ['acceptedLoop'], fade: ['countdown'] });
  });

  it('goes quiet when we decline or the vote ends without us', () => {
    expect(readySounds('countdown', 'declined')).toEqual({ play: [], fade: ['countdown', 'acceptedLoop'] });
    expect(readySounds('countdown', 'ended')).toEqual({ play: [], fade: ['countdown', 'acceptedLoop'] });
  });
});
