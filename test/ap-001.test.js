import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTimeline, addEra } from '../src/model.js';
import { counterId } from './helpers.js';

test('AP-001 addEra appends an era with an injected unique id', () => {
  const genId = counterId('era');
  const t0 = createTimeline();
  assert.equal(t0.eras.length, 0);
  const t1 = addEra(t0, { name: 'A' }, genId);
  const t2 = addEra(t1, { name: 'B' }, genId);
  assert.equal(t1.eras.length, 1);
  assert.equal(t2.eras.length, 2);
  assert.equal(t2.eras[0].id, 'era1');
  assert.equal(t2.eras[1].id, 'era2');
  assert.equal(t2.eras[1].name, 'B');
  assert.deepEqual(t2.eras[1].events, []);
  assert.equal(t0.eras.length, 0, 'input must not be mutated');
});

test('AP-001 addEra fills missing fields with empty strings', () => {
  const t = addEra(createTimeline(), {}, counterId());
  const era = t.eras[0];
  assert.equal(era.name, '');
  assert.equal(era.period, '');
  assert.equal(era.description, '');
});

test('AP-001 default genId yields ids matching the id format', () => {
  let t = createTimeline();
  for (let i = 0; i < 20; i++) t = addEra(t, {});
  const ids = t.eras.map((e) => e.id);
  assert.equal(new Set(ids).size, 20);
  for (const id of ids) assert.match(id, /^[A-Za-z0-9_-]{1,64}$/);
});
