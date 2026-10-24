// DOM binding: holds the state, drives the live preview, autosaves, and wires the toolbar.
// Together with editor.js, color-controls.js and dom.js this is the only code that touches the DOM.
import { exampleTimeline } from './example.js';
import { createTimeline } from './model.js';
import { renderTimeline, TIMELINE_CSS } from './render.js';
import { exportHtml, safeFilename } from './export.js';
import { normalizeTimeline, parseTimelineJson, serializeTimeline } from './schema.js';
import { renderEditor } from './editor.js';

const STORAGE_KEY = 'timeline-maker:v1';
// 1,000,000 characters take at most 3 bytes each in UTF-8, so a bigger file cannot be valid.
const MAX_FILE_BYTES = 3_000_010;

// Revoking the object URL right after click() can cancel the download in some browsers [A], so wait a moment.
const REVOKE_DELAY_MS = 1000;

const $ = (id) => document.getElementById(id);
const ui = {
  editor: $('editor'), preview: $('preview'), status: $('status'), warning: $('save-warning'),
  link: $('download-link'), file: $('json-file'),
};
let state = createTimeline();

function setStatus(message, isError = false) {
  ui.status.textContent = message;
  ui.status.dataset.kind = isError ? 'error' : 'info';
}

// Autosave problems get their own element: it stays until a save succeeds, and no status message touches it.
function setSaveWarning(message) {
  ui.warning.textContent = message;
  ui.warning.hidden = message === '';
}

// The preview is the only place HTML is parsed; renderTimeline escapes every user value.
function updatePreview() {
  ui.preview.innerHTML = renderTimeline(state);
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSaveWarning('');
  } catch {
    setSaveWarning('자동 저장 실패: 브라우저 저장소를 사용할 수 없거나 가득 찼습니다. 새로고침하면 변경 내용이 사라질 수 있으니 [JSON 저장]으로 백업하세요.');
  }
}

function renderForm(focusKey) {
  renderEditor(ui.editor, state, commit, focusKey);
}

// Apply a state change. Typing passes only `transform` (no form rebuild, so focus is kept);
// structural changes also pass `focusOf`, which triggers a rebuild and names the control to focus.
function commit(transform, focusOf) {
  state = transform(state);
  updatePreview();
  save();
  if (focusOf) renderForm(focusOf(state));
}

// Replace the whole document (example, reset, JSON import).
function replaceState(next, message) {
  state = next;
  updatePreview();
  renderForm();
  setStatus(message);
  save();
}

// Saved value -> timeline through normalizeTimeline; anything missing or corrupt falls back to the example.
function restore() {
  let text;
  try {
    text = localStorage.getItem(STORAGE_KEY);
  } catch {
    setSaveWarning('브라우저 저장소를 사용할 수 없어 자동 저장되지 않습니다. 작업 내용은 [JSON 저장]으로 백업하세요.');
    return { timeline: exampleTimeline(), message: '' };
  }
  if (text === null) return { timeline: exampleTimeline(), message: '' };
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    raw = undefined; // handled below like any other invalid value
  }
  const res = normalizeTimeline(raw);
  if (res.ok) return { timeline: res.value, message: '' };
  return { timeline: exampleTimeline(), message: '저장된 내용이 손상되어 기본 예제를 불러왔습니다.' };
}

// Download through one persistent hidden <a download>, so the file name stays inspectable.
// The object URL lives only in this call: a timer revokes it once the browser has started the download.
function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  ui.link.href = url;
  ui.link.download = filename;
  ui.link.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
  setStatus(`${filename} 다운로드를 시작했습니다.`);
}

async function copyHtml() {
  try {
    await navigator.clipboard.writeText(exportHtml(state));
    setStatus('복사됨');
  } catch {
    setStatus('복사 실패', true);
  }
}

// On any failure the current state stays untouched and only the status area changes.
async function importJson(file) {
  if (file.size > MAX_FILE_BYTES) {
    setStatus('불러오기 실패: 파일이 너무 큽니다 (최대 1,000,000자).', true);
    return;
  }
  let text;
  try {
    text = await file.text();
  } catch {
    setStatus('불러오기 실패: 파일을 읽을 수 없습니다.', true);
    return;
  }
  const res = parseTimelineJson(text);
  if (!res.ok) setStatus(`불러오기 실패: ${res.error}`, true);
  else replaceState(res.value, `JSON을 불러왔습니다 (시대 ${res.value.eras.length}개).`);
}

function onFileChosen() {
  const [file] = ui.file.files;
  ui.file.value = ''; // lets the same file be chosen again
  if (file) importJson(file);
}

function resetAll() {
  if (window.confirm('모든 내용을 지우고 빈 타임라인으로 시작할까요?')) replaceState(createTimeline(), '초기화했습니다.');
}

const ACTIONS = {
  'btn-download': () => download(safeFilename(state.title), exportHtml(state), 'text/html;charset=utf-8'),
  'btn-copy': copyHtml,
  'btn-json-save': () => download(safeFilename(state.title).replace(/\.html$/, '.json'),
    serializeTimeline(state), 'application/json;charset=utf-8'),
  'btn-json-load': () => ui.file.click(),
  'btn-example': () => replaceState(exampleTimeline(), '기본 예제를 불러왔습니다.'),
  'btn-reset': resetAll,
};

function boot() {
  const style = document.createElement('style');
  style.textContent = TIMELINE_CSS; // same CSS the exported file inlines, so preview and export match
  document.head.append(style);
  const restored = restore();
  state = restored.timeline;
  updatePreview();
  renderForm();
  if (restored.message) setStatus(restored.message, true);
  for (const [id, run] of Object.entries(ACTIONS)) $(id).addEventListener('click', run);
  ui.file.addEventListener('change', onFileChosen);
}

boot();
