import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../src/escape.js';
import { renderTimeline } from '../src/render.js';
import { exportHtml } from '../src/export.js';
import { parseTimelineJson } from '../src/schema.js';
import { sampleTimeline, counterId } from './helpers.js';

const PAYLOADS = [
  '<script>alert(1)</script>',
  '"><img src=x onerror=alert(1)>',
  "' onmouseover='x",
];

const FIELDS = [
  (t, p) => { t.title = p; },
  (t, p) => { t.subtitle = p; },
  (t, p) => { t.eras[0].name = p; },
  (t, p) => { t.eras[0].period = p; },
  (t, p) => { t.eras[0].description = p; },
  (t, p) => { t.eras[0].events[0].date = p; },
  (t, p) => { t.eras[0].events[0].title = p; },
  (t, p) => { t.eras[0].events[0].description = p; },
  (t, p) => { t.eras[0].id = p; },
  (t, p) => { t.eras[0].events[0].id = p; },
  (t, p) => { t.theme = p; },
];

function assertSafe(html, label) {
  assert.ok(!html.includes('<script>alert'), `${label}: raw <script> leaked`);
  assert.ok(!html.includes('<img'), `${label}: raw <img leaked`);
  assert.ok(!html.includes("' onmouseover='"), `${label}: attribute breakout`);
}

test('AP-006 escapeHtml escapes the five special characters', () => {
  assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
  assert.equal(escapeHtml(42), '42');
  assert.equal(escapeHtml(undefined), '');
});

test('AP-006 every field x payload is escaped in render and export', () => {
  for (const [i, set] of FIELDS.entries()) {
    for (const p of PAYLOADS) {
      const t = sampleTimeline();
      set(t, p);
      assertSafe(renderTimeline(t), `render field#${i}`);
      const doc = exportHtml(t);
      assertSafe(doc, `export field#${i}`);
      const titleTag = doc.match(/<title>([\s\S]*?)<\/title>/);
      assert.ok(titleTag, 'export must contain <title>');
      assert.ok(!/[<>"']/.test(titleTag[1]), `export <title> unescaped for field#${i}`);
    }
  }
});

test('AP-006 JSON load sanitises id and theme injection', () => {
  const raw = sampleTimeline();
  raw.theme = '"><script>alert(1)</script>';
  raw.eras[0].id = '"><script>alert(1)</script>';
  raw.eras[0].events[0].id = '"><img src=x onerror=1>';
  const res = parseTimelineJson(JSON.stringify(raw), counterId('new'));
  assert.equal(res.ok, true);
  assert.equal(res.value.theme, 'classic');
  assert.match(res.value.eras[0].id, /^[A-Za-z0-9_-]{1,64}$/);
  assert.match(res.value.eras[0].events[0].id, /^[A-Za-z0-9_-]{1,64}$/);
  assertSafe(renderTimeline(res.value), 'render after load');
});
