// Extra coverage for the v4 structural themes: CSS shape per design, scoping and ordering, the zigzag
// container query with its viewport fallback, font stacks, narrow/print safety, the unused-token helper and
// default-palette readability. String checks only (no browser).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../src/schema.js';
import { THEME_PALETTES, THEME_UNUSED_TOKENS, PALETTE_TOKENS, unusedTokens } from '../src/palette.js';
import { TIMELINE_CSS } from '../src/render.js';
import { THEME_CSS, THEME_MEDIA_CSS } from '../src/theme-css.js';

const NEW = THEMES.slice(3);
const HANGUL_FONTS = [
  'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Noto Serif KR', 'Noto Serif CJK KR', 'Nanum Myeongjo', 'Batang',
];
const CONTAINER_OPEN = '@container (max-width:600px){';
const FALLBACK_OPEN = '@supports not (container-type:inline-size){@media (max-width:640px){';

// Declarations of the first rule with exactly this selector ('' when there is none).
function rule(selector) {
  const start = TIMELINE_CSS.indexOf(`${selector}{`);
  if (start < 0) return '';
  const from = start + selector.length + 1;
  return TIMELINE_CSS.slice(from, TIMELINE_CSS.indexOf('}', from));
}
const has = (selector, text) => assert.ok(rule(selector).includes(text), `${selector} should contain ${text}`);

// Text after `open` up to the first closing brace that starts a line ('' when `open` is missing).
function bodyAfter(open) {
  const from = TIMELINE_CSS.indexOf(open);
  return from < 0 ? '' : TIMELINE_CSS.slice(from + open.length, TIMELINE_CSS.indexOf('\n}', from));
}

// Every font stack the stylesheet sets: the `font-family` values and the `font` shorthand of .tl.
function fontStacks(css) {
  const stacks = [];
  for (const marker of ['font-family:', 'font:16px/1.7 ']) {
    for (let at = css.indexOf(marker); at >= 0; at = css.indexOf(marker, at + 1)) {
      const from = at + marker.length;
      const ends = [css.indexOf(';', from), css.indexOf('}', from)].filter((i) => i >= 0);
      stacks.push(css.slice(from, Math.min(...ends)));
    }
  }
  return stacks;
}
const namesOf = (stack) => stack.split(',').map((name) => name.trim().replaceAll('"', ''));

const channel = (n) => (n / 255 <= 0.03928 ? n / 255 / 12.92 : ((n / 255 + 0.055) / 1.055) ** 2.4);
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('extra: unusedTokens reads the per-theme table and ignores unknown names', () => {
  assert.deepEqual(unusedTokens('cards'), ['line']);
  assert.deepEqual(unusedTokens('metro'), ['card', 'edge']);
  assert.deepEqual(unusedTokens('terminal'), []);
  for (const name of ['neon', 'constructor', '__proto__', 'toString', undefined, 7, ['cards']]) {
    assert.deepEqual(unusedTokens(name), [], String(name));
  }
  for (const theme of THEMES) {
    for (const token of THEME_UNUSED_TOKENS[theme]) assert.ok(PALETTE_TOKENS.includes(token), `${theme}.${token}`);
  }
});

test('extra: structural CSS is scoped per theme, in THEMES order, after the base and before the media rules', () => {
  assert.deepEqual(Object.keys(THEME_CSS), NEW);
  for (const id of NEW) {
    const lines = THEME_CSS[id].split('\n').filter(Boolean);
    assert.ok(lines.length >= 5, `${id} has its own rules`);
    for (const line of lines) assert.ok(line.startsWith(`.theme-${id}`), `${id}: ${line.slice(0, 40)}`);
  }
  assert.ok(TIMELINE_CSS.indexOf('.theme-block') > TIMELINE_CSS.indexOf('.theme-minimal'));
  assert.ok(TIMELINE_CSS.endsWith(THEME_MEDIA_CSS));
  const zigzagBase = TIMELINE_CSS.lastIndexOf('.theme-zigzag .tl-event::before{left:2px');
  assert.ok(zigzagBase > 0, 'zigzag base rules exist');
  assert.ok(TIMELINE_CSS.indexOf(CONTAINER_OPEN) > zigzagBase, 'container rule follows the zigzag base rules');
  assert.ok(TIMELINE_CSS.indexOf(FALLBACK_OPEN) > zigzagBase, 'viewport fallback follows the zigzag base rules');
});

test('extra: zigzag collapses on its own width (container query) and keeps an identical viewport fallback', () => {
  has('.theme-zigzag', 'container-type:inline-size');
  for (const id of NEW.filter((theme) => theme !== 'zigzag')) assert.ok(!THEME_CSS[id].includes('container'), `${id} is not a container`);
  assert.equal(TIMELINE_CSS.split('container-type').length - 1, 2, 'only the zigzag declaration and the @supports test');
  const viaContainer = bodyAfter(CONTAINER_OPEN);
  const viaViewport = bodyAfter(FALLBACK_OPEN);
  assert.ok(viaContainer.includes('.theme-zigzag .tl-eras{padding-left:48px}'), 'one-column rules are present');
  assert.equal(viaViewport, viaContainer, 'the fallback reuses the same rule body');
  for (const line of viaContainer.split('\n').filter(Boolean)) assert.ok(line.startsWith('.theme-zigzag'), `only zigzag: ${line.slice(0, 40)}`);
  assert.equal(TIMELINE_CSS.split('@media (max-width:640px)').length - 1, 1, 'the only 640px media block is the @supports fallback');
});

