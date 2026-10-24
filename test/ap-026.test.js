import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeTimeline, parseTimelineJson, normalizeTimeline } from '../src/schema.js';
import { sampleTimeline, counterId } from './helpers.js';

test('AP-026 colours survive a save and load round trip', () => {
  const t = sampleTimeline();
  t.theme = 'dark';
  t.palettes = { dark: { bg: '#0a0b0c', date: '#ffcc00' }, minimal: { line: '#999999' } };
  t.eras[2].color = '#22aa66';
  const saved = normalizeTimeline(t, counterId()).value;
  const loaded = parseTimelineJson(serializeTimeline(saved), counterId());
  assert.equal(loaded.ok, true);
  assert.deepEqual(loaded.value, saved);
  assert.equal(loaded.value.eras[2].color, '#22aa66');
  assert.deepEqual(loaded.value.palettes.dark, { bg: '#0a0b0c', date: '#ffcc00' });
});
