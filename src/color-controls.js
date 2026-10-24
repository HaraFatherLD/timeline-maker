// Colour controls, built with DOM APIs only: the palette panel (12 tokens + quick presets) and the per-era colour.
// Dragging in a native colour picker commits without rebuilding the form (a rebuild would close the picker).
// Resets and presets rebuild it through `focusOf`, which also names the control that gets focus back.
// All state changes go through the pure palette-edit functions, which validate and lower-case every colour.
import { h, button, THEME_LABELS } from './dom.js';
import { PALETTE_PRESETS, PALETTE_TOKENS, paletteOf, unusedTokens } from './palette.js';
import {
  applyPreset, resetPalette, resetPaletteColor, setEraColor, setPaletteColor,
} from './palette-edit.js';

const THEME_COLOR_TEXT = '테마 색 사용 중';

const TOKEN_LABELS = Object.freeze({
  bg: '바탕', title: '제목 글자', subtitle: '부제 글자', fg: '본문 글자', muted: '보조 글자', line: '세로 선',
  accent: '강조', dot: '사건 점', card: '시대 카드 배경', edge: '시대 카드 테두리',
  eraName: '시대 제목 글자', date: '사건 날짜 글자',
});

// <input type="color"> reporting every change: dragging fires `input`, closing the picker fires `change`.
function colorInput(value, key, onColor) {
  const input = document.createElement('input');
  input.type = 'color';
  input.value = value;
  input.dataset.key = key;
  for (const type of ['input', 'change']) input.addEventListener(type, () => onColor(input.value.toLowerCase()));
  return input;
}

// One palette row: colour input + [기본값]. Rows of tokens the current theme never draws are hidden, not removed.
function tokenRow(token, value, theme, commit) {
  const name = TOKEN_LABELS[token];
  const input = colorInput(value, `color:${token}`, (color) => commit((s) => setPaletteColor(s, s.theme, token, color)));
  input.id = `color-${token}`;
  const reset = button('기본값', () => commit((s) => resetPaletteColor(s, s.theme, token), () => `color:${token}:reset`), {
    label: `${name} 기본값`, key: `color:${token}:reset`,
  });
  const row = h('div', 'color-row', h('label', 'color-label', input, h('span', 'color-name', name)), reset);
  row.hidden = unusedTokens(theme).includes(token);
  return row;
}

// Quick preset button with a tiny swatch (preset background inside a ring in the preset accent colour).
function presetButton(preset, commit) {
  const swatch = h('span', 'swatch');
  swatch.setAttribute('aria-hidden', 'true');
  swatch.style.background = preset.colors.bg;
  swatch.style.borderColor = preset.colors.accent;
  const node = button(preset.label, () => commit((s) => applyPreset(s, s.theme, preset.id), () => `preset:${preset.id}`), {
    key: `preset:${preset.id}`, title: `${preset.label} 색 조합 적용`,
  });
  node.prepend(swatch);
  return node;
}

/**
 * Build the colour panel for the current theme: 12 colour inputs showing the resolved colours (each with a
 * [기본값] button), [모두 기본값] and the quick presets. Everything applies to `state.theme` only.
 * @param {import('./model.js').Timeline} state
 * @param {(transform: (s: object) => object, focusOf?: (next: object) => string) => void} commit
 * @returns {HTMLElement}
 */
export function colorPanel(state, commit) {
  const palette = paletteOf(state);
  const rows = PALETTE_TOKENS.map((token) => tokenRow(token, palette[token], state.theme, commit));
  const resetAll = button('모두 기본값', () => commit((s) => resetPalette(s, s.theme), () => 'colors:reset-all'), {
    key: 'colors:reset-all', label: '색상 모두 기본값',
  });
  return h('section', 'colors',
    h('h2', 'colors-title', '색상'),
    h('p', 'hint', `${THEME_LABELS[state.theme] ?? ''} 테마의 색입니다. 테마마다 따로 저장됩니다.`),
    h('div', 'color-rows', ...rows),
    h('div', 'color-actions', resetAll),
    h('h3', 'colors-subtitle', '빠른 색 조합'),
    h('div', 'preset-row', ...PALETTE_PRESETS.map((p) => presetButton(p, commit))));
}

/**
 * Build the colour control of one era: a colour input, a status text ("테마 색 사용 중" or the #rrggbb value)
 * and a [테마 색] button that clears the era colour. While the era has no colour the input shows the theme accent.
 * @param {import('./model.js').Era} era
 * @param {string} noun accessible name prefix, e.g. "시대 1"
 * @param {string} themeAccent resolved accent colour of the current theme
 * @param {(transform: (s: object) => object, focusOf?: (next: object) => string) => void} commit
 * @returns {HTMLElement}
 */
export function eraColorField(era, noun, themeAccent, commit) {
  const status = h('span', 'color-status', era.color || THEME_COLOR_TEXT);
  const input = colorInput(era.color || themeAccent, `era:${era.id}:color`, (color) => {
    status.textContent = color;
    commit((s) => setEraColor(s, era.id, color));
  });
  input.id = `era-color-${era.id}`;
  input.setAttribute('aria-label', `${noun} 색`);
  const reset = button('테마 색', () => commit((s) => setEraColor(s, era.id, ''), () => `era:${era.id}:color-reset`), {
    label: `${noun} 테마 색`, key: `era:${era.id}:color-reset`,
  });
  return h('div', 'color-field', h('span', 'field-label', '시대 색'), h('div', 'color-line', input, status, reset));
}
