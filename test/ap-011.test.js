import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exampleTimeline } from '../src/example.js';
import { normalizeTimeline } from '../src/schema.js';
import { counterId } from './helpers.js';

test('AP-011 example timeline is valid and rich enough', () => {
  const ex = exampleTimeline(counterId());
  const res = normalizeTimeline(ex, counterId('x'));
  assert.equal(res.ok, true);
  assert.deepEqual(res.value, ex, 'example must already be normalised');
  assert.ok(ex.eras.length >= 3);
  for (const era of ex.eras) assert.ok(era.events.length >= 1, `era ${era.name} has no events`);
  assert.ok(ex.title.length > 0);
});

test('AP-011 example returns a fresh object each call', () => {
  const a = exampleTimeline(counterId());
  a.eras.length = 0;
  assert.ok(exampleTimeline(counterId()).eras.length >= 3);
});
