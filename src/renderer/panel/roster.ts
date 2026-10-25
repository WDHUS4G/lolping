import { strings, type Strings } from '../../shared/i18n';
import type { PanelAction, PanelState } from '../../shared/ipc';
import type { RoomMember } from '../../shared/room';
import type { HistoryLine } from '../../shared/roomHistory';
import { tagColorCss } from '../../shared/roomColors';
import { el } from './vote';

export type MemberFlag = keyof Strings['panelStatus'];

/** Why a member is more than plain "on", most important first; ['on'] when there is nothing to say. */
export function memberFlags(m: RoomMember): MemberFlag[] {
  const flags: MemberFlag[] = [];
  if (m.needsUpdate) flags.push('update');
  if (m.noChat) flags.push('noChat');
  if (m.status === 'paused') flags.push('paused');
  if (m.status === 'muted') flags.push('muted');
  if (m.textOff) flags.push('textOff');
  if (m.votesOff) flags.push('votesOff');
  return flags.length > 0 ? flags : ['on'];
}

/** The tooltip of a member's status icon: every flag on its own line. */
export const statusTip = (flags: readonly MemberFlag[], t: Strings): string =>
  flags.map((f) => t.panelStatus[f]).join('\n');

export interface RowActions {
  /** The name tag posts "<name> - Alive". */
  alive: boolean;
  mute: boolean;
  kick: boolean;
}

/** What a row offers: alive needs room text, kick needs votes, and neither mute nor kick applies to our own row. */
export function rowActions(m: RoomMember, s: Pick<PanelState, 'textOn' | 'votesOn'>): RowActions {
  return { alive: s.textOn, mute: !m.self, kick: s.votesOn && !m.self };
}

export const memberCount = (s: Pick<PanelState, 'room' | 'max'>): string => `${s.room.members.length} / ${s.max}`;

/**
 * The scoreboard's cells, filled down the left column and then the right, like League's two teams.
 * A room of `max` has a cell for everyone who could join; an empty one is null.
 */
export function boardSlots(members: readonly RoomMember[], max: number): (RoomMember | null)[] {
  const cells = Math.max(2, Math.ceil(Math.max(max, members.length) / 2) * 2);
  return Array.from({ length: cells }, (_, i) => members[i] ?? null);
}

/** The letter on a member's portrait: the first character of the name, as one code point. */
export const initial = (name: string): string => ([...name.trim()][0] ?? '?').toUpperCase();

/** Whether a list scrolled to `top` shows its end, so a new line should keep it pinned there. */
export const atBottom = (top: number, clientHeight: number, scrollHeight: number): boolean =>
  scrollHeight - top - clientHeight <= 8;

const SVG_NS = 'http://www.w3.org/2000/svg';
const FLAG_GLYPH: Record<MemberFlag, string> = {
  on: '●', paused: '❚❚', muted: '⊘', update: '⇧', noChat: '!', textOff: 'T', votesOff: 'V',
};

type Tab = 'members' | 'history';
/** The tab stays as it was left, so the panel opens where the player last looked. */
let tab: Tab = 'members';

function speakerIcon(muted: boolean): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  const path = (d: string, stroke: boolean): void => {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    if (stroke) p.setAttribute('fill', 'none');
    svg.append(p);
  };
  path('M2 6h3l4-3v10l-4-3H2z', false);
  if (muted) path('M11.5 6l3.5 4M15 6l-3.5 4', true);
  else path('M11.5 5.5a3.5 3.5 0 0 1 0 5', true);
  return svg;
}

function iconButton(className: string, label: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', `icon ${className}`);
  b.type = 'button';
  b.title = label;
  b.setAttribute('aria-label', label);
  b.addEventListener('click', onClick);
  return b;
}

