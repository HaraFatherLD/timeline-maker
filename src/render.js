// Pure rendering: Timeline -> HTML string. Every user value goes through escapeHtml, and colours are
// re-validated with isHex, so only #rrggbb can reach a style attribute (even for unnormalised input).
// TIMELINE_CSS is shared by the live preview and the exported document, so both look the same.
// The CSS must stay self-contained: no url(), no @import, system font stacks only, and no colour literals.
// Every colour is one of the twelve palette variables set on the root (and, per era, on its <li>).
import { escapeHtml } from './escape.js';
import { THEMES } from './schema.js';
import { PALETTE_TOKENS, cssVar, isHex, paletteOf } from './palette.js';

const SERIF = 'Georgia,"Times New Roman","Noto Serif KR","Noto Serif CJK KR","Nanum Myeongjo",Batang,serif';
const SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif';

// An era colour overrides these tokens on its own <li>: era dot, card edge and period, event dots, event dates.
const ERA_COLOR_TOKENS = ['accent', 'dot', 'date'];

/** CSS for the `.tl` root and its three themes. Themes keep only non-colour rules (fonts, minimal layout). */
export const TIMELINE_CSS = `
.tl{box-sizing:border-box;padding:36px 20px 56px;background:var(--bg);color:var(--fg);
font:16px/1.7 ${SERIF};overflow-wrap:anywhere}
.theme-dark{font-family:${SANS}}
.theme-minimal{font-family:${SANS}}
.tl *,.tl ::before,.tl ::after{box-sizing:border-box}
.tl :where(h1,h2,h3,p,ol){margin:0;padding:0}
.tl :where(ol){list-style:none}
.tl-head,.tl-eras{max-width:760px;margin:0 auto}
.tl-head{margin-bottom:36px;text-align:center}
.tl-title{font-size:2rem;line-height:1.25;color:var(--title)}
.tl-subtitle{margin-top:8px;color:var(--subtitle)}
.tl-eras{position:relative;padding-left:34px}
.tl-eras::before{content:"";position:absolute;left:9px;top:8px;bottom:0;width:4px;border-radius:2px;background:var(--line)}
.tl-era{position:relative;margin-bottom:40px}
.tl-era:last-child{margin-bottom:0}
.tl-era::before{content:"";position:absolute;left:-34px;top:17px;width:22px;height:22px;border-radius:50%;
background:var(--accent);border:4px solid var(--bg);box-shadow:0 0 0 2px var(--accent)}
.tl-era-head{padding:14px 18px;background:var(--card);border:1px solid var(--edge);border-left:4px solid var(--accent);border-radius:6px}
.tl-era-name{font-size:1.4rem;line-height:1.3;color:var(--era-name)}
.tl-era-period{margin-top:2px;font-size:.9rem;font-weight:700;color:var(--accent)}
.tl-era-desc{margin-top:8px;white-space:pre-line}
.tl-events{margin-top:10px}
.tl-event{position:relative;padding:10px 0 10px 18px}
.tl-event::before{content:"";position:absolute;left:-29px;top:19px;width:12px;height:12px;border-radius:50%;
background:var(--bg);border:3px solid var(--dot)}
.tl-date{font-size:.85rem;font-weight:700;letter-spacing:.03em;color:var(--date)}
.tl-event-title{margin-top:1px;font-size:1.1rem;line-height:1.4}
.tl-event-desc{margin-top:4px;color:var(--muted);white-space:pre-line}
.theme-minimal .tl-era-head{padding:0 0 0 2px;border:0;border-radius:0;background:none}
.theme-minimal .tl-era::before{left:-32px;top:6px;width:18px;height:18px;background:var(--bg);box-shadow:none}
@media (max-width:520px){.tl{padding:24px 14px 40px}.tl-title{font-size:1.6rem}.tl-era-head{padding:12px 14px}}
@media print{.tl{background:none}.tl-era-head,.tl-event{break-inside:avoid}}
`;

const list = (value) => (Array.isArray(value) ? value : []);

// `<tag class="cls">escaped text</tag>`, or '' when there is no text.
function textTag(tag, cls, value) {
  const text = escapeHtml(value);
  return text ? `<${tag} class="${cls}">${text}</${tag}>` : '';
}

// `--name:#rrggbb;...` for the twelve tokens in PALETTE_TOKENS order (always all of them).
function rootStyle(tl) {
  const colors = paletteOf(tl);
  return PALETTE_TOKENS.map((token) => `${cssVar(token)}:${colors[token]}`).join(';');
}

// ` style="--accent:#c;--dot:#c;--date:#c"` for a valid era colour, '' otherwise.
function eraStyle(color) {
  if (!isHex(color)) return '';
  const hex = color.toLowerCase();
  return ` style="${ERA_COLOR_TOKENS.map((token) => `${cssVar(token)}:${hex}`).join(';')}"`;
}

function renderEvent(ev) {
  return '<li class="tl-event">'
    + textTag('p', 'tl-date', ev?.date)
    + textTag('h3', 'tl-event-title', ev?.title)
    + textTag('p', 'tl-event-desc', ev?.description)
    + '</li>';
}

function renderEra(era) {
  const events = list(era?.events).map(renderEvent).join('');
  return `<li class="tl-era"${eraStyle(era?.color)}><div class="tl-era-head">`
    + textTag('h2', 'tl-era-name', era?.name)
    + textTag('p', 'tl-era-period', era?.period)
    + textTag('p', 'tl-era-desc', era?.description)
    + '</div>'
    + (events ? `<ol class="tl-events">${events}</ol>` : '')
    + '</li>';
}

/**
 * Render a timeline as an HTML string: `<div class="tl theme-NAME" style="--bg:#...;...">...</div>`.
 * The root style carries all twelve palette variables; an era with a valid colour also gets its own style.
 * Tolerates incomplete input; unknown themes fall back to classic.
 * @param {import('./model.js').Timeline} tl
 * @returns {string}
 */
export function renderTimeline(tl) {
  const theme = THEMES.includes(tl?.theme) ? tl.theme : THEMES[0];
  const head = textTag('h1', 'tl-title', tl?.title) + textTag('p', 'tl-subtitle', tl?.subtitle);
  const eras = list(tl?.eras).map(renderEra).join('');
  return `<div class="tl theme-${theme}" style="${rootStyle(tl)}">`
    + (head ? `<header class="tl-head">${head}</header>` : '')
    + (eras ? `<ol class="tl-eras">${eras}</ol>` : '')
    + '</div>';
}
