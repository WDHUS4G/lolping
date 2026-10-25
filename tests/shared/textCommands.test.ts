import { describe, expect, it } from 'vitest';
import { MAX_TEXT } from '../../src/shared/roomProtocol';
import { parseTextInput } from '../../src/shared/textCommands';

describe('parseTextInput', () => {
  it('reads /ff and /surrender, in any case and with spaces around', () => {
    expect(parseTextInput('/ff')).toEqual({ kind: 'ff' });
    expect(parseTextInput(' /FF ')).toEqual({ kind: 'ff' });
    expect(parseTextInput('/surrender')).toEqual({ kind: 'ff' });
  });

  it('reads /noff and /ready', () => {
    expect(parseTextInput('/noff')).toEqual({ kind: 'noff' });
    expect(parseTextInput('/ready')).toEqual({ kind: 'ready' });
  });

  it('calls any other slash word unknown', () => {
    expect(parseTextInput('/remake')).toEqual({ kind: 'unknown' });
    expect(parseTextInput('/')).toEqual({ kind: 'unknown' });
    expect(parseTextInput('/ff now')).toEqual({ kind: 'unknown' });
  });

  it('calls blank or invisible input empty', () => {
    expect(parseTextInput('   ')).toEqual({ kind: 'empty' });
    expect(parseTextInput('\u200b')).toEqual({ kind: 'empty' });
    expect(parseTextInput('')).toEqual({ kind: 'empty' });
  });

  it('keeps plain words as text, including "ff" without a slash', () => {
    expect(parseTextInput('gg wp')).toEqual({ kind: 'text', text: 'gg wp' });
    expect(parseTextInput('ff')).toEqual({ kind: 'text', text: 'ff' });
  });

  it('cuts long text to the message limit', () => {
    const r = parseTextInput('a'.repeat(130));
    expect(r).toEqual({ kind: 'text', text: 'a'.repeat(MAX_TEXT) });
    expect([...(r.kind === 'text' ? r.text : '')]).toHaveLength(120);
  });
});
