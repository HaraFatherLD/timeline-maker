import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportHtml } from '../src/export.js';
import { normalizeTimeline } from '../src/schema.js';
import { sampleTimeline, counterId } from './helpers.js';

const exp = (patch) => exportHtml(normalizeTimeline({ ...sampleTimeline(), ...patch }, counterId()).value);

test('AP-025 exported documents carry user colours and era colours', () => {
  const t = sampleTimeline();
  t.palettes = { classic: { bg: '#123456' } };
  t.eras[0].color = '#654321';
  const html = exportHtml(normalizeTimeline(t, counterId()).value);
  assert.ok(html.includes('--bg:#123456'));
  assert.ok(html.includes('--accent:#654321'));
});

test('AP-025 exported documents carry exactly one restrictive CSP', () => {
  const html = exp({});
  const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/g) || [];
  assert.equal(csp.length, 1);
  assert.ok(csp[0].includes("default-src 'none'") && csp[0].includes("style-src 'unsafe-inline'"));
  for (const bad of ['<script', '<link', 'src=', 'href=', 'url(', '@import']) assert.ok(!html.toLowerCase().includes(bad), bad);
});

test('AP-025 colour fields cannot inject markup or CSS', () => {
  const t = sampleTimeline();
  t.palettes = { classic: { bg: 'red;}</style><script>alert(1)</script>', title: '#000000;background:url(x)' } };
  t.eras[0].color = '"><script>alert(1)</script>';
  const html = exportHtml(normalizeTimeline(t, counterId()).value);
  assert.ok(!/<script/i.test(html));
  assert.ok(!html.includes('url('));
  assert.ok(!html.includes('</style><'), 'style block must stay intact');
});

test('AP-025 exportHtml re-validates colours of unnormalised input', () => {
  const tl = { ...sampleTimeline(), title: 'Content-Security-Policy', palettes: { classic: { bg: 'red;}</style><script>alert(1)</script>' } } };
  tl.eras[0].color = '"><script>alert(1)</script>';
  const html = exportHtml(tl);
  assert.ok(!/<script/i.test(html));
  assert.equal((html.match(/<meta http-equiv="Content-Security-Policy"/g) || []).length, 1);
});
