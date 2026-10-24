import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTimeline } from '../src/schema.js';
import { sampleTimeline, counterId } from './helpers.js';

const norm = (patch) => normalizeTimeline({ ...sampleTimeline(), ...patch }, counterId()).value;

test('AP-022 v2 data migrates to empty palettes and empty era colours', () => {
  const v = norm({});
  assert.deepEqual(v.palettes, {});
  for (const era of v.eras) assert.equal(era.color, '');
});

test('AP-022 palettes keep known themes and tokens with valid colours only', () => {
  const v = norm({
    palettes: {
      classic: { bg: '#ABCDEF', title: 'red', glow: '#000000', eraName: '#112233' },
      dark: { line: '#123' },
      neon: { bg: '#000000' },
      minimal: 'oops',
    },
  });
  assert.deepEqual(v.palettes, { classic: { bg: '#abcdef', eraName: '#112233' } });
  assert.deepEqual(norm({ palettes: 'x' }).palettes, {});
  assert.deepEqual(norm({ palettes: [] }).palettes, {});
});

test('AP-022 palette input cannot pollute prototypes', () => {
  const palettes = JSON.parse('{"__proto__":{"bg":"#000000"},"classic":{"__proto__":{"evil":"#000000"},"bg":"#101010"}}');
  const v = norm({ palettes });
  assert.deepEqual(v.palettes, { classic: { bg: '#101010' } });
  assert.equal({}.bg, undefined);
  assert.equal({}.evil, undefined);
  assert.equal(Object.getPrototypeOf(v.palettes), Object.prototype);
});

test('AP-022 era colours accept only #rrggbb and are lower-cased', () => {
  const t = sampleTimeline();
  t.eras[0].color = '#AA3300';
  t.eras[1].color = 'blue';
  t.eras[2].color = 42;
  const v = normalizeTimeline(t, counterId()).value;
  assert.deepEqual(v.eras.map((e) => e.color), ['#aa3300', '', '']);
  const short = normalizeTimeline({ ...sampleTimeline(), eras: [{ ...sampleTimeline().eras[0], color: '#abc' }] }, counterId()).value;
  assert.equal(short.eras[0].color, '');
});

test('AP-022 invalid colours never make the whole document fail', () => {
  const t = sampleTimeline();
  t.palettes = { classic: { bg: { nested: true } } };
  t.eras[0].color = null;
  const res = normalizeTimeline(t, counterId());
  assert.equal(res.ok, true);
  assert.deepEqual(res.value.palettes, {});
});
