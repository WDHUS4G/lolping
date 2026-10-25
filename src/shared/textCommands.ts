import { sanitizeText } from './roomProtocol';

/** What the text box produced: a message to show, one of the vote commands, or nothing usable. */
export type TextInput =
  | { kind: 'text'; text: string }
  | { kind: 'ff' }
  | { kind: 'noff' }
  | { kind: 'ready' }
  | { kind: 'unknown' }
  | { kind: 'empty' };

/** Commands start with a slash and match as a whole word; /surrender is the long form of /ff. */
export function parseTextInput(raw: string): TextInput {
  const text = sanitizeText(raw);
  if (text === '') return { kind: 'empty' };
  if (!text.startsWith('/')) return { kind: 'text', text };
  switch (text.toLowerCase()) {
    case '/ff':
    case '/surrender':
      return { kind: 'ff' };
    case '/noff':
      return { kind: 'noff' };
    case '/ready':
      return { kind: 'ready' };
    default:
      return { kind: 'unknown' };
  }
}