test('extra: zigzag keeps the base card padding so the 520px mobile padding still applies', () => {
  const head = rule('.theme-zigzag .tl-era-head');
  assert.ok(head.includes('border-radius:18px'), 'still a rounded card');
  assert.ok(!head.includes('padding'), 'no padding override: the base and the 520px rules decide');
});

test('extra: each structural theme has the shape its design calls for', () => {
  has('.theme-block .tl-era::before', 'border-radius:0');
  has('.theme-block .tl-eras::before', 'width:8px');
  has('.theme-diamond .tl-era::before', 'rotate(45deg)');
  has('.theme-diamond .tl-event::before', 'rotate(45deg)');
  has('.theme-diamond .tl-eras::before', 'repeating-linear-gradient');
  has('.theme-zigzag .tl-eras::before', 'left:50%');
  assert.ok(TIMELINE_CSS.includes('.theme-zigzag .tl-era:nth-child(odd)::before'));
  assert.ok(TIMELINE_CSS.includes('.theme-zigzag .tl-era:nth-child(even)::before'));
  const metroWidth = Number(rule('.theme-metro .tl-eras::before').match(/width:([0-9]+)px/)[1]);
  assert.ok(metroWidth >= 10, `metro line is ${metroWidth}px`);
  has('.theme-metro .tl-era::before', 'box-shadow:inset');
  has('.theme-notebook', 'repeating-linear-gradient');
  has('.theme-notebook', 'var(--line)');
  has('.theme-notebook .tl-eras::before', 'var(--edge)');
  has('.theme-notebook .tl-era-head', 'background:none');
  has('.theme-cards .tl-eras', 'counter-reset');
  has('.theme-cards .tl-eras::before', 'display:none');
  has('.theme-cards .tl-era::before', 'counter-increment');
  has('.theme-cards .tl-era::before', 'content:counter(');
  has('.theme-cards .tl-era', 'box-shadow');
  has('.theme-newspaper .tl-head', 'double');
  has('.theme-newspaper .tl-era-head', 'double');
  has('.theme-newspaper .tl-era-period', 'border:');
  has('.theme-newspaper .tl-event::before', 'content:"▸"');
  has('.theme-terminal', 'monospace');
  has('.theme-terminal .tl-era::before', 'content:">"');
  has('.theme-terminal .tl-event::before', 'content:"-"');
  has('.theme-terminal .tl-eras::before', 'dashed');
  has('.theme-terminal .tl-era-head', 'dashed');
});

test('extra: every font stack names a Hangul font before its generic family', () => {
  const stacks = fontStacks(TIMELINE_CSS);
  assert.ok(stacks.length >= 9, `found ${stacks.length} font stacks`);
  for (const stack of stacks) {
    const names = namesOf(stack);
    const generic = names.pop();
    assert.ok(['serif', 'sans-serif', 'monospace'].includes(generic), `a generic family comes last: ${stack}`);
    assert.ok(names.some((name) => HANGUL_FONTS.includes(name)), `no Hangul font before ${generic}: ${stack.slice(0, 50)}`);
  }
});

test('extra: the terminal stack puts the Hangul fonts right before monospace', () => {
  const stack = rule('.theme-terminal').split('font-family:')[1].split(';')[0];
  assert.deepEqual(namesOf(stack).slice(-4), ['Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', 'monospace']);
});

test('extra: structural CSS cannot clip or force sideways scroll, and print keeps the markers', () => {
  const css = Object.values(THEME_CSS).join('') + THEME_MEDIA_CSS;
  const backslash = String.fromCharCode(92);
  for (const bad of ['overflow:hidden', 'white-space:nowrap', 'position:fixed', 'min-width', 'url(', '@import', backslash]) {
    assert.ok(!css.includes(bad), `structural CSS contains ${bad}`);
  }
  const print = THEME_MEDIA_CSS.slice(THEME_MEDIA_CSS.indexOf('@media print'));
  for (const id of NEW) assert.ok(print.includes(`.theme-${id}`), `${id} is in the print rule`);
  assert.ok(print.includes('print-color-adjust:exact'));
});

test('extra: new theme default palettes keep text readable on the page and on the card', () => {
  for (const theme of NEW) {
    const p = THEME_PALETTES[theme];
    for (const token of ['title', 'subtitle', 'fg', 'muted', 'eraName', 'date', 'accent']) {
      assert.ok(contrast(p[token], p.bg) >= 4.5, `${theme}.${token} on bg`);
    }
    if (unusedTokens(theme).includes('card')) continue;
    for (const token of ['eraName', 'accent', 'fg']) assert.ok(contrast(p[token], p.card) >= 4.5, `${theme}.${token} on card`);
  }
});
