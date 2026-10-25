import { describe, expect, it } from 'vitest';
import { needed, VOTE_MS, VoteTally } from '../../src/shared/voteTally';

const FIVE = ['a', 'b', 'c', 'd', 'e'];

function setup() {
  let t = 1000;
  const tally = new VoteTally(() => t);
  return { tally, advance: (ms: number) => { t += ms; } };
}

describe('VoteTally', () => {
  it('needs 4 of 5 and 2 of 2 to surrender', () => {
    expect([needed('ff', 5), needed('ff', 2), needed('ff', 1)]).toEqual([4, 2, 1]);
    const { tally } = setup();
    tally.start({ id: 'v1', kind: 'ff', starter: 'a', voters: FIVE });
    tally.ballot('b', 'v1', true);
    tally.ballot('c', 'v1', true);
    expect(tally.check()).toBeNull();
    tally.ballot('d', 'v1', true);
    expect(tally.check()).toEqual({
      id: 'v1', kind: 'ff', passed: true, yes: 4, voters: 5, declined: [], missing: ['e'],
    });

    const two = setup().tally;
    two.start({ id: 'v2', kind: 'ff', starter: 'a', voters: ['a', 'b'] });
    expect(two.check()).toBeNull();
    two.ballot('b', 'v2', true);
    expect(two.check()?.passed).toBe(true);
  });

  it('ends a surrender as soon as it can no longer pass', () => {
    const { tally } = setup();
    tally.start({ id: 'v1', kind: 'ff', starter: 'a', voters: FIVE });
    tally.ballot('b', 'v1', false);
    expect(tally.check()).toBeNull();
    tally.ballot('c', 'v1', false);
    expect(tally.check()).toEqual({
      id: 'v1', kind: 'ff', passed: false, yes: 1, voters: 5, declined: ['b', 'c'], missing: ['d', 'e'],
    });
    expect(tally.view()).toBeNull();
  });

  it('fails a ready check on the first decline and passes when everyone accepts', () => {
    const failing = setup().tally;
    failing.start({ id: 'r1', kind: 'ready', starter: 'a', voters: ['a', 'b', 'c'] });
    failing.ballot('b', 'r1', false);
    expect(failing.check()).toMatchObject({ passed: false, yes: 1, declined: ['b'], missing: ['c'] });

    const passing = setup().tally;
    passing.start({ id: 'r2', kind: 'ready', starter: 'a', voters: ['a', 'b', 'c'] });
    passing.ballot('b', 'r2', true);
    expect(passing.check()).toBeNull();
    passing.ballot('c', 'r2', true);
    expect(passing.check()).toMatchObject({ passed: true, yes: 3, declined: [], missing: [] });
  });

  it('lets the other person kick in a room of two', () => {
    expect([needed('kick', 1), needed('kick', 2), needed('kick', 4), needed('kick', 5)]).toEqual([1, 2, 3, 3]);
    const { tally } = setup();
    tally.start({ id: 'k1', kind: 'kick', starter: 'a', target: 'b', voters: ['a', 'b'] });
    expect(tally.check()).toEqual({
      id: 'k1', kind: 'kick', target: 'b', passed: true, yes: 1, voters: 1, declined: [], missing: [],
    });
  });

  it('counts unanswered voters as no when time runs out', () => {
    const ff = setup();
    ff.tally.start({ id: 'v1', kind: 'ff', starter: 'a', voters: FIVE });
    ff.tally.ballot('b', 'v1', true);
    ff.tally.ballot('c', 'v1', true);
    ff.advance(VOTE_MS.ff - 1);
    expect(ff.tally.check()).toBeNull();
    ff.advance(1);
    expect(ff.tally.check()).toMatchObject({ passed: false, yes: 3, voters: 5, declined: [], missing: ['d', 'e'] });

    const ready = setup();
    ready.tally.start({ id: 'r1', kind: 'ready', starter: 'a', voters: ['a', 'b'] });
    ready.advance(14_999);
    expect(ready.tally.check()).toBeNull();
    ready.advance(1);
    expect(ready.tally.check()).toMatchObject({ passed: false, missing: ['b'] });
    expect(VOTE_MS).toEqual({ ff: 60_000, kick: 60_000, ready: 15_000 });
  });

  it('keeps the first ballot', () => {
    const { tally } = setup();
    tally.start({ id: 'v1', kind: 'ff', starter: 'a', voters: FIVE });
    expect(tally.ballot('b', 'v1', false)).toBe(true);
    expect(tally.ballot('b', 'v1', true)).toBe(false);
    expect(tally.view()?.ballots).toEqual({ a: true, b: false });
    // The starter's yes is final too.
    expect(tally.ballot('a', 'v1', false)).toBe(false);
  });

  it('ignores ballots from people who were not there at the start', () => {
    const { tally } = setup();
    tally.start({ id: 'v1', kind: 'ff', starter: 'a', voters: ['a', 'b'] });
    expect(tally.ballot('late', 'v1', true)).toBe(false);
    expect(tally.ballot('b', 'other', true)).toBe(false);
    expect(tally.view()?.ballots).toEqual({ a: true });
    expect(setup().tally.ballot('a', 'v1', true)).toBe(false);
  });

  it('counts a voter who left as no', () => {
    const { tally } = setup();
    tally.start({ id: 'v1', kind: 'ff', starter: 'a', voters: ['a', 'b', 'c'] });
    tally.left('b');
    expect(tally.view()?.ballots).toEqual({ a: true, b: false });
    expect(tally.ballot('b', 'v1', true)).toBe(false);
    // Someone who already said yes keeps it, and a stranger changes nothing.
    tally.ballot('c', 'v1', true);
    tally.left('c');
    tally.left('stranger');
    expect(tally.view()?.ballots).toEqual({ a: true, b: false, c: true });
    expect(tally.check()).toMatchObject({ passed: false, yes: 2, declined: ['b'], missing: [] });
  });

  it('runs one vote at a time', () => {
    const { tally } = setup();
    expect(tally.start({ id: 'v1', kind: 'ff', starter: 'a', voters: FIVE })).toBe(true);
    expect(tally.start({ id: 'v2', kind: 'ready', starter: 'b', voters: FIVE })).toBe(false);
    expect(tally.view()?.id).toBe('v1');
    tally.ballot('b', 'v1', false);
    tally.ballot('c', 'v1', false);
    tally.check();
    expect(tally.start({ id: 'v2', kind: 'ready', starter: 'b', voters: FIVE })).toBe(true);
  });

  it('leaves the kick target out of the voters', () => {
    const { tally } = setup();
    tally.start({ id: 'k1', kind: 'kick', starter: 'a', target: 'e', voters: FIVE });
    expect(tally.view()).toEqual({
      id: 'k1', kind: 'kick', starter: 'a', target: 'e', voters: ['a', 'b', 'c', 'd'], ballots: { a: true }, endsAt: 61_000,
    });
    expect(tally.ballot('e', 'k1', false)).toBe(false);
    tally.ballot('b', 'k1', true);
    expect(tally.check()).toBeNull();
    tally.ballot('c', 'k1', true);
    expect(tally.check()).toMatchObject({ passed: true, yes: 3, voters: 4, target: 'e' });
  });
});
