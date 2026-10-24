import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeFilename } from '../src/export.js';

test('AP-012 keeps ordinary titles including Unicode', () => {
  assert.equal(safeFilename('Greek History'), 'Greek History.html');
  assert.equal(safeFilename('그리스 연표'), '그리스 연표.html');
});

test('AP-012 strips forbidden and control characters', () => {
  assert.equal(safeFilename('a\\b/c:d*e?f"g<h>i|j'), 'abcdefghij.html');
  assert.equal(safeFilename('x\u0000y\u001fz'), 'xyz.html');
});

test('AP-012 trims surrounding spaces and trailing dots', () => {
  assert.equal(safeFilename('  hello.. '), 'hello.html');
});

test('AP-012 suffixes Windows reserved names', () => {
  for (const name of ['CON', 'prn', 'Aux', 'NUL', 'COM1', 'lpt9']) {
    assert.equal(safeFilename(name), `${name}_.html`);
  }
  assert.equal(safeFilename('CONSOLE'), 'CONSOLE.html');
});

test('AP-012 caps the base name at 100 characters', () => {
  const out = safeFilename('a'.repeat(250));
  assert.equal(out, 'a'.repeat(100) + '.html');
});

test('AP-012 empty or fully stripped titles fall back to timeline.html', () => {
  for (const t of ['', '   ', '...', '<>:|', undefined, null]) {
    assert.equal(safeFilename(t), 'timeline.html');
  }
});
