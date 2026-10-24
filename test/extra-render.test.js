// Extra coverage beyond the AP tests: markup structure, CSS self-containment, file names.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderTimeline, TIMELINE_CSS } from '../src/render.js';
import { exportHtml, safeFilename } from '../src/export.js';
import { exampleTimeline } from '../src/example.js';
import { THEMES } from '../src/schema.js';
import { sampleTimeline, counterId } from './helpers.js';

const FORBIDDEN = ['<script', '<link', 'src=', 'href=', 'url(', '@import'];
const count = (text, needle) => text.split(needle).length - 1;

test('extra: rendered markup is balanced and ordered as header, eras, events', () => {
  const html = renderTimeline(exampleTimeline(counterId()));
  for (const tag of ['div', 'ol', 'li', 'header']) {
    assert.equal(count(html, `<${tag}`), count(html, `</${tag}>`), `<${tag}> balance`);
  }
  assert.ok(html.indexOf('tl-head') < html.indexOf('tl-eras'));
  assert.ok(html.indexOf('tl-era-head') < html.indexOf('tl-events'));
});

test('extra: render tolerates missing and partial input without throwing', () => {
  for (const tl of [undefined, null, {}, { eras: null }, { eras: [null, {}, { events: [null, {}] }] }]) {
    assert.doesNotThrow(() => renderTimeline(tl));
    assert.match(renderTimeline(tl), /^<div class="tl theme-classic" style="--bg:#[0-9a-f]{6};/);
  }
});

test('extra: the header is omitted for an empty title and subtitle', () => {
  const html = renderTimeline({ title: '', subtitle: '', theme: 'dark', eras: [] });
  assert.match(html, /^<div class="tl theme-dark" style="[^"]*"><\/div>$/);
});

test('extra: newlines in descriptions survive (CSS pre-line shows them)', () => {
  const t = sampleTimeline();
  t.eras[0].description = 'line one\nline two';
  assert.ok(renderTimeline(t).includes('line one\nline two'));
  assert.match(TIMELINE_CSS, /white-space:pre-line/);
});

test('extra: the shared CSS is self-contained and covers every theme', () => {
  const css = TIMELINE_CSS.toLowerCase();
  for (const bad of [...FORBIDDEN, '</style', 'http:', 'https:', '@font-face']) {
    assert.ok(!css.includes(bad), `CSS contains ${bad}`);
  }
  for (const theme of THEMES) assert.ok(css.includes(`.theme-${theme}`) || theme === 'classic', theme);
  assert.ok(css.includes('.tl{'), 'base (classic) rules present');
});

test('extra: exports of every theme and of an empty timeline have no forbidden pattern', () => {
  const docs = THEMES.map((theme) => exportHtml({ ...sampleTimeline(), theme }));
  docs.push(exportHtml({ title: '', subtitle: '', theme: 'classic', eras: [] }));
  for (const doc of docs) {
    for (const bad of FORBIDDEN) assert.ok(!doc.toLowerCase().includes(bad), bad);
    assert.equal(count(doc, '<style>'), 1);
    assert.equal(count(doc, '<body>'), 1);
  }
});

test('extra: export title falls back for blank titles and is trimmed otherwise', () => {
  const blank = exportHtml({ title: '   ', subtitle: '', theme: 'classic', eras: [] });
  assert.match(blank, /<title>타임라인<\/title>/);
  assert.match(exportHtml({ ...sampleTimeline(), title: '  Padded  ' }), /<title>Padded<\/title>/);
});

test('extra: export is deterministic and does not touch its input', () => {
  const t = Object.freeze(sampleTimeline());
  assert.equal(exportHtml(t), exportHtml(t));
});

test('extra: safeFilename handles reserved names with an extension', () => {
  assert.equal(safeFilename('con.backup'), 'con_.backup.html');
  assert.equal(safeFilename('Nul.txt'), 'Nul_.txt.html');
  assert.equal(safeFilename('com10'), 'com10.html');
  assert.equal(safeFilename('my.con'), 'my.con.html');
});

test('extra: safeFilename re-trims after the length cap and never splits a surrogate pair', () => {
  assert.equal(safeFilename('a'.repeat(99) + '.b'), 'a'.repeat(99) + '.html');
  const emoji = 'a'.repeat(99) + '\u{1F600}';
  assert.equal(safeFilename(emoji), 'a'.repeat(99) + '.html');
});

test('extra: safeFilename strips bidi overrides and non-string input is ignored', () => {
  assert.equal(safeFilename('report‮txt'), 'reporttxt.html');
  for (const v of [42, {}, [], true]) assert.equal(safeFilename(v), 'timeline.html');
});

test('extra: safeFilename output never contains a forbidden character', () => {
  let all = '';
  for (let cp = 0; cp < 0xa0; cp++) all += String.fromCharCode(cp);
  const name = safeFilename(`x${all}y`);
  assert.ok(!/[\\/:*?"<>|\u0000-\u001f\u007f-\u009f]/.test(name));
  assert.ok(name.endsWith('.html'));
});
