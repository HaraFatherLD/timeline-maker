import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addEvent, updateEvent, removeEvent } from '../src/model.js';
import { sampleTimeline, counterId } from './helpers.js';

test('AP-003 addEvent appends to the target era only', () => {
  const t0 = sampleTimeline();
  const snapshot = structuredClone(t0);
  const t1 = addEvent(t0, 'e2', { title: 'Smelting', date: '1100 BC' }, counterId('ev'));
  assert.equal(t1.eras[1].events.length, 1);
  assert.deepEqual(t1.eras[1].events[0], { id: 'ev1', date: '1100 BC', title: 'Smelting', description: '' });
  assert.deepEqual(t1.eras[0], snapshot.eras[0]);
  assert.deepEqual(t1.eras[2], snapshot.eras[2]);
  assert.deepEqual(t0, snapshot);
});

test('AP-003 updateEvent changes only the target event', () => {
  const t0 = sampleTimeline();
  const t1 = updateEvent(t0, 'e1', 'v2', { title: 'Big Collapse', id: 'x' });
  assert.equal(t1.eras[0].events[1].title, 'Big Collapse');
  assert.equal(t1.eras[0].events[1].id, 'v2');
  assert.deepEqual(t1.eras[0].events[0], t0.eras[0].events[0]);
  assert.equal(t0.eras[0].events[1].title, 'Collapse');
});

test('AP-003 removeEvent removes only the target event', () => {
  const t1 = removeEvent(sampleTimeline(), 'e1', 'v1');
  assert.deepEqual(t1.eras[0].events.map((v) => v.id), ['v2']);
});

test('AP-003 unknown era/event id leaves content unchanged', () => {
  const t0 = sampleTimeline();
  assert.deepEqual(addEvent(t0, 'nope', {}, counterId()), t0);
  assert.deepEqual(updateEvent(t0, 'e1', 'nope', { title: 'x' }), t0);
  assert.deepEqual(removeEvent(t0, 'e2', 'v1'), t0);
});
