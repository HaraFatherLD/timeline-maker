import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTimelineJson, normalizeTimeline } from '../src/schema.js';
import { sampleTimeline, counterId } from './helpers.js';

const mutate = (fn) => { const t = sampleTimeline(); fn(t); return JSON.stringify(t); };

const INVALID = {
  '1 unparsable': '{broken',
  '2 over 1MB': JSON.stringify({ ...sampleTimeline(), title: 'x'.repeat(1_000_001) }),
  '3 root not object': '[1,2]',
  '4 eras missing': mutate((t) => { delete t.eras; }),
  '5 eras not array': mutate((t) => { t.eras = {}; }),
  '6 era not object': mutate((t) => { t.eras.push('str'); }),
  '7 era field type': mutate((t) => { t.eras[0].name = 5; }),
  '8 events not array': mutate((t) => { t.eras[0].events = 'x'; }),
  '9 event field type': mutate((t) => { t.eras[0].events[0].title = { a: 1 }; }),
};

test('AP-009 nine invalid inputs return {ok:false} without throwing', () => {
  for (const [label, text] of Object.entries(INVALID)) {
    let res;
    assert.doesNotThrow(() => { res = parseTimelineJson(text, counterId()); }, label);
    assert.equal(res.ok, false, label);
    assert.equal(typeof res.error, 'string', label);
  }
  assert.equal(normalizeTimeline(null, counterId()).ok, false);
  assert.equal(normalizeTimeline(undefined, counterId()).ok, false);
});

test('AP-009 duplicate and malformed ids are reissued, first kept', () => {
  const t = sampleTimeline();
  t.eras[1].id = 'e1';            // duplicate of first era
  t.eras[2].id = 'bad id!';       // malformed
  t.eras[0].events[1].id = 'e1';  // duplicate across levels
  const gen = (() => { const seq = ['e3', 'v1', 'fresh1', 'fresh2', 'fresh3']; let i = 0; return () => seq[i++]; })();
  const res = normalizeTimeline(t, gen);
  assert.equal(res.ok, true);
  const ids = [...res.value.eras.map((e) => e.id), ...res.value.eras.flatMap((e) => e.events.map((v) => v.id))];
  assert.equal(new Set(ids).size, ids.length, 'ids must be unique');
  assert.equal(res.value.eras[0].id, 'e1', 'first occurrence kept');
  for (const id of ids) assert.match(id, /^[A-Za-z0-9_-]{1,64}$/);
});

test('AP-009 unknown theme -> classic, unknown keys dropped, missing strings -> empty', () => {
  const t = sampleTimeline();
  t.theme = 'neon';
  t.extra = 1;
  t.eras[0].hack = true;
  t.eras[0].events[0].onclick = 'x';
  delete t.subtitle;
  delete t.eras[1].events;
  const res = normalizeTimeline(t, counterId());
  assert.equal(res.ok, true);
  assert.equal(res.value.theme, 'classic');
  assert.equal(res.value.subtitle, '');
  assert.deepEqual(res.value.eras[1].events, []);
  assert.deepEqual(Object.keys(res.value).sort(), ['eras', 'subtitle', 'theme', 'title']);
  assert.deepEqual(Object.keys(res.value.eras[0]).sort(), ['description', 'events', 'id', 'name', 'period']);
  assert.deepEqual(Object.keys(res.value.eras[0].events[0]).sort(), ['date', 'description', 'id', 'title']);
});

test('AP-009 over-length strings are truncated to the schema limits', () => {
  const t = sampleTimeline();
  t.title = 'a'.repeat(300);
  t.subtitle = 'b'.repeat(600);
  t.eras[0].description = 'c'.repeat(6000);
  const res = normalizeTimeline(t, counterId());
  assert.equal(res.value.title.length, 200);
  assert.equal(res.value.subtitle.length, 500);
  assert.equal(res.value.eras[0].description.length, 5000);
});

test('AP-009 normalize does not mutate its input', () => {
  const t = sampleTimeline();
  t.theme = 'neon';
  const snap = structuredClone(t);
  normalizeTimeline(t, counterId());
  assert.deepEqual(t, snap);
});
