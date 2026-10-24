import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../src/schema.js';
import { THEME_LABELS } from '../src/dom.js';
import { THEME_PALETTES, THEME_UNUSED_TOKENS, MINIMAL_HIDDEN_TOKENS, PALETTE_TOKENS } from '../src/palette.js';
import { renderTimeline, TIMELINE_CSS } from '../src/render.js';
import { sampleTimeline } from './helpers.js';

const NEW = ['block', 'diamond', 'zigzag', 'metro', 'notebook', 'cards', 'newspaper', 'terminal'];

test('AP-035 every theme has a unique Korean label', () => {
  assert.deepEqual(Object.keys(THEME_LABELS), [...THEMES]);
  assert.deepEqual(Object.values(THEME_LABELS), ['클래식', '다크', '미니멀', '블록', '다이아', '지그재그', '노선도', '노트', '카드 배지', '신문', '터미널']);
});

test('AP-035 theme default palettes are complete and distinct', () => {
  const combos = new Set();
  for (const theme of THEMES) {
    for (const t of PALETTE_TOKENS) assert.match(THEME_PALETTES[theme][t], /^#[0-9a-f]{6}$/, `${theme}.${t}`);
    combos.add(`${THEME_PALETTES[theme].bg}/${THEME_PALETTES[theme].accent}`);
  }
  assert.equal(combos.size, THEMES.length, 'each theme needs its own bg/accent pair');
});

test('AP-035 unused tokens are declared per theme', () => {
  assert.deepEqual(Object.keys(THEME_UNUSED_TOKENS).sort(), [...THEMES].sort());
  assert.deepEqual(THEME_UNUSED_TOKENS.minimal, ['card', 'edge']);
  assert.deepEqual(THEME_UNUSED_TOKENS.cards, ['line']);
  assert.deepEqual(THEME_UNUSED_TOKENS.metro, ['card', 'edge']);
  assert.deepEqual(THEME_UNUSED_TOKENS.notebook, ['card']);
  const special = new Set(['minimal', 'cards', 'metro', 'notebook']);
  for (const theme of THEMES.filter((t) => !special.has(t))) assert.deepEqual(THEME_UNUSED_TOKENS[theme], [], theme);
  assert.deepEqual(MINIMAL_HIDDEN_TOKENS, THEME_UNUSED_TOKENS.minimal);
});

test('AP-035 each new theme styles its own era and event markers', () => {
  for (const theme of NEW) {
    assert.ok(TIMELINE_CSS.includes(`.theme-${theme} .tl-era::before`), `${theme}: era marker rule`);
    assert.ok(TIMELINE_CSS.includes(`.theme-${theme} .tl-event::before`), `${theme}: event marker rule`);
  }
  // Each new theme's era marker rule must have a real body, and the bodies must differ.
  const bodies = new Set();
  for (const theme of NEW) {
    const m = TIMELINE_CSS.match(new RegExp(`\\.theme-${theme} \\.tl-era::before\\{([^}]+)\\}`));
    assert.ok(m && m[1].trim().length > 10, `${theme}: era marker rule has a real body`);
    bodies.add(m[1].replace(/\s+/g, ''));
  }
  assert.equal(bodies.size, NEW.length, 'era marker rules differ between themes');
  // zigzag collapses to one column when its own area is <= 600px wide: a container query (one level of nested rules)...
  const container = TIMELINE_CSS.match(/@container \(max-width:\s*600px\)\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g) || [];
  assert.ok(container.some((block) => block.includes('.theme-zigzag')), 'zigzag collapses to one column on a narrow container');
  // ...and where container queries are unsupported, a 640px viewport media block must still mention zigzag.
  const media = TIMELINE_CSS.match(/@media \(max-width:\s*640px\)\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g) || [];
  assert.ok(media.some((block) => block.includes('.theme-zigzag')), 'zigzag collapses to one column on narrow viewports (fallback)');
  assert.ok(TIMELINE_CSS.includes('@supports not (container-type:inline-size){@media'), 'the viewport fallback applies only without container queries');
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(TIMELINE_CSS), 'still no hex literals');
});

test('AP-035 markup stays the same across themes; only the root class changes', () => {
  const strip = (html) => html.replace(/^<div class="tl theme-[a-z]+" style="[^"]*">/, '');
  const base = strip(renderTimeline({ ...sampleTimeline(), theme: 'classic' }));
  for (const theme of NEW) {
    const html = renderTimeline({ ...sampleTimeline(), theme });
    assert.match(html, new RegExp(`^<div class="tl theme-${theme}"`), theme);
    assert.equal(strip(html), base, `${theme}: inner markup must match classic`);
  }
  assert.match(renderTimeline({ ...sampleTimeline(), theme: 'retro' }), /^<div class="tl theme-classic"/);
});
