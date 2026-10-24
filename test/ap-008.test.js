import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeTimeline, parseTimelineJson } from '../src/schema.js';
import { exampleTimeline } from '../src/example.js';
import { sampleTimeline, counterId } from './helpers.js';

test('AP-008 serialize -> parse round-trips the sample', () => {
  const t = sampleTimeline();
  const res = parseTimelineJson(serializeTimeline(t), counterId());
  assert.equal(res.ok, true);
  assert.deepEqual(res.value, t);
});

test('AP-008 serialize -> parse round-trips the example (Unicode)', () => {
  const t = exampleTimeline(counterId());
  t.title = '그리스 역사 — 연표 ✨';
  const res = parseTimelineJson(serializeTimeline(t), counterId());
  assert.equal(res.ok, true);
  assert.deepEqual(res.value, t);
});

test('AP-008 serialize uses 2-space JSON', () => {
  assert.equal(serializeTimeline(sampleTimeline()), JSON.stringify(sampleTimeline(), null, 2));
});