/** A scoreboard row: the portrait with its status badge, the name tag and how they're connected, then mute and kick. */
function memberRow(m: RoomMember, state: PanelState, t: Strings, act: (a: PanelAction) => void): HTMLElement {
  const can = rowActions(m, state);
  const color = tagColorCss(m.color, m.rgb);
  const row = el('div', `member${m.muted ? ' muted' : ''}${m.self ? ' me' : ''}`);
  row.style.setProperty('--tag', color);

  const flags = memberFlags(m);
  const portrait = el('span', 'portrait', initial(m.name));
  const badge = el('span', `badge ${flags[0]}`, FLAG_GLYPH[flags[0]]);
  badge.title = statusTip(flags, t);
  portrait.append(badge);

  const who = el('div', 'who');
  const tag = el(can.alive ? 'button' : 'span', 'tag', m.name);
  if (tag instanceof HTMLButtonElement) {
    tag.type = 'button';
    tag.title = t.aliveLine(m.name);
    // The app puts the line at the cursor: the page's own screen point is not in DIPs on every display setup.
    tag.addEventListener('click', () => act({ t: 'alive', peer: m.peer }));
  }
  who.append(tag, el('span', 'path', m.self ? t.roomYou : t.roomPath[m.path]));

  const icons = el('div', 'icons');
  if (can.mute) {
    const mute = iconButton(`speaker${m.muted ? ' on' : ''}`, m.muted ? t.roomUnmuteMember : t.roomMuteMember,
      () => act({ t: 'mute', peer: m.peer, on: !m.muted }));
    mute.append(speakerIcon(m.muted));
    icons.append(mute);
  }
  if (can.kick) {
    const kick = iconButton('kick', t.panelKick(m.name), () => act({ t: 'kick', peer: m.peer }));
    kick.textContent = '✕';
    icons.append(kick);
  }
  row.append(portrait, who, icons);
  return row;
}

function emptyRow(): HTMLElement {
  const row = el('div', 'member open');
  row.append(el('span', 'portrait'));
  return row;
}

function historyLine(line: HistoryLine): HTMLElement {
  const row = el('div', `line ${line.kind}`);
  if (line.tag) {
    const who = el('span', 'who', line.tag.name);
    who.style.setProperty('--tag', tagColorCss(line.tag.color, line.tag.rgb));
    row.append(who);
  }
  row.append(el('span', 'said', line.text));
  return row;
}

function voteButton(label: string, kind: 'ff' | 'ready', act: (a: PanelAction) => void): HTMLButtonElement {
  const b = el('button', `lol-button ${kind}`, label);
  b.type = 'button';
  b.addEventListener('click', () => act({ t: 'vote', kind }));
  return b;
}

/** Draws the room panel on League's Tab scoreboard: the tabs on its cap, the vote buttons in its header, then the players or the history. */
export function renderRoster(root: HTMLElement, state: PanelState, act: (a: PanelAction) => void): void {
  const t = strings(state.lang);
  // Redrawing rebuilds the list: keep where it was scrolled, and keep the history pinned to its newest line.
  const found = root.querySelector<HTMLElement>('.list');
  const before = found?.classList.contains(tab) ? found : null;
  const wasAtBottom = before ? atBottom(before.scrollTop, before.clientHeight, before.scrollHeight) : true;
  const wasTop = before?.scrollTop ?? 0;

  const cap = el('header', 'cap');
  const tabButton = (id: Tab, label: string): HTMLButtonElement => {
    const b = el('button', `tab${tab === id ? ' current' : ''}`, label);
    b.type = 'button';
    b.addEventListener('click', () => {
      tab = id;
      renderRoster(root, state, act);
    });
    return b;
  };
  const gem = el('div', 'gem');
  gem.append(el('span', 'count', memberCount(state)));
  cap.append(tabButton('members', t.panelMembers), gem, tabButton('history', t.panelHistory));

  // The vote buttons sit either side of the room code, where the scoreboard shows the team scores.
  const board = el('section', 'board');
  const head = el('div', 'board-head');
  if (state.votesOn) head.append(voteButton(t.panelSurrender, 'ff', act));
  head.append(el('span', 'code', state.room.code ?? ''));
  if (state.votesOn) head.append(voteButton(t.panelReadyCheck, 'ready', act));
  board.append(head);
  const list = el('div', `list lol-scroll ${tab}`);
  if (tab === 'members') {
    const slots = boardSlots(state.room.members, state.max);
    list.style.setProperty('--rows', String(slots.length / 2));
    for (const m of slots) list.append(m ? memberRow(m, state, t, act) : emptyRow());
  } else if (state.history.length === 0) {
    list.append(el('div', 'empty', t.panelHistoryEmpty));
  } else {
    for (const line of state.history) list.append(historyLine(line));
  }
  board.append(list);
  root.replaceChildren(cap, board);
  list.scrollTop = tab === 'history' && wasAtBottom ? list.scrollHeight : wasTop;
}
