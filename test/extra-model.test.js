// Extra coverage beyond the AP tests: immutability under deep freeze, caps, id fallbacks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIMITS, ID_PATTERN, createTimeline, addEra, updateEra, removeEra, addEvent,
  updateEvent, removeEvent, moveEra, moveEvent, uniqueId, defaultGenId,
} from '../src/model.js';
import { sampleTimeline, counterId } from './helpers.js';

function deepFreeze(value) {
  Object.freeze(value);
  for (const v of Object.values(value)) if (v && typeof v === 'object') deepFreeze(v);
  return value;
}

test('extra: every model function works on a deep-frozen timeline (no mutation)', () => {
  const t = deepFreeze(sampleTimeline());
  const results = [
    addEra(t, { name: 'N' }, counterId('n')),
    updateEra(t, 'e1', { name: 'X' }),
    removeEra(t, 'e1'),
    addEvent(t, 'e1', { title: 'T' }, counterId('n')),
    updateEvent(t, 'e1', 'v1', { title: 'X' }),
    removeEvent(t, 'e1', 'v1'),
    moveEra(t, 'e1', 1),
    moveEvent(t, 'e1', 'v1', 1),
  ];
  for (const r of results) assert.notStrictEqual(r, t);
});

test('extra: no-op calls still return a new top-level object', () => {
  const t = sampleTimeline();
  assert.notStrictEqual(moveEra(t, 'e1', -1), t);
  assert.notStrictEqual(updateEra(t, 'nope', {}), t);
  assert.notStrictEqual(removeEvent(t, 'nope', 'x'), t);
});

test('extra: move ignores directions other than -1 and +1', () => {
  const t = sampleTimeline();
  for (const dir of [0, 2, -2, NaN, '1', undefined]) {
    assert.deepEqual(moveEra(t, 'e2', dir), t, `dir=${String(dir)}`);
  }
});

test('extra: patches with non-string values are ignored', () => {
  const t1 = updateEra(sampleTimeline(), 'e1', { name: 5, period: null, description: 'ok' });
  assert.equal(t1.eras[0].name, 'Bronze Age');
  assert.equal(t1.eras[0].period, '3000-1200 BC');
  assert.equal(t1.eras[0].description, 'ok');
});

test('extra: adding past the era cap leaves the content unchanged', () => {
  let t = createTimeline();
  for (let i = 0; i < LIMITS.eras; i++) t = addEra(t, {}, counterId(`g${i}-`));
  assert.equal(t.eras.length, LIMITS.eras);
  assert.deepEqual(addEra(t, {}, counterId('over')), t);
});

test('extra: adding past the event cap leaves the content unchanged', () => {
  let t = addEra(createTimeline(), { name: 'E' }, counterId('era'));
  const eraId = t.eras[0].id;
  const gen = counterId('ev');
  for (let i = 0; i < LIMITS.events; i++) t = addEvent(t, eraId, {}, gen);
  assert.equal(t.eras[0].events.length, LIMITS.events);
  assert.deepEqual(addEvent(t, eraId, {}, gen), t);
});

test('extra: a generator that repeats itself still yields unique ids', () => {
  const stuck = () => 'same';
  let t = createTimeline();
  for (let i = 0; i < 5; i++) t = addEra(t, {}, stuck);
  const ids = t.eras.map((e) => e.id);
  assert.equal(new Set(ids).size, 5);
  for (const id of ids) assert.match(id, ID_PATTERN);
});

test('extra: uniqueId rejects malformed generator output', () => {
  const garbage = () => '"><script>';
  const id = uniqueId(garbage, new Set(['id1']));
  assert.match(id, ID_PATTERN);
  assert.notEqual(id, 'id1');
  assert.match(uniqueId(undefined, new Set()), ID_PATTERN);
});

test('extra: defaultGenId fallback (no crypto.randomUUID) stays valid and unique', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true, writable: true });
  try {
    const ids = Array.from({ length: 500 }, () => defaultGenId());
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.match(id, ID_PATTERN);
  } finally {
    Object.defineProperty(globalThis, 'crypto', original);
  }
});
