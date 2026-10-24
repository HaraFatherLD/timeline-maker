import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moveEra, moveEvent } from '../src/model.js';
import { sampleTimeline } from './helpers.js';

const eraIds = (t) => t.eras.map((e) => e.id);

test('AP-004 moveEra swaps with neighbour', () => {
  const t0 = sampleTimeline();
  assert.deepEqual(eraIds(moveEra(t0, 'e2', -1)), ['e2', 'e1', 'e3']);
  assert.deepEqual(eraIds(moveEra(t0, 'e2', 1)), ['e1', 'e3', 'e2']);
  assert.deepEqual(eraIds(t0), ['e1', 'e2', 'e3'], 'input must not be mutated');
});

test('AP-004 moveEra at boundaries is a no-op', () => {
  const t0 = sampleTimeline();
  assert.deepEqual(moveEra(t0, 'e1', -1), t0);
  assert.deepEqual(moveEra(t0, 'e3', 1), t0);
  assert.deepEqual(moveEra(t0, 'nope', 1), t0);
});

test('AP-004 moveEvent swaps within its era and respects boundaries', () => {
  const t0 = sampleTimeline();
  const t1 = moveEvent(t0, 'e1', 'v2', -1);
  assert.deepEqual(t1.eras[0].events.map((v) => v.id), ['v2', 'v1']);
  assert.deepEqual(moveEvent(t0, 'e1', 'v1', -1), t0);
  assert.deepEqual(moveEvent(t0, 'e1', 'v2', 1), t0);
  assert.deepEqual(t0.eras[0].events.map((v) => v.id), ['v1', 'v2']);
});
