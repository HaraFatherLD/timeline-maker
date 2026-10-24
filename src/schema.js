// Schema boundary: every external input (JSON file, localStorage) goes through normalizeTimeline.
import { LIMITS, ID_PATTERN, THEMES, defaultGenId, uniqueId, clipText } from './model.js';
import { PALETTE_TOKENS, isHex } from './palette.js';

// Selectable themes live in model.js (the dependency leaf) and are re-exported here for existing importers.
export { THEMES };

const MAX_JSON_CHARS = 1_000_000;
const TIMELINE_TEXT = { title: LIMITS.title, subtitle: LIMITS.subtitle };
const ERA_TEXT = { name: LIMITS.text, period: LIMITS.text, description: LIMITS.text };
const EVENT_TEXT = { date: LIMITS.text, title: LIMITS.text, description: LIMITS.text };

const fail = (error) => ({ ok: false, error });
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const rawId = (src) => (typeof src.id === 'string' ? src.id : '');
const ownValue = (src, key) => (Object.hasOwn(src, key) ? src[key] : undefined);

// Read string fields: missing/undefined -> '', other non-strings -> error, long -> clipped.
function readTexts(src, spec, prefix) {
  const out = {};
  for (const [key, max] of Object.entries(spec)) {
    const value = src[key];
    if (value === undefined) out[key] = '';
    else if (typeof value === 'string') out[key] = clipText(value, max);
    else return fail(`${prefix}${key}: 문자열이어야 합니다`);
  }
  return { ok: true, value: out };
}

// Colours are lenient: #rrggbb in either case becomes lower case, anything else is dropped (never an error).
const readColor = (value) => (isHex(value) ? value.toLowerCase() : '');

// One theme's overrides: known tokens with valid colours only, read as own properties in token order.
function shapeColors(raw) {
  const colors = {};
  if (!isObject(raw)) return colors;
  for (const token of PALETTE_TOKENS) {
    const color = readColor(ownValue(raw, token));
    if (color) colors[token] = color;
  }
  return colors;
}

// palettes: known themes only (own properties), themes left without a valid colour are omitted.
function shapePalettes(raw) {
  const palettes = {};
  if (!isObject(raw)) return palettes;
  for (const theme of THEMES) {
    const colors = shapeColors(ownValue(raw, theme));
    if (Object.keys(colors).length > 0) palettes[theme] = colors;
  }
  return palettes;
}

// Shape each item of `list` (at most `limit`), stopping at the first error.
function shapeList(list, limit, path, shape) {
  const items = [];
  for (const [i, raw] of list.slice(0, limit).entries()) {
    const res = shape(raw, `${path}[${i}]`);
    if (!res.ok) return res;
    items.push(res.value);
  }
  return { ok: true, value: items };
}

function shapeEvent(raw, path) {
  if (!isObject(raw)) return fail(`${path}: 객체여야 합니다`);
  const texts = readTexts(raw, EVENT_TEXT, `${path}.`);
  if (!texts.ok) return texts;
  return { ok: true, value: { id: rawId(raw), ...texts.value } };
}

function shapeEra(raw, path) {
  if (!isObject(raw)) return fail(`${path}: 객체여야 합니다`);
  const texts = readTexts(raw, ERA_TEXT, `${path}.`);
  if (!texts.ok) return texts;
  if (raw.events !== undefined && !Array.isArray(raw.events)) {
    return fail(`${path}.events: 배열이어야 합니다`);
  }
  const events = shapeList(raw.events ?? [], LIMITS.events, `${path}.events`, shapeEvent);
  if (!events.ok) return events;
  const color = readColor(ownValue(raw, 'color'));
  return { ok: true, value: { id: rawId(raw), ...texts.value, color, events: events.value } };
}

// Rebuild the whole document from whitelisted keys; ids are fixed up afterwards.
function shapeTimeline(raw) {
  if (!isObject(raw)) return fail('최상위 값은 객체여야 합니다');
  if (!Array.isArray(raw.eras)) return fail('eras는 배열이어야 합니다');
  const head = readTexts(raw, TIMELINE_TEXT, '');
  if (!head.ok) return head;
  const eras = shapeList(raw.eras, LIMITS.eras, 'eras', shapeEra);
  if (!eras.ok) return eras;
  const theme = THEMES.includes(raw.theme) ? raw.theme : THEMES[0];
  const palettes = shapePalettes(ownValue(raw, 'palettes'));
  return { ok: true, value: { ...head.value, theme, palettes, eras: eras.value } };
}

// Keep the first well-formed occurrence of each id (document order); reissue the rest.
// Valid ids are reserved first, so a generated id never displaces a legitimate later one.
function reissueIds(timeline, genId) {
  const used = new Set();
  const pending = [];
  for (const node of timeline.eras.flatMap((era) => [era, ...era.events])) {
    if (ID_PATTERN.test(node.id) && !used.has(node.id)) used.add(node.id);
    else pending.push(node);
  }
  for (const node of pending) {
    node.id = uniqueId(genId, used);
    used.add(node.id);
  }
}

/**
 * Validate and rebuild an untrusted value as a Timeline. Never throws.
 * Colours are lenient: invalid palettes or era colours fall back to defaults instead of failing.
 * @param {unknown} raw parsed JSON (or any value)
 * @param {() => string} [genId] id generator used for missing/duplicate/invalid ids
 * @returns {{ ok: true, value: import('./model.js').Timeline } | { ok: false, error: string }}
 */
export function normalizeTimeline(raw, genId = defaultGenId) {
  try {
    const shaped = shapeTimeline(raw);
    if (shaped.ok) reissueIds(shaped.value, genId);
    return shaped;
  } catch (err) {
    const why = err instanceof Error ? err.message : '알 수 없는 오류';
    return fail(`입력을 처리하지 못했습니다: ${why}`);
  }
}

/**
 * Parse JSON text (at most 1,000,000 chars) and normalize it. Never throws.
 * @param {string} text
 * @param {() => string} [genId]
 * @returns {{ ok: true, value: import('./model.js').Timeline } | { ok: false, error: string }}
 */
export function parseTimelineJson(text, genId = defaultGenId) {
  if (typeof text !== 'string') return fail('JSON 텍스트가 아닙니다');
  if (text.length > MAX_JSON_CHARS) {
    return fail(`파일이 너무 큽니다 (최대 ${MAX_JSON_CHARS.toLocaleString('en-US')}자)`);
  }
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    return fail(`JSON 형식이 올바르지 않습니다: ${err.message}`);
  }
  return normalizeTimeline(raw, genId);
}

/**
 * Serialize a timeline as 2-space-indented JSON. The input is written as is (not normalized).
 * @param {import('./model.js').Timeline} tl
 * @returns {string}
 */
export function serializeTimeline(tl) {
  return JSON.stringify(tl, null, 2);
}
