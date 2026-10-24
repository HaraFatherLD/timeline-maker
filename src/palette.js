// Colour tokens, per-theme default palettes, quick presets and palette resolution. Pure: no DOM.
// The twelve tokens drive every colour of a timeline through CSS variables (see render.js).
import { THEMES } from './model.js';

/** @typedef {Record<string, string>} Palette token -> #rrggbb */

/** The twelve colour tokens, in the fixed order used for CSS variables and the root style. */
export const PALETTE_TOKENS = Object.freeze([
  'bg', 'title', 'subtitle', 'fg', 'muted', 'line', 'accent', 'dot', 'card', 'edge', 'eraName', 'date',
]);

/** Tokens the minimal theme never draws (era card background and border); the colour panel hides them. */
export const MINIMAL_HIDDEN_TOKENS = Object.freeze(['card', 'edge']);

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
 * Default colours of each theme: the v2 look. Title and era name default to the body colour, the subtitle
 * to the muted colour, the event dot and date to the accent. Minimal never draws card/edge (see render.js).
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
