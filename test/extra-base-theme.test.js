// Regression guard for v4 (eight themes added with CSS only): classic, dark and minimal must look exactly as
// they did in v3. The snapshot lives in pre-v4-snapshot.js (taken from git HEAD before v4 was committed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../src/schema.js';
import { THEME_PALETTES } from '../src/palette.js';
import { renderTimeline, TIMELINE_CSS } from '../src/render.js';
import { PRE_V4_BASE_CSS, PRE_V4_PALETTES } from './pre-v4-snapshot.js';
import { sampleTimeline } from './helpers.js';

const ORIGINAL = ['classic', 'dark', 'minimal'];
const NEW = THEMES.slice(3);

// Text in front of every `{` (rule selectors and at-rule headers), outermost first.
function heads(css) {
  const found = [];
  for (let open = css.indexOf('{'); open >= 0; open = css.indexOf('{', open + 1)) {
    const start = Math.max(css.lastIndexOf('}', open), css.lastIndexOf('{', open - 1)) + 1;
    found.push(css.slice(start, open).trim());
  }
  return found;
}

test('extra: TIMELINE_CSS still starts with the exact v3 stylesheet', () => {
  assert.equal(TIMELINE_CSS.slice(0, PRE_V4_BASE_CSS.length), PRE_V4_BASE_CSS);
});

test('extra: everything after the v3 stylesheet is scoped to the new themes', () => {
  const tail = TIMELINE_CSS.slice(PRE_V4_BASE_CSS.length);
  const atRules = [];
  for (const head of heads(tail)) {
    if (head.startsWith('@')) {
      atRules.push(head);
      continue;
    }
    for (const selector of head.split(',')) {
      assert.ok(NEW.some((id) => selector.includes(`.theme-${id}`)), `rule is not scoped to a new theme: ${selector}`);
      for (const old of ORIGINAL) assert.ok(!selector.includes(`.theme-${old}`), `rule touches ${old}: ${selector}`);
    }
  }
  assert.deepEqual(atRules, [
    '@container (max-width:600px)',
    '@supports not (container-type:inline-size)',
    '@media (max-width:640px)',
    '@media print',
  ]);
});

test('extra: classic, dark and minimal keep their v3 default colours', () => {
  assert.deepEqual(Object.keys(PRE_V4_PALETTES), ORIGINAL);
  for (const theme of ORIGINAL) assert.deepEqual({ ...THEME_PALETTES[theme] }, PRE_V4_PALETTES[theme], theme);
});

test('extra: the three original themes still render with their root class and v3 palette variables', () => {
  for (const theme of ORIGINAL) {
    const html = renderTimeline({ ...sampleTimeline(), theme });
    assert.ok(html.startsWith(`<div class="tl theme-${theme}" style="--bg:${PRE_V4_PALETTES[theme].bg};`), theme);
  }
});
