import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderTimeline, TIMELINE_CSS } from '../src/render.js';
import { PALETTE_TOKENS, THEME_PALETTES, cssVar } from '../src/palette.js';
import { normalizeTimeline } from '../src/schema.js';
import { sampleTimeline, counterId } from './helpers.js';

const render = (patch) => renderTimeline(normalizeTimeline({ ...sampleTimeline(), ...patch }, counterId()).value);
const rootStyle = (html) => html.match(/^<div class="tl theme-[a-z]+" style="([^"]*)">/)[1];

test('AP-023 token list and CSS variable names', () => {
  assert.deepEqual(PALETTE_TOKENS, ['bg', 'title', 'subtitle', 'fg', 'muted', 'line', 'accent', 'dot', 'card', 'edge', 'eraName', 'date']);
  assert.equal(cssVar('eraName'), '--era-name');
  assert.equal(cssVar('bg'), '--bg');
});

test('AP-023 the root always carries all twelve variables in token order', () => {
  for (const theme of ['classic', 'dark', 'minimal']) {
    const style = rootStyle(render({ theme }));
    const expected = PALETTE_TOKENS.map((t) => `${cssVar(t)}:${THEME_PALETTES[theme][t]}`).join(';');
    assert.equal(style, expected, theme);
  }
});

test('AP-023 overrides apply only to their own theme', () => {
  const palettes = { dark: { bg: '#010203', eraName: '#a0b0c0' } };
  const dark = rootStyle(render({ theme: 'dark', palettes }));
  assert.ok(dark.includes('--bg:#010203') && dark.includes('--era-name:#a0b0c0'));
  assert.ok(dark.includes(`--line:${THEME_PALETTES.dark.line}`), 'untouched tokens keep the theme default');
  const classic = rootStyle(render({ theme: 'classic', palettes }));
  assert.ok(classic.includes(`--bg:${THEME_PALETTES.classic.bg}`));
  assert.ok(rootStyle(renderTimeline({ ...sampleTimeline(), theme: 'neon' })).includes(`--bg:${THEME_PALETTES.classic.bg}`));
});

test('AP-023 an era colour overrides accent, dot and date on that era only', () => {
  const t = sampleTimeline();
  t.eras[1].color = '#3366cc';
  const html = renderTimeline(normalizeTimeline(t, counterId()).value);
  const eras = html.match(/<li class="tl-era"[^>]*>/g);
  assert.equal(eras[1], '<li class="tl-era" style="--accent:#3366cc;--dot:#3366cc;--date:#3366cc">');
  assert.equal(eras[0], '<li class="tl-era">');
  assert.equal(eras[2], '<li class="tl-era">');
});

test('AP-023 the stylesheet uses every variable and theme classes hold no colours', () => {
  for (const t of PALETTE_TOKENS) assert.ok(TIMELINE_CSS.includes(`var(${cssVar(t)})`), `css must use ${cssVar(t)}`);
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(TIMELINE_CSS), 'no hex colour literals anywhere in the stylesheet');
  for (const cls of ['.tl{', '.theme-dark', '.theme-minimal']) assert.ok(TIMELINE_CSS.includes(cls), cls);
  for (const bad of ['url(', '@import']) assert.ok(!TIMELINE_CSS.includes(bad), bad);
});

test('AP-023 rendering re-validates colours even for unnormalised input', () => {
  const tl = { ...sampleTimeline(), palettes: { classic: { bg: 'red;background:blue', title: '#ABCDEF', line: '#123' } } };
  tl.eras[0].color = '#000000;background:url(x)';
  tl.eras[1].color = '#AbCdEf';
  const html = renderTimeline(tl);
  const style = rootStyle(html);
  assert.ok(style.includes(`--bg:${THEME_PALETTES.classic.bg}`), 'invalid bg ignored');
  assert.ok(style.includes('--title:#abcdef'), 'valid override lower-cased');
  assert.ok(style.includes(`--line:${THEME_PALETTES.classic.line}`), 'short hex ignored');
  assert.ok(!html.includes('background:'), 'no injected declarations');
  const eras = html.match(/<li class="tl-era"[^>]*>/g);
  assert.equal(eras[0], '<li class="tl-era">');
  assert.equal(eras[1], '<li class="tl-era" style="--accent:#abcdef;--dot:#abcdef;--date:#abcdef">');
});

test('AP-023 non-string colour values are rejected even if they stringify to a hex', () => {
  const tl = { ...sampleTimeline(), palettes: { classic: { bg: ['#123456'], title: { toString: () => '#654321' } } } };
  tl.eras[0].color = ['#abcdef'];
  const html = renderTimeline(tl);
  assert.ok(rootStyle(html).includes(`--bg:${THEME_PALETTES.classic.bg}`));
  assert.ok(!html.includes('#654321') && !html.includes('#abcdef'));
});
