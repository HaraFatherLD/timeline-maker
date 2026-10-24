// Standalone HTML export and download file naming.
import { escapeHtml } from './escape.js';
import { clipText } from './model.js';
import { renderTimeline, TIMELINE_CSS } from './render.js';

const FALLBACK_TITLE = '타임라인';
const FALLBACK_FILENAME = 'timeline.html';
const MAX_BASENAME = 100;
// Page-level rules only the exported document needs (the app page styles itself).
const DOCUMENT_CSS = 'html,body{margin:0;padding:0}body>.tl{min-height:100vh}';
// Path separators, Windows-forbidden characters, control characters and bidi overrides.
const FORBIDDEN_CHARS = /[\\/:*?"<>|\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]/g;
const RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/**
 * Build a complete, self-contained HTML document (inline CSS, no scripts or external links).
 * @param {import('./model.js').Timeline} tl
 * @returns {string}
 */
export function exportHtml(tl) {
  const named = typeof tl?.title === 'string' ? tl.title.trim() : '';
  const title = escapeHtml(named || FALLBACK_TITLE);
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${TIMELINE_CSS}${DOCUMENT_CSS}
</style>
</head>
<body>
${renderTimeline(tl)}
</body>
</html>
`;
}

// Remove leading whitespace and trailing whitespace/dots (invalid at the end on Windows).
const trimEdges = (name) => name.replace(/^\s+/, '').replace(/[\s.]+$/, '');

// Windows treats "CON" and "CON.anything" as the device, so put the underscore after the stem.
function avoidReserved(name) {
  const dot = name.indexOf('.');
  const stem = dot === -1 ? name : name.slice(0, dot);
  return RESERVED_NAME.test(stem.trimEnd()) ? `${stem}_${name.slice(stem.length)}` : name;
}

/**
 * Turn a title into a safe download file name ending in `.html`.
 * Removes forbidden/control characters, trims spaces and trailing dots, caps the base name
 * at 100 characters, suffixes Windows reserved names with `_`, and falls back to timeline.html.
 * @param {unknown} title
 * @returns {string}
 */
export function safeFilename(title) {
  const cleaned = typeof title === 'string' ? title.replace(FORBIDDEN_CHARS, '') : '';
  const base = trimEdges(clipText(trimEdges(cleaned), MAX_BASENAME));
  return base ? `${avoidReserved(base)}.html` : FALLBACK_FILENAME;
}
