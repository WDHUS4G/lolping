/** Name tag colours, picked by index so a peer can never send raw CSS. All read well with the tag's dark outline. */
export const TAG_COLORS: readonly string[] = [
  '#4fc3f7', // sky
  '#ff8a65', // coral
  '#aed581', // lime
  '#ba68c8', // purple
  '#ffd54f', // amber
  '#4db6ac', // teal
  '#f06292', // pink
  '#e0e0e0', // silver
];

export const isTagColor = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) < TAG_COLORS.length;

/**
 * A custom name tag colour: three 0–255 channels. It travels as numbers and never as a string, so a peer still
 * can't put anything of its own into the CSS — `tagColorCss` is the only place a tag colour becomes a style, and
 * it builds the `rgb()` value from validated integers.
 */
export type TagRgb = readonly [number, number, number];

const isChannel = (c: unknown): c is number => Number.isInteger(c) && (c as number) >= 0 && (c as number) <= 255;

export const isTagRgb = (v: unknown): v is TagRgb =>
  Array.isArray(v) && v.length === 3 && isChannel(v[0]) && isChannel(v[1]) && isChannel(v[2]);

/**
 * The tag is text on a dark pill (`rgba(8, 12, 16, .62)` under a black shadow), which is why every palette colour
 * is light. A custom colour can be dark enough to vanish, so anything below this contrast floor is lifted. The
 * value sits just under pure red, so a colour someone would plausibly pick is left alone while genuinely dark
 * ones are rescued — black comes back out at roughly 4.6:1 against the pill. The settings swatch draws the same
 * value, so nothing moves behind the user's back.
 */
export const MIN_TAG_LUMINANCE = 0.2;

const channelLuminance = (c: number): number => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = ([r, g, b]: TagRgb): number =>
  0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);

const mixWithWhite = ([r, g, b]: TagRgb, t: number): TagRgb => [
  Math.round(r + (255 - r) * t),
  Math.round(g + (255 - g) * t),
  Math.round(b + (255 - b) * t),
];

/** The colour as it will actually be drawn: the user's pick, or the same hue lightened until it can be read. */
export function readableTagRgb(rgb: TagRgb): TagRgb {
  if (luminance(rgb) >= MIN_TAG_LUMINANCE) return rgb;
  // Mix towards white until the floor is met: the hue stays put and only the lightness moves.
  let dark = 0;
  let light = 1;
  for (let i = 0; i < 12; i++) {
    const mid = (dark + light) / 2;
    if (luminance(mixWithWhite(rgb, mid)) >= MIN_TAG_LUMINANCE) light = mid;
    else dark = mid;
  }
  return mixWithWhite(rgb, light);
}

const hexToRgb = (hex: string): TagRgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

/** The palette entry closest to a custom colour: what a peer on an older build shows instead. */
export function nearestTagColor(rgb: TagRgb): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  TAG_COLORS.forEach((hex, i) => {
    const [r, g, b] = hexToRgb(hex);
    const distance = (r - rgb[0]) ** 2 + (g - rgb[1]) ** 2 + (b - rgb[2]) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  });
  return best;
}

/**
 * The only place a tag colour becomes CSS. The custom branch clamps first and then builds the value from three
 * integers, so no string that came off the network ever reaches a style.
 */
export function tagColorCss(color: number, rgb?: TagRgb | null): string {
  if (!rgb) return TAG_COLORS[color] ?? TAG_COLORS[0];
  const [r, g, b] = readableTagRgb(rgb);
  return `rgb(${r}, ${g}, ${b})`;
}

/** `#rrggbb`, for a colour picker's value. */
export const tagHex = ([r, g, b]: TagRgb): string =>
  `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;

/**
 * A colour picker's value as channels, or null when it isn't a plain `#rrggbb`. Only ever called on what our own
 * `<input type="color">` produced — nothing that came off the network goes through here.
 */
export function tagRgbFromHex(hex: string): TagRgb | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Whether two custom colours are the same value. They are arrays, so `!==` would call every pair different and
 * re-announce the profile on every settings write.
 */
export const sameTagRgb = (a: TagRgb | null, b: TagRgb | null): boolean =>
  a === b || (a !== null && b !== null && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]);

/**
 * What goes on the wire. `color` is always a palette index, because a peer on an older build rejects a presence
 * whose colour is out of range — and drops the whole member with it. A newer peer prefers `rgb` when it is there.
 */
export function tagWire(color: number, custom: TagRgb | null): { color: number; rgb: TagRgb | null } {
  return custom ? { color: nearestTagColor(custom), rgb: custom } : { color, rgb: null };
}
