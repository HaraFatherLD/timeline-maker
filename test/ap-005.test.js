import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderTimeline } from '../src/render.js';
import { sampleTimeline } from './helpers.js';

test('AP-005 render includes every field in input order', () => {
  const html = renderTimeline(sampleTimeline());
  const ordered = [
    'History', 'Sub',
    'Bronze Age', '3000-1200 BC', 'Bronze tools',
    '3000 BC', 'Cities', 'First cities',
    '1200 BC', 'Collapse', 'Systems collapse',
    'Iron Age', '1200-500 BC', 'Iron tools',
    'Classical', '500 BC-500 AD', 'Empires',
  ];
  let pos = -1;
  for (const text of ordered) {
    const next = html.indexOf(text, pos + 1);
    assert.ok(next > pos, `"${text}" missing or out of order`);
    pos = next;
  }
});

test('AP-005 render of an empty timeline does not throw and returns a root element', () => {
  const html = renderTimeline({ title: '', subtitle: '', theme: 'classic', eras: [] });
  assert.match(html, /^<div class="tl theme-classic"/);
});
