import type { TextAnswer, TextBoxText } from '../../shared/ipc';
import { MAX_TEXT } from '../../shared/roomProtocol';

const input = document.getElementById('message') as HTMLInputElement;
const count = document.getElementById('count') as HTMLElement;
const hint = document.getElementById('hint') as HTMLElement;
/** The counter shows in the last 20 code points. */
const COUNT_FROM = MAX_TEXT - 20;
let words: TextBoxText | null = null;

const showHint = (message: string, warn: boolean): void => {
  hint.textContent = message;
  hint.classList.toggle('warn', warn);
};

/** A code point is one letter, one Chinese character or one emoji, however many UTF-16 units it takes. */
function clamp(): void {
  const points = [...input.value];
  if (points.length > MAX_TEXT) input.value = points.slice(0, MAX_TEXT).join('');
  const used = Math.min(points.length, MAX_TEXT);
  count.hidden = used < COUNT_FROM;
  count.textContent = `${used}/${MAX_TEXT}`;
  count.classList.toggle('full', used >= MAX_TEXT);
}

/** A held Enter repeats faster than the answer comes back: one submit at a time, or the text would be sent twice. */
let sending = false;

async function send(): Promise<void> {
  if (sending) return;
  sending = true;
  let answer: TextAnswer;
  try {
    answer = await window.textApi.submit(input.value);
  } catch (error) {
    sending = false;
    throw error;
  }
  // 'sent' closes the box: staying locked keeps a held Enter from sending the text again before the window is gone.
  if (answer === 'sent') return;
  sending = false;
  if (answer === 'unknown') showHint(words?.unknown ?? '', true);
  else if (answer === 'votesOff') showHint(words?.votesOff ?? '', true);
}

// While an input method is composing, the box holds a draft: cutting it would break the composition, and Enter confirms it.
input.addEventListener('input', (event) => {
  if (!(event as InputEvent).isComposing) clamp();
  if (words) showHint(words.hint, false);
});
input.addEventListener('compositionend', clamp);
input.addEventListener('keydown', (event) => {
  if (event.isComposing) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    void send();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    window.textApi.cancel();
  } else if (event.key === 'Tab') {
    event.preventDefault(); // focus leaving the box would leave Enter and Esc with nothing to hear them
  }
});

void window.textApi.strings().then((t) => {
  if (!t) return;
  words = t;
  input.placeholder = t.placeholder;
  showHint(t.hint, false);
});
requestAnimationFrame(() => input.focus());
