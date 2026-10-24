import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setEraColor, setPaletteColor, resetPaletteColor, resetPalette, applyPreset } from '../src/palette-edit.js';
import { PALETTE_PRESETS, MINIMAL_HIDDEN_TOKENS } from '../src/palette.js';
import { createTimeline, addEra, updateEra } from '../src/model.js';
import { normalizeTimeline } from '../src/schema.js';
import { sampleTimeline, counterId } from './helpers.js';

const base = () => normalizeTimeline(sampleTimeline(), counterId()).value;

test('AP-034 new timelines and eras carry the colour fields', () => {
  assert.deepEqual(createTimeline(), { title: '', subtitle: '', theme: 'classic', palettes: {}, eras: [] });
  const t = addEra(createTimeline(), { name: 'A' }, counterId('e'));
  assert.deepEqual(Object.keys(t.eras[0]), ['id', 'name', 'period', 'description', 'color', 'events']);
  assert.equal(t.eras[0].color, '');
  assert.equal(updateEra(t, 'e1', { color: '#ff0000' }).eras[0].color, '', 'updateEra does not change colour');
});

test('AP-034 setEraColor sets, clears and ignores invalid colours immutably', () => {
  const t0 = base();
  const snap = structuredClone(t0);
  const t1 = setEraColor(t0, 'e2', '#AA0000');
  assert.equal(t1.eras[1].color, '#aa0000');
  assert.equal(t1.eras[0].color, '');
  assert.deepEqual(t0, snap);
  assert.equal(setEraColor(t1, 'e2', '').eras[1].color, '');
  assert.deepEqual(setEraColor(t1, 'e2', 'red'), t1);
  assert.deepEqual(setEraColor(t1, 'nope', '#000000'), t1);
});

test('AP-034 palette colours are set per theme and reset cleanly', () => {
  const t0 = base();
  const t1 = setPaletteColor(t0, 'dark', 'bg', '#0A0A0A');
  assert.deepEqual(t1.palettes, { dark: { bg: '#0a0a0a' } });
  assert.deepEqual(t0.palettes, {});
  for (const bad of [['neon', 'bg', '#000000'], ['dark', 'glow', '#000000'], ['dark', 'bg', 'black'], ['__proto__', 'bg', '#000000']]) {
    assert.deepEqual(setPaletteColor(t1, ...bad), t1, bad.join(' '));
  }
  assert.equal({}.bg, undefined);
  const t2 = setPaletteColor(t1, 'dark', 'date', '#ffcc00');
  assert.deepEqual(resetPaletteColor(t2, 'dark', 'date').palettes, { dark: { bg: '#0a0a0a' } });
  assert.deepEqual(resetPaletteColor(t1, 'dark', 'bg').palettes, {}, 'empty theme entry removed');
  assert.deepEqual(resetPalette(t2, 'dark').palettes, {});
});

test('AP-034 presets fill the current theme with a copy', () => {
  const t1 = applyPreset(base(), 'classic', 'forest');
  const forest = PALETTE_PRESETS.find((p) => p.id === 'forest');
  assert.deepEqual(t1.palettes.classic, forest.colors);
  assert.notEqual(t1.palettes.classic, forest.colors);
  assert.deepEqual(applyPreset(t1, 'classic', 'nope'), t1);
  assert.deepEqual(MINIMAL_HIDDEN_TOKENS, ['card', 'edge']);
});

test('AP-034 theme-scoped edits ignore unknown or prototype theme names', () => {
  const t1 = applyPreset(base(), 'classic', 'ocean');
  for (const theme of ['neon', '__proto__', 'constructor']) {
    assert.deepEqual(applyPreset(t1, theme, 'forest'), t1, theme);
    assert.deepEqual(resetPalette(t1, theme), t1, theme);
    assert.deepEqual(resetPaletteColor(t1, theme, 'bg'), t1, theme);
  }
  assert.equal({}.bg, undefined);
});
