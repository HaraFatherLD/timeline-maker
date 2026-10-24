// Colour tokens, per-theme default palettes, quick presets and palette resolution. Pure: no DOM.
// The twelve tokens drive every colour of a timeline through CSS variables (see render.js).
import { THEMES } from './model.js';

/** @typedef {Record<string, string>} Palette token -> #rrggbb */

/** The twelve colour tokens, in the fixed order used for CSS variables and the root style. */
export const PALETTE_TOKENS = Object.freeze([
  'bg', 'title', 'subtitle', 'fg', 'muted', 'line', 'accent', 'dot', 'card', 'edge', 'eraName', 'date',
]);

const unused = (...tokens) => Object.freeze(tokens);

/**
 * Per theme, the tokens its CSS never draws (see theme-css.js); the colour panel hides those rows.
 * Hidden rows are not removed, so a stored value survives a theme switch. Key order follows THEMES.
 * @type {Readonly<Record<string, ReadonlyArray<string>>>}
 */
export const THEME_UNUSED_TOKENS = Object.freeze({
  classic: unused(), dark: unused(), minimal: unused('card', 'edge'), block: unused(), diamond: unused(),
  zigzag: unused(), metro: unused('card', 'edge'), notebook: unused('card'), cards: unused('line'),
  newspaper: unused(), terminal: unused(),
});

/** Tokens the minimal theme never draws (era card background and border); same value as THEME_UNUSED_TOKENS.minimal. */
export const MINIMAL_HIDDEN_TOKENS = THEME_UNUSED_TOKENS.minimal;

/**
 * Tokens the given theme never draws. Unknown themes (including names such as "constructor") have none.
 * @param {unknown} theme
 * @returns {ReadonlyArray<string>}
 */
