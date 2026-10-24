// Pure timeline model. Every function returns a new object and never mutates its input.
// This is the dependency leaf: schema limits, id format and id generation live here.

/**
 * @typedef {{ id: string, date: string, title: string, description: string }} TimelineEvent
 * @typedef {{ id: string, name: string, period: string, description: string, color: string, events: TimelineEvent[] }} Era
 *   color is '' (use the theme colour) or a lower-case #rrggbb
 * @typedef {{ title: string, subtitle: string, theme: string, palettes: Object, eras: Era[] }} Timeline
 *   palettes maps a theme name to { token: '#rrggbb' } overrides (see palette.js)
 */

/** Schema limits shared by the model, the validator and the editor form (maxlength). */
export const LIMITS = Object.freeze({ title: 200, subtitle: 500, text: 5000, eras: 200, events: 500 });

/** Selectable themes (UI order). The first entry is the fallback for unknown values. */
export const THEMES = Object.freeze([
  'classic', 'dark', 'minimal', 'block', 'diamond', 'zigzag', 'metro', 'notebook', 'cards', 'newspaper', 'terminal',
]);

/** Allowed id format: 1-64 letters, digits, underscore or hyphen. */
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const ERA_FIELDS = ['name', 'period', 'description'];
const EVENT_FIELDS = ['date', 'title', 'description'];

let fallbackSeq = 0;

/**
 * Default id generator: crypto.randomUUID() when available, otherwise a
 * time + counter + random fallback. Always matches ID_PATTERN.
 * @returns {string}
 */
export function defaultGenId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  fallbackSeq += 1;
  const rand = Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 8);
  return `id-${Date.now().toString(36)}-${fallbackSeq.toString(36)}-${rand}`;
}

/**
 * Cut `text` to at most `max` UTF-16 units without leaving half of a surrogate pair.
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
export function clipText(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const last = cut.charCodeAt(max - 1);
  return last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;
}

/**
 * Pick an id from `genId` that is well-formed and not in `used`.
 * After repeated bad answers it falls back to a counter id, so it always terminates.
 * @param {(() => string) | undefined} genId
 * @param {Set<string>} used
 * @returns {string}
 */
export function uniqueId(genId, used) {
  const gen = typeof genId === 'function' ? genId : defaultGenId;
  for (let attempt = 0; attempt < 50; attempt++) {
    const id = gen();
    if (typeof id === 'string' && ID_PATTERN.test(id) && !used.has(id)) return id;
  }
  let n = used.size + 1;
  while (used.has(`id${n}`)) n += 1;
  return `id${n}`;
}

function allIds(tl) {
  const ids = new Set();
  for (const era of tl.eras) {
    ids.add(era.id);
    for (const ev of era.events) ids.add(ev.id);
  }
  return ids;
}

// Copy listed keys that hold strings (used for patches: anything else is ignored).
function pickStrings(src, keys) {
  const out = {};
  for (const key of keys) if (typeof src?.[key] === 'string') out[key] = src[key];
  return out;
}

// Like pickStrings, but missing or non-string values become ''.
function textFields(src, keys) {
  const out = {};
  for (const key of keys) out[key] = typeof src?.[key] === 'string' ? src[key] : '';
  return out;
}

function mapEra(tl, eraId, fn) {
  return { ...tl, eras: tl.eras.map((era) => (era.id === eraId ? fn(era) : era)) };
}

function mapEvents(tl, eraId, fn) {
  return mapEra(tl, eraId, (era) => ({ ...era, events: fn(era.events) }));
}

// Swap the item with its neighbour; boundaries, unknown ids and bad dir are no-ops.
function moved(list, id, dir) {
  const from = list.findIndex((item) => item.id === id);
  const to = from + dir;
  if (from < 0 || (dir !== -1 && dir !== 1) || to < 0 || to >= list.length) return [...list];
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/**
 * Create an empty timeline.
 * @returns {Timeline}
 */
export function createTimeline() {
  return { title: '', subtitle: '', theme: 'classic', palettes: {}, eras: [] };
}

/**
 * Append an era with no custom colour (color ''). At the LIMITS.eras cap the content is returned unchanged.
 * @param {Timeline} tl
 * @param {{ name?: string, period?: string, description?: string }} [data]
 * @param {() => string} [genId] id generator, defaults to defaultGenId
 * @returns {Timeline}
 */
export function addEra(tl, data = {}, genId) {
  if (tl.eras.length >= LIMITS.eras) return { ...tl, eras: [...tl.eras] };
  const era = { id: uniqueId(genId, allIds(tl)), ...textFields(data, ERA_FIELDS), color: '', events: [] };
  return { ...tl, eras: [...tl.eras, era] };
}

/**
 * Update name/period/description of one era; id and events cannot be patched.
 * @param {Timeline} tl
 * @param {string} eraId
 * @param {{ name?: string, period?: string, description?: string }} patch
 * @returns {Timeline}
 */
export function updateEra(tl, eraId, patch = {}) {
  const changes = pickStrings(patch, ERA_FIELDS);
  return mapEra(tl, eraId, (era) => ({ ...era, ...changes }));
}

/**
 * Remove one era (and its events).
 * @param {Timeline} tl
 * @param {string} eraId
 * @returns {Timeline}
 */
export function removeEra(tl, eraId) {
  return { ...tl, eras: tl.eras.filter((era) => era.id !== eraId) };
}

/**
 * Append an event to one era. At the LIMITS.events cap the content is unchanged.
 * @param {Timeline} tl
 * @param {string} eraId
 * @param {{ date?: string, title?: string, description?: string }} [data]
 * @param {() => string} [genId] id generator, defaults to defaultGenId
 * @returns {Timeline}
 */
export function addEvent(tl, eraId, data = {}, genId) {
  return mapEvents(tl, eraId, (events) => {
    if (events.length >= LIMITS.events) return [...events];
    const ev = { id: uniqueId(genId, allIds(tl)), ...textFields(data, EVENT_FIELDS) };
    return [...events, ev];
  });
}

/**
 * Update date/title/description of one event; its id cannot be patched.
 * @param {Timeline} tl
 * @param {string} eraId
 * @param {string} eventId
 * @param {{ date?: string, title?: string, description?: string }} patch
 * @returns {Timeline}
 */
export function updateEvent(tl, eraId, eventId, patch = {}) {
  const changes = pickStrings(patch, EVENT_FIELDS);
  return mapEvents(tl, eraId, (events) =>
    events.map((ev) => (ev.id === eventId ? { ...ev, ...changes } : ev)));
}

/**
 * Remove one event from one era.
 * @param {Timeline} tl
 * @param {string} eraId
 * @param {string} eventId
 * @returns {Timeline}
 */
export function removeEvent(tl, eraId, eventId) {
  return mapEvents(tl, eraId, (events) => events.filter((ev) => ev.id !== eventId));
}

/**
 * Move an era up (-1) or down (+1); boundaries and unknown ids are no-ops.
 * @param {Timeline} tl
 * @param {string} eraId
 * @param {-1 | 1} dir
 * @returns {Timeline}
 */
export function moveEra(tl, eraId, dir) {
  return { ...tl, eras: moved(tl.eras, eraId, dir) };
}

/**
 * Move an event up (-1) or down (+1) inside its era; boundaries are no-ops.
 * @param {Timeline} tl
 * @param {string} eraId
 * @param {string} eventId
 * @param {-1 | 1} dir
 * @returns {Timeline}
 */
export function moveEvent(tl, eraId, eventId, dir) {
  return mapEvents(tl, eraId, (events) => moved(events, eventId, dir));
}
