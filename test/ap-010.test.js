import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../src/schema.js';
import { renderTimeline } from '../src/render.js';
import { exportHtml } from '../src/export.js';
import { sampleTimeline } from './helpers.js';

test('AP-010 exactly eleven themes are offered in order (v4)', () => {
  assert.deepEqual([...THEMES], ['classic', 'dark', 'minimal', 'block', 'diamond', 'zigzag', 'metro', 'notebook', 'cards', 'newspaper', 'terminal']);
});

test('AP-010 each theme class reaches render and export', () => {
  for (const theme of THEMES) {
    const t = { ...sampleTimeline(), theme };
    assert.ok(renderTimeline(t).includes(`theme-${theme}`), `render ${theme}`);
    assert.ok(exportHtml(t).includes(`theme-${theme}`), `export ${theme}`);
  }
});

test('AP-010 unknown theme falls back to classic in render', () => {
  const html = renderTimeline({ ...sampleTimeline(), theme: 'neon' });
  assert.ok(html.includes('theme-classic'));
  assert.ok(!html.includes('theme-neon'));
});
