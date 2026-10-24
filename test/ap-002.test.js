import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateEra, removeEra } from '../src/model.js';
import { sampleTimeline } from './helpers.js';

test('AP-002 updateEra changes only the target era', () => {
  const t0 = sampleTimeline();
  const snapshot = structuredClone(t0);
  const t1 = updateEra(t0, 'e2', { name: 'Iron!', period: 'x' });
  assert.equal(t1.eras[1].name, 'Iron!');
  assert.equal(t1.eras[1].period, 'x');
  assert.equal(t1.eras[1].id, 'e2');
  assert.deepEqual(t1.eras[0], snapshot.eras[0]);
  assert.deepEqual(t1.eras[2], snapshot.eras[2]);
  assert.deepEqual(t0, snapshot, 'input must not be mutated');
});

test('AP-002 updateEra cannot overwrite id or events through patch', () => {
  const t1 = updateEra(sampleTimeline(), 'e1', { id: 'hacked', events: [] });
  assert.equal(t1.eras[0].id, 'e1');
  assert.equal(t1.eras[0].events.length, 2);
});

test('AP-002 removeEra removes only the target era', () => {
  const t0 = sampleTimeline();
  const snapshot = structuredClone(t0);
  const t1 = removeEra(t0, 'e2');
  assert.deepEqual(t1.eras.map((e) => e.id), ['e1', 'e3']);
  assert.deepEqual(t0, snapshot);
});

test('AP-002 unknown id leaves content unchanged', () => {
  const t0 = sampleTimeline();
  assert.deepEqual(updateEra(t0, 'nope', { name: 'x' }), t0);
  assert.deepEqual(removeEra(t0, 'nope'), t0);
});