export function unusedTokens(theme) {
  return THEMES.includes(theme) ? THEME_UNUSED_TOKENS[theme] : [];
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * CSS custom property name of a token: camelCase becomes kebab-case ('eraName' -> '--era-name').
 * @param {string} token
 * @returns {string}
 */
export function cssVar(token) {
  return `--${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

/**
 * True for a string of the form #rrggbb (either case). Non-strings are rejected before the pattern runs,
 * so an array or object that happens to stringify to a colour never passes.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isHex(value) {
  return typeof value === 'string' && HEX_COLOR.test(value);
}

const freezeValues = (map) => Object.freeze(Object.fromEntries(
  Object.entries(map).map(([key, value]) => [key, Object.freeze(value)])));

/**
 * Default colours of each theme. Classic, dark and minimal keep the v2 look: title and era name default to the
 * body colour, the subtitle to the muted colour, the event dot and date to the accent (minimal never draws
 * card/edge). The eight v4 themes have their own original palettes, tuned to their structure (theme-css.js);
 * every pair of text colour and the page or card behind it stays above a 4.5:1 contrast ratio.
 * @type {Readonly<Record<string, Readonly<Palette>>>}
 */
export const THEME_PALETTES = freezeValues({
  classic: {
    bg: '#f6f1e7', title: '#2b2622', subtitle: '#6f655a', fg: '#2b2622', muted: '#6f655a', line: '#cdbfa6',
    accent: '#8a3a2b', dot: '#8a3a2b', card: '#fffdf8', edge: '#e3d8c4', eraName: '#2b2622', date: '#8a3a2b',
  },
  dark: {
    bg: '#0f131b', title: '#e7e9ef', subtitle: '#99a2b4', fg: '#e7e9ef', muted: '#99a2b4', line: '#2b3446',
    accent: '#f0b35a', dot: '#f0b35a', card: '#171c28', edge: '#262e40', eraName: '#e7e9ef', date: '#f0b35a',
  },
  minimal: {
    bg: '#ffffff', title: '#1c1c1e', subtitle: '#6a6e75', fg: '#1c1c1e', muted: '#6a6e75', line: '#d6d8dd',
    accent: '#1c1c1e', dot: '#1c1c1e', card: '#ffffff', edge: '#ffffff', eraName: '#1c1c1e', date: '#1c1c1e',
  },
  block: {
    bg: '#fbf1cf', title: '#111111', subtitle: '#4a4535', fg: '#161616', muted: '#4d4a3d', line: '#161616',
    accent: '#cc211a', dot: '#1f3fbf', card: '#ffffff', edge: '#161616', eraName: '#111111', date: '#b3140d',
  },
  diamond: {
    bg: '#eef2fb', title: '#14213d', subtitle: '#4a5878', fg: '#1b2744', muted: '#4d5a78', line: '#8ea3d6',
    accent: '#2a4fa8', dot: '#b07d12', card: '#ffffff', edge: '#b9c6e6', eraName: '#14213d', date: '#8a5f00',
  },
  zigzag: {
    bg: '#f0faf7', title: '#10312b', subtitle: '#3f6b62', fg: '#17332d', muted: '#4a6a63', line: '#7fd1c3',
    accent: '#c8431c', dot: '#0f8f7d', card: '#ffffff', edge: '#bfe6dd', eraName: '#10312b', date: '#0b6e60',
  },
  metro: {
    bg: '#f1f5f9', title: '#0f2740', subtitle: '#4a617a', fg: '#16283a', muted: '#4b5f73', line: '#1971c2',
    accent: '#1971c2', dot: '#1971c2', card: '#ffffff', edge: '#cbd5e1', eraName: '#0f2740', date: '#1864ab',
  },
  notebook: {
    bg: '#fbf8ef', title: '#1f2d57', subtitle: '#55627f', fg: '#243046', muted: '#56627a', line: '#b8d0e8',
    accent: '#2b4c9b', dot: '#2b4c9b', card: '#fbf8ef', edge: '#e07a7a', eraName: '#1f2d57', date: '#2b4c9b',
  },
  cards: {
    bg: '#e8ecf6', title: '#1d2140', subtitle: '#505a80', fg: '#232846', muted: '#575f82', line: '#c5cde3',
    accent: '#5240d6', dot: '#5240d6', card: '#ffffff', edge: '#c3cbe3', eraName: '#1d2140', date: '#4331b8',
  },
  newspaper: {
    bg: '#e9e2cf', title: '#141414', subtitle: '#4a463c', fg: '#1c1b18', muted: '#4d493f', line: '#2b2a26',
    accent: '#a4161a', dot: '#a4161a', card: '#f3eddc', edge: '#8f8a7a', eraName: '#141414', date: '#8c1216',
  },
  terminal: {
    bg: '#0b100c', title: '#d8ffe2', subtitle: '#86bf94', fg: '#bdf5c9', muted: '#86bf94', line: '#2f6b3f',
    accent: '#3dff86', dot: '#3dd68c', card: '#111a13', edge: '#2f6b3f', eraName: '#e6ffec', date: '#7be495',
  },
});

const preset = (id, label, colors) => Object.freeze({ id, label, colors: Object.freeze(colors) });

/**
 * Six original quick colour combinations. Applying one fills the current theme's twelve colours.
 * @type {ReadonlyArray<{ id: string, label: string, colors: Readonly<Palette> }>}
 */
export const PALETTE_PRESETS = Object.freeze([
  preset('ocean', '바다', {
    bg: '#eef5fa', title: '#0b2e4a', subtitle: '#3d6482', fg: '#16324a', muted: '#4f6b82', line: '#9ec3dc',
    accent: '#0a6fa8', dot: '#1596c9', card: '#ffffff', edge: '#cfe3f1', eraName: '#0b2e4a', date: '#0a6fa8',
  }),
  preset('forest', '숲', {
    bg: '#12201a', title: '#e6f2e4', subtitle: '#a9c4ae', fg: '#dbe9d8', muted: '#9ab59f', line: '#2f4a3a',
    accent: '#7fcf8a', dot: '#c8e86a', card: '#1a2c23', edge: '#2b4538', eraName: '#f0f7ec', date: '#c8e86a',
  }),
  preset('sunset', '노을', {
    bg: '#2a1a3a', title: '#ffe8d6', subtitle: '#e0b5a8', fg: '#f6e3d8', muted: '#cfa89f', line: '#5a3a63',
    accent: '#ff9f6b', dot: '#ff6b8b', card: '#35224a', edge: '#4c3263', eraName: '#fff1e6', date: '#ffb38a',
  }),
  preset('mono', '흑백', {
    bg: '#f4f4f4', title: '#000000', subtitle: '#555555', fg: '#111111', muted: '#5c5c5c', line: '#a8a8a8',
    accent: '#000000', dot: '#333333', card: '#ffffff', edge: '#d2d2d2', eraName: '#000000', date: '#333333',
  }),
  preset('pastel', '파스텔', {
    bg: '#f6f0ff', title: '#3b2f63', subtitle: '#7560a8', fg: '#3f3a5e', muted: '#6c6890', line: '#cbbdf0',
    accent: '#6f4fc9', dot: '#e9729f', card: '#ffffff', edge: '#e1d6f7', eraName: '#3b2f63', date: '#b8386f',
  }),
  preset('parchment', '고문서', {
    bg: '#e9dcb8', title: '#3a2610', subtitle: '#6b5230', fg: '#33260f', muted: '#5e4a2a', line: '#b79f6a',
    accent: '#6b3e12', dot: '#9c2a1a', card: '#f3e9cc', edge: '#cdb98a', eraName: '#3a2610', date: '#8f2a17',
  }),
]);

/**
 * The full twelve-colour palette of a theme with user overrides applied. Returns a new object.
 * Only known tokens whose value passes isHex are applied (lower-cased); an unknown theme means classic.
 * @param {string} theme
 * @param {unknown} overrides token -> colour map for that theme (any other value is ignored)
 * @returns {Palette}
 */
export function resolvePalette(theme, overrides) {
  const palette = { ...THEME_PALETTES[THEMES.includes(theme) ? theme : THEMES[0]] };
  if (overrides === null || typeof overrides !== 'object') return palette;
  for (const token of PALETTE_TOKENS) {
    const color = Object.hasOwn(overrides, token) ? overrides[token] : undefined;
    if (isHex(color)) palette[token] = color.toLowerCase();
  }
  return palette;
}

/**
 * Resolved palette of a timeline's current theme, tolerant of unnormalised input
 * (missing or malformed theme and palettes). Only own properties of `palettes` are read.
 * @param {{ theme?: unknown, palettes?: unknown } | null | undefined} tl
 * @returns {Palette}
 */
export function paletteOf(tl) {
  const theme = THEMES.includes(tl?.theme) ? tl.theme : THEMES[0];
  const all = tl?.palettes;
  const own = all !== null && typeof all === 'object' && Object.hasOwn(all, theme) ? all[theme] : undefined;
  return resolvePalette(theme, own);
}
