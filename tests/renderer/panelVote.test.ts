import { describe, expect, it } from 'vitest';
import { canAnswer, voteBoxes, voteLeft, voteStatus, voteTitle } from '../../src/renderer/panel/vote';
import { strings } from '../../src/shared/i18n';
import type { RoomMember } from '../../src/shared/room';
import { VOTE_MS, type VoteView } from '../../src/shared/voteTally';

const member = (peer: string, name: string, self = false): RoomMember => ({
  peer, name, color: 0, rgb: null, path: 'lan', status: 'on', needsUpdate: false, noEmotes: false, noChat: false,
  textOff: false, votesOff: false, muted: false, self,
});
const members = [member('aa', 'Me', true), member('bb', 'Alex'), member('cc', 'Sam')];
const view = (over: Partial<VoteView> = {}): VoteView => ({
  id: '01234567', kind: 'ff', starter: 'aa', voters: ['aa', 'bb', 'cc', 'gone'], ballots: { aa: true, bb: false }, endsAt: 100_000, ...over,
});

describe('voteBoxes', () => {
  it('gives one box per voter: yes, no or empty, and no name for a voter who has left', () => {
    expect(voteBoxes(view(), members)).toEqual([
      { peer: 'aa', name: 'Me', answer: 'yes' },
      { peer: 'bb', name: 'Alex', answer: 'no' },
      { peer: 'cc', name: 'Sam', answer: 'none' },
      { peer: 'gone', name: '', answer: 'none' },
    ]);
  });
});

describe('voteLeft', () => {
  it('runs from 1 at the start to 0 at the end and stays inside that', () => {
    const v = view({ kind: 'ready', endsAt: 1000 + VOTE_MS.ready });
    expect(voteLeft(v, 1000)).toBe(1);
    expect(voteLeft(v, 1000 + VOTE_MS.ready / 2)).toBe(0.5);
    expect(voteLeft(v, 1000 + VOTE_MS.ready + 5)).toBe(0);
    expect(voteLeft(v, 0)).toBe(1);
  });
});

describe('voteTitle', () => {
  it('names the vote in the chosen language, and the kick target by name', () => {
    expect(voteTitle(view(), members, strings('en'))).toBe('Surrender?');
    expect(voteTitle(view({ kind: 'ready' }), members, strings('zh-CN'))).toBe('就位确认');
    expect(voteTitle(view({ kind: 'kick', target: 'bb' }), members, strings('en'))).toBe('Remove Alex?');
    expect(voteTitle(view({ kind: 'kick', target: 'bb' }), members, strings('zh-CN'))).toBe('移出 Alex？');
  });
});

describe('canAnswer', () => {
  const v = view();

  it('lets a voter who has not answered press a button while the vote is open', () => {
    expect(canAnswer(v, 'cc', false, 50_000)).toBe(true);
  });

  it('turns the buttons off once the result is in, even with time left', () => {
    expect(canAnswer(v, 'cc', true, 50_000)).toBe(false);
  });

  it('turns them off after we answered, after the end, and for a member who is not a voter', () => {
    expect(canAnswer(v, 'aa', false, 50_000)).toBe(false);
    expect(canAnswer(v, 'cc', false, 100_000)).toBe(false);
    expect(canAnswer(v, 'zz', false, 50_000)).toBe(false);
    expect(canAnswer(v, undefined, false, 50_000)).toBe(false);
  });
});

describe('voteStatus', () => {
  const en = strings('en');

  it('says what we answered, even once the vote is over', () => {
    expect(voteStatus(true, false, en)).toBe('You voted yes.');
    expect(voteStatus(false, true, en)).toBe('You voted no.');
  });

  it('says the vote is over when we never answered, and gives no line while the buttons still work', () => {
    expect(voteStatus(undefined, true, en)).toBe('The vote is over.');
    expect(voteStatus(undefined, false, en)).toBeNull();
  });
});
