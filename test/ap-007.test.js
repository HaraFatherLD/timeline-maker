import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportHtml } from '../src/export.js';
import { exampleTimeline } from '../src/example.js';
import { counterId } from './helpers.js';

test('AP-007 export is a standalone document with inline CSS', () => {
  const doc = exportHtml(exampleTimeline(counterId()));
  assert.match(doc, /^<!doctype html>/i);
  assert.match(doc, /<meta charset="utf-8">/i);
  assert.match(doc, /<meta name="viewport"[^>]*width=device-width/i);
  assert.match(doc, /<style>[\s\S]+<\/style>/);
  assert.match(doc, /<\/html>\s*$/i);
});

test('AP-007 export references no external resources', () => {
  const doc = exportHtml(exampleTimeline(counterId()));
  for (const bad of ['<script', '<link', 'src=', 'href=', 'url(', '@import']) {
    assert.ok(!doc.toLowerCase().includes(bad), `forbidden pattern: ${bad}`);
  }
});
