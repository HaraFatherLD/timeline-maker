// Extra coverage beyond the AP tests: hostile inputs, caps, truncation, id handling.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTimeline, parseTimelineJson, serializeTimeline } from '../src/schema.js';
import { LIMITS, ID_PATTERN } from '../src/model.js';
import { sampleTimeline, counterId } from './helpers.js';

test('extra: normalizeTimeline never throws, whatever it is given', () => {
  const cyclic = { eras: [] };
  cyclic.eras.push(cyclic);
  const revoked = Proxy.revocable({}, {});
  revoked.revoke();
  const hostile = [
    null, undefined, 0, NaN, '', 'str', true, 10n, Symbol('s'), () => {}, [], {}, cyclic,
    { get eras() { throw new Error('boom'); } },
    new Proxy({}, { get() { throw new Error('trap'); } }),
    revoked.proxy,
  ];
  for (const value of hostile) {
    let res;
    assert.doesNotThrow(() => { res = normalizeTimeline(value, counterId()); }, String(typeof value));
    assert.equal(typeof res.ok, 'boolean');
    if (!res.ok) assert.equal(typeof res.error, 'string');
  }
});

test('extra: a null text field is rejected, an undefined one becomes empty', () => {
  const bad = sampleTimeline();
  bad.eras[0].period = null;
  const res = normalizeTimeline(bad, counterId());
  assert.equal(res.ok, false);
  assert.match(res.error, /eras\[0\]\.period/);
  const good = sampleTimeline();
  good.eras[0].period = undefined;
  assert.equal(normalizeTimeline(good, counterId()).value.eras[0].period, '');
});

test('extra: events set to null is an error (only a missing events becomes [])', () => {
  const t = sampleTimeline();
  t.eras[1].events = null;
  assert.equal(normalizeTimeline(t, counterId()).ok, false);
});

test('extra: error messages point at the offending path', () => {
  const t = sampleTimeline();
  t.eras[0].events[1].date = 7;
  assert.match(normalizeTimeline(t, counterId()).error, /eras\[0\]\.events\[1\]\.date/);
});

test('extra: eras and events beyond the caps are cut off', () => {
  const t = sampleTimeline();
  t.eras = Array.from({ length: LIMITS.eras + 50 }, (_, i) => ({ id: `e${i}`, name: String(i), events: [] }));
  t.eras[0].events = Array.from({ length: LIMITS.events + 50 }, (_, i) => ({ id: `v${i}`, title: String(i) }));
  const res = normalizeTimeline(t, counterId('n'));
  assert.equal(res.ok, true);
  assert.equal(res.value.eras.length, LIMITS.eras);
  assert.equal(res.value.eras[0].events.length, LIMITS.events);
});

test('extra: truncation never leaves half of a surrogate pair', () => {
  const t = sampleTimeline();
  t.title = 'a'.repeat(LIMITS.title - 1) + '\u{1F600}';
  const title = normalizeTimeline(t, counterId()).value.title;
  assert.equal(title, 'a'.repeat(LIMITS.title - 1));
  t.title = 'a'.repeat(LIMITS.title - 2) + '\u{1F600}';
  assert.equal(normalizeTimeline(t, counterId()).value.title.length, LIMITS.title);
});

test('extra: __proto__ keys neither pollute nor survive', () => {
  const text = '{"__proto__":{"polluted":1},"eras":[{"__proto__":{"x":1},"name":"A"}]}';
  const res = parseTimelineJson(text, counterId());
  assert.equal(res.ok, true);
  assert.equal({}.polluted, undefined);
  assert.deepEqual(Object.keys(res.value).sort(), ['eras', 'subtitle', 'theme', 'title']);
  assert.equal(Object.getPrototypeOf(res.value.eras[0]), Object.prototype);
  assert.equal(res.value.eras[0].x, undefined);
});

test('extra: a generated id never displaces a legitimate id that appears later', () => {
  const t = { eras: [{ id: 'dup' }, { id: 'dup' }, { id: 'late' }] };
  const seq = ['late', 'fresh'];
  const res = normalizeTimeline(t, () => seq.shift());
  assert.deepEqual(res.value.eras.map((e) => e.id), ['dup', 'fresh', 'late']);
});

test('extra: a broken generator still produces valid unique ids', () => {
  const t = { eras: [{}, {}, { events: [{}, {}] }] };
  for (const gen of [() => undefined, () => '!!', () => 'same', null]) {
    const res = normalizeTimeline(t, gen);
    assert.equal(res.ok, true);
    const ids = res.value.eras.flatMap((e) => [e.id, ...e.events.map((v) => v.id)]);
    assert.equal(new Set(ids).size, 5);
    for (const id of ids) assert.match(id, ID_PATTERN);
  }
});

test('extra: the 1,000,000 character boundary is inclusive', () => {
  const head = '{"title":"';
  const tail = '","eras":[]}';
  const exactly = head + 'x'.repeat(1_000_000 - head.length - tail.length) + tail;
  assert.equal(exactly.length, 1_000_000);
  const ok = parseTimelineJson(exactly, counterId());
  assert.equal(ok.ok, true);
  assert.equal(ok.value.title.length, LIMITS.title);
  assert.equal(parseTimelineJson(exactly + ' ', counterId()).ok, false);
});

test('extra: non-string JSON input is an error, not a throw', () => {
  for (const v of [undefined, null, 42, {}, []]) {
    const res = parseTimelineJson(v, counterId());
    assert.equal(res.ok, false);
  }
});

test('extra: normalised output keeps a stable key order and re-serialises identically', () => {
  const res = normalizeTimeline(sampleTimeline(), counterId());
  assert.deepEqual(Object.keys(res.value), ['title', 'subtitle', 'theme', 'eras']);
  assert.deepEqual(Object.keys(res.value.eras[0]), ['id', 'name', 'period', 'description', 'events']);
  assert.deepEqual(Object.keys(res.value.eras[0].events[0]), ['id', 'date', 'title', 'description']);
  assert.equal(serializeTimeline(res.value), serializeTimeline(sampleTimeline()));
});
