import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PALETTE_TOKENS, THEME_PALETTES, PALETTE_PRESETS, resolvePalette } from '../src/palette.js';

const HEX = /^#[0-9a-f]{6}$/;

test('AP-024 every theme palette and preset defines all twelve tokens', () => {
  assert.deepEqual(Object.keys(THEME_PALETTES).sort(), ['classic', 'dark', 'minimal']);
  for (const [name, palette] of Object.entries(THEME_PALETTES)) {
    assert.deepEqual(Object.keys(palette).sort(), [...PALETTE_TOKENS].sort(), name);
    for (const t of PALETTE_TOKENS) assert.match(palette[t], HEX, `${name}.${t}`);
  }
  assert.deepEqual(PALETTE_PRESETS.map((p) => p.id), ['ocean', 'forest', 'sunset', 'mono', 'pastel', 'parchment']);
  assert.deepEqual(PALETTE_PRESETS.map((p) => p.label), ['바다', '숲', '노을', '흑백', '파스텔', '고문서']);
  for (const p of PALETTE_PRESETS) {
    assert.deepEqual(Object.keys(p.colors).sort(), [...PALETTE_TOKENS].sort(), p.id);
    for (const t of PALETTE_TOKENS) assert.match(p.colors[t], HEX, `${p.id}.${t}`);
  }
  assert.equal(new Set(PALETTE_PRESETS.map((p) => p.colors.bg + p.colors.accent)).size, 6, 'presets must differ');
});

test('AP-024 v2 colours are kept as theme defaults', () => {
  assert.equal(THEME_PALETTES.classic.bg, '#f6f1e7');
  assert.equal(THEME_PALETTES.classic.accent, '#8a3a2b');
  assert.equal(THEME_PALETTES.dark.bg, '#0f131b');
  assert.equal(THEME_PALETTES.dark.accent, '#f0b35a');
  assert.equal(THEME_PALETTES.classic.title, THEME_PALETTES.classic.fg);
  assert.equal(THEME_PALETTES.classic.dot, THEME_PALETTES.classic.accent);
});

test('AP-024 resolvePalette merges valid overrides over the theme', () => {
  const r = resolvePalette('dark', { bg: '#000001', title: 'nope', unknown: '#ffffff' });
  assert.equal(r.bg, '#000001');
  assert.equal(r.title, THEME_PALETTES.dark.title);
  assert.ok(!('unknown' in r));
  assert.deepEqual(resolvePalette('neon', undefined), THEME_PALETTES.classic);
  assert.notEqual(resolvePalette('classic', {}), THEME_PALETTES.classic, 'must return a copy');
});
