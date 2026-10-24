// Pure colour edits on a Timeline. Inputs are never mutated; invalid input returns a copy with equal content.
// Theme names are checked with THEMES.includes and tokens with a Set: user-supplied keys are never looked
// up on a plain object, so '__proto__' / 'constructor' cannot reach prototypes.
import { THEMES } from './model.js';
import { PALETTE_PRESETS, PALETTE_TOKENS, isHex } from './palette.js';

const TOKEN_SET = new Set(PALETTE_TOKENS);

const unchanged = (tl) => ({ ...tl });
const asMap = (value) => (value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {});
const ownEntry = (map, key) => (Object.hasOwn(map, key) ? map[key] : undefined);
const themeColors = (tl, theme) => asMap(ownEntry(asMap(tl?.palettes), theme));

// Rebuild `palettes` in THEMES order with `colors` stored for `theme`; an empty value removes the theme.
function withThemeColors(tl, theme, colors) {
  const current = asMap(tl?.palettes);
  const entries = THEMES
    .map((name) => [name, asMap(name === theme ? colors : ownEntry(current, name))])
    .filter(([, value]) => Object.keys(value).length > 0);
  return { ...tl, palettes: Object.fromEntries(entries) };
}

/**
 * Set (#rrggbb, stored lower-case) or clear ('') the colour of one era. Anything else changes nothing.
 * @param {import('./model.js').Timeline} tl
 * @param {string} eraId
 * @param {string} color
 * @returns {import('./model.js').Timeline}
 */
export function setEraColor(tl, eraId, color) {
  if (color !== '' && !isHex(color)) return unchanged(tl);
  const next = color.toLowerCase();
  return { ...tl, eras: tl.eras.map((era) => (era.id === eraId ? { ...era, color: next } : era)) };
}

/**
 * Store one palette colour for a theme. The theme, token and colour must all be valid.
 * @param {import('./model.js').Timeline} tl
 * @param {string} theme one of THEMES
 * @param {string} token one of PALETTE_TOKENS
 * @param {string} color #rrggbb (stored lower-case)
 * @returns {import('./model.js').Timeline}
 */
export function setPaletteColor(tl, theme, token, color) {
  if (!THEMES.includes(theme) || !TOKEN_SET.has(token) || !isHex(color)) return unchanged(tl);
  return withThemeColors(tl, theme, { ...themeColors(tl, theme), [token]: color.toLowerCase() });
}

/**
 * Drop one overridden colour of a theme (back to the theme default); an emptied theme entry is removed.
 * @param {import('./model.js').Timeline} tl
 * @param {string} theme one of THEMES
 * @param {string} token one of PALETTE_TOKENS
 * @returns {import('./model.js').Timeline}
 */
export function resetPaletteColor(tl, theme, token) {
  if (!THEMES.includes(theme) || !TOKEN_SET.has(token)) return unchanged(tl);
  const rest = Object.entries(themeColors(tl, theme)).filter(([name]) => name !== token);
  return withThemeColors(tl, theme, Object.fromEntries(rest));
}

/**
 * Drop every overridden colour of a theme.
 * @param {import('./model.js').Timeline} tl
 * @param {string} theme one of THEMES
 * @returns {import('./model.js').Timeline}
 */
export function resetPalette(tl, theme) {
  return THEMES.includes(theme) ? withThemeColors(tl, theme, {}) : unchanged(tl);
}

/**
 * Replace a theme's colours with a copy of a quick preset. Unknown theme or preset id changes nothing.
 * @param {import('./model.js').Timeline} tl
 * @param {string} theme one of THEMES
 * @param {string} presetId id from PALETTE_PRESETS
 * @returns {import('./model.js').Timeline}
 */
export function applyPreset(tl, theme, presetId) {
  const found = THEMES.includes(theme) ? PALETTE_PRESETS.find((p) => p.id === presetId) : undefined;
  return found ? withThemeColors(tl, theme, { ...found.colors }) : unchanged(tl);
}
