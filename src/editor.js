// Editor form, built only with DOM APIs (createElement, .value, textContent): no HTML string parsing.
// renderEditor() rebuilds the whole form, so callers do that on structural changes only.
// Plain typing goes through `commit` without a rebuild, which keeps focus and IME composition.
import {
  LIMITS, THEMES, addEra, updateEra, removeEra, moveEra, addEvent, updateEvent, removeEvent, moveEvent,
} from './model.js';
import { h, button, THEME_LABELS } from './dom.js';
import { colorPanel, eraColorField } from './color-controls.js';
import { paletteOf } from './palette.js';

// Labelled single-line input or textarea; maxlength comes from the schema limit.
function textField(label, value, max, onInput, { multiline = false, key = '' } = {}) {
  const input = document.createElement(multiline ? 'textarea' : 'input');
  if (multiline) input.rows = 3;
  else input.type = 'text';
  input.maxLength = max;
  input.value = value;
  if (key) input.dataset.key = key;
  input.addEventListener('input', () => onInput(input.value));
  return h('label', 'field', h('span', 'field-label', label), input);
}

// Theme select. A change rebuilds the form (the colour panel shows that theme's colours), so a repeated
// event for the same value is ignored: a real change fires both `input` and `change`.
function themeField(value, onChange) {
  const select = document.createElement('select');
  for (const theme of THEMES) {
    const option = h('option', '', THEME_LABELS[theme] ?? theme);
    option.value = theme;
    select.append(option);
  }
  select.value = value;
  select.dataset.key = 'meta:theme';
  let last = value;
  const apply = () => {
    if (select.value === last) return;
    last = select.value;
    onChange(last);
  };
  for (const type of ['input', 'change']) select.addEventListener(type, apply);
  return h('label', 'field', h('span', 'field-label', '테마'), select);
}

// Move up / move down / delete buttons for an era or an event.
function actionBar(noun, key, index, total, { up, down, remove }) {
  return h('div', 'item-actions',
    button('↑', up, { label: `${noun} 위로 이동`, key: `${key}:up`, disabled: index === 0 }),
    button('↓', down, { label: `${noun} 아래로 이동`, key: `${key}:down`, disabled: index === total - 1 }),
    button('삭제', remove, { label: `${noun} 삭제`, key: `${key}:del`, variant: 'danger' }));
}

function eventRow(eraId, ev, index, total, commit) {
  const key = `ev:${ev.id}`;
  const noun = `사건 ${index + 1}`;
  const patch = (field) => (value) => commit((s) => updateEvent(s, eraId, ev.id, { [field]: value }));
  const move = (dir) => commit((s) => moveEvent(s, eraId, ev.id, dir), () => `${key}:${dir < 0 ? 'up' : 'down'}`);
  const remove = () => commit((s) => removeEvent(s, eraId, ev.id), () => `era:${eraId}:add`);
  return h('div', 'event',
    h('div', 'item-head', h('h3', 'item-title', noun),
      actionBar(noun, key, index, total, { up: () => move(-1), down: () => move(1), remove })),
    textField('날짜', ev.date, LIMITS.text, patch('date'), { key: `${key}:date` }),
    textField('제목', ev.title, LIMITS.text, patch('title')),
    textField('설명', ev.description, LIMITS.text, patch('description'), { multiline: true }));
}

function eraBlock(era, index, total, commit, themeAccent) {
  const key = `era:${era.id}`;
  const noun = `시대 ${index + 1}`;
  const patch = (field) => (value) => commit((s) => updateEra(s, era.id, { [field]: value }));
  const move = (dir) => commit((s) => moveEra(s, era.id, dir), () => `${key}:${dir < 0 ? 'up' : 'down'}`);
  const remove = () => commit((s) => removeEra(s, era.id), () => 'add-era');
  const addNewEvent = () => commit((s) => addEvent(s, era.id), (next) => {
    const last = next.eras.find((e) => e.id === era.id)?.events.at(-1);
    return last ? `ev:${last.id}:date` : `${key}:add`;
  });
  const full = era.events.length >= LIMITS.events;
  return h('section', 'era',
    h('div', 'item-head', h('h2', 'item-title', noun),
      actionBar(noun, key, index, total, { up: () => move(-1), down: () => move(1), remove })),
    textField('시대 이름', era.name, LIMITS.text, patch('name'), { key: `${key}:name` }),
    textField('기간', era.period, LIMITS.text, patch('period')),
    textField('설명', era.description, LIMITS.text, patch('description'), { multiline: true }),
    eraColorField(era, noun, themeAccent, commit),
    ...era.events.map((ev, i) => eventRow(era.id, ev, i, era.events.length, commit)),
    button('사건 추가', addNewEvent, {
      key: `${key}:add`, disabled: full, title: full ? `사건은 시대당 최대 ${LIMITS.events}개입니다` : '',
    }));
}

// Focus the control with this data-key; a move button that became disabled hands over to its twin.
function focusControl(root, key) {
  if (!key) return;
  const find = (k) => [...root.querySelectorAll('[data-key]')].find((node) => node.dataset.key === k);
  const twin = key.endsWith(':up') ? key.replace(/:up$/, ':down') : key.replace(/:down$/, ':up');
  const target = [find(key), find(twin)].find((node) => node && !node.disabled);
  if (target) target.focus();
}

/**
 * Rebuild the whole editor form from `state`.
 * @param {HTMLElement} root container whose children are replaced
 * @param {import('./model.js').Timeline} state
 * @param {(transform: (s: object) => object, focusOf?: (next: object) => string) => void} commit
 *   applies a state change; passing `focusOf` makes the caller rebuild the form and focus that data-key
 * @param {string} [focusKey] data-key of the control to focus after the rebuild
 */
export function renderEditor(root, state, commit, focusKey = '') {
  const meta = (field) => (value) => commit((s) => ({ ...s, [field]: value }));
  const setTheme = (value) => commit(
    (s) => ({ ...s, theme: THEMES.includes(value) ? value : THEMES[0] }), () => 'meta:theme');
  const addNewEra = () => commit((s) => addEra(s), (next) => `era:${next.eras.at(-1).id}:name`);
  const themeAccent = paletteOf(state).accent;
  const full = state.eras.length >= LIMITS.eras;
  const empty = h('p', 'hint', '아직 시대가 없습니다. 아래 버튼으로 첫 시대를 추가하세요.');
  root.replaceChildren(
    textField('타임라인 제목', state.title, LIMITS.title, meta('title'), { key: 'meta:title' }),
    textField('부제', state.subtitle, LIMITS.subtitle, meta('subtitle')),
    themeField(state.theme, setTheme),
    colorPanel(state, commit),
    ...(state.eras.length ? [] : [empty]),
    ...state.eras.map((era, i) => eraBlock(era, i, state.eras.length, commit, themeAccent)),
    button('시대 추가', addNewEra, {
      key: 'add-era', variant: 'primary', disabled: full, title: full ? `시대는 최대 ${LIMITS.eras}개입니다` : '',
    }));
  focusControl(root, focusKey);
}
