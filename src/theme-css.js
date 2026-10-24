// Structural theme CSS (v4): eight themes whose line, markers and cards differ in shape, not only in colour.
// Pure strings, no DOM. render.js appends them after the base rules; a theme rule (`.theme-X .sel`, one class
// more than the base `.sel`) overrides the base without !important. The markup never changes: a theme is only
// the root class. Same constraints as the base CSS: system font stacks, no url(), no @import, no colour
// literals or colour keywords (only the twelve palette variables) and no CSS escapes (glyphs are written as-is).
// Geometry of the left-line themes: the line's centre sits at C inside .tl-eras (padding-left P); a marker of
// size S is centred on it with `left: C - S/2 - P`, relative to its .tl-era (or .tl-event) left edge.

/** Serif system font stack (classic look). */
export const SERIF = 'Georgia,"Times New Roman","Noto Serif KR","Noto Serif CJK KR","Nanum Myeongjo",Batang,serif';
/** Sans-serif system font stack. */
export const SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif';
// Handwriting-ish system fonts (notebook); anything missing falls through to a plain sans-serif.
const HAND = '"Segoe Print","Bradley Hand","Chalkboard SE","Comic Sans MS","Nanum Pen Script","Noto Sans KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif';
// Monospace system fonts. None of them is guaranteed to have Hangul (Courier New and the bare `monospace` fall
// back to a bitmap-like face on Windows), so Hangul-capable UI fonts come last, right before the generic family.
const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono","D2Coding","Nanum Gothic Coding","Courier New","Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",monospace';

// block: filled squares on a thick solid line, sharp heavy cards, bold sans. line C=12, P=48.
const BLOCK = `
.theme-block{font-family:${SANS}}
.theme-block .tl-title{font-weight:800}
.theme-block .tl-eras{padding-left:48px}
.theme-block .tl-eras::before{left:8px;width:8px;border-radius:0}
.theme-block .tl-era::before{left:-48px;top:18px;width:24px;height:24px;border:0;border-radius:0;background:var(--accent);box-shadow:0 0 0 3px var(--bg)}
.theme-block .tl-era-head{border:2px solid var(--edge);border-left:8px solid var(--accent);border-radius:0}
.theme-block .tl-era-name{font-weight:800}
.theme-block .tl-event::before{left:-41px;top:17px;width:10px;height:10px;border:0;border-radius:0;background:var(--dot);box-shadow:0 0 0 3px var(--bg)}
.theme-block .tl-event-title{font-weight:700}
`;

// diamond: rotated squares on a dashed gradient line, serif, thin double-framed cards. line C=12, P=42.
const DIAMOND = `
.theme-diamond{font-family:${SERIF}}
.theme-diamond .tl-eras{padding-left:42px}
.theme-diamond .tl-eras::before{left:10px;width:4px;border-radius:0;background:repeating-linear-gradient(to bottom,var(--line) 0,var(--line) 8px,var(--bg) 8px,var(--bg) 14px)}
.theme-diamond .tl-era::before{left:-38px;top:22px;width:16px;height:16px;border:0;border-radius:0;background:var(--accent);box-shadow:0 0 0 4px var(--bg);transform:rotate(45deg)}
.theme-diamond .tl-era-head{border:1px solid var(--edge);border-radius:0;box-shadow:inset 0 0 0 3px var(--card),inset 0 0 0 4px var(--edge)}
.theme-diamond .tl-era-name{letter-spacing:.02em}
.theme-diamond .tl-era-period{font-style:italic}
.theme-diamond .tl-event::before{left:-35px;top:17px;width:10px;height:10px;border:2px solid var(--dot);border-radius:0;background:var(--bg);transform:rotate(45deg)}
`;

// zigzag: centre line, eras alternate left/right (plain block flow, no floats), big circles on the line.
// Only this root is a size container, so the one-column rules in THEME_MEDIA_CSS follow the width of the
// timeline area (the editor's narrow preview pane), not the viewport; they must stay after these rules.
// The card sets no padding: the base padding and its 520px mobile reduction apply as in the other themes.
const ZIGZAG = `
.theme-zigzag{container-type:inline-size}
.theme-zigzag .tl-eras{padding-left:0}
.theme-zigzag .tl-eras::before{left:50%;width:4px;margin-left:-2px}
.theme-zigzag .tl-era{width:50%;padding-right:36px}
.theme-zigzag .tl-era:nth-child(even){margin-left:50%;padding-right:0;padding-left:36px}
.theme-zigzag .tl-era::before{top:16px;width:28px;height:28px;border:0;border-radius:50%;background:var(--accent);box-shadow:0 0 0 5px var(--bg),0 0 0 8px var(--line)}
.theme-zigzag .tl-era:nth-child(odd)::before{left:auto;right:-14px}
.theme-zigzag .tl-era:nth-child(even)::before{left:-14px}
.theme-zigzag .tl-era-head{border:2px solid var(--edge);border-radius:18px}
.theme-zigzag .tl-event{padding-left:22px}
.theme-zigzag .tl-event::before{left:2px;top:18px;width:10px;height:10px;border:0;border-radius:50%;background:var(--dot)}
`;

// metro: very thick rounded line, double-ring stations, bold names, no cards. line C=16, P=60.
const METRO = `
.theme-metro{font-family:${SANS}}
.theme-metro .tl-eras{padding-left:60px}
.theme-metro .tl-eras::before{left:10px;top:16px;width:12px;border-radius:6px}
.theme-metro .tl-era::before{left:-60px;top:0;width:32px;height:32px;border:5px solid var(--accent);border-radius:50%;background:var(--accent);box-shadow:inset 0 0 0 4px var(--bg)}
.theme-metro .tl-era-head{padding:0;border:0;border-radius:0;background:none}
.theme-metro .tl-era-name{font-size:1.6rem;font-weight:800;line-height:1.2}
.theme-metro .tl-era-period{display:inline-block;max-width:100%;margin-top:4px;padding:0 10px;border-radius:999px;background:var(--accent);color:var(--bg);font-size:.8rem}
.theme-metro .tl-event::before{left:-52px;top:14px;width:16px;height:16px;border:4px solid var(--dot);border-radius:50%;background:var(--bg)}
.theme-metro .tl-event-title{font-weight:700}
`;

// notebook: ruled paper (line-height 32px = ruling pitch, every vertical gap a multiple of it), double
// margin rule from --edge, checkbox eras, dash events, transparent cards. P=48.
const NOTEBOOK = `
.theme-notebook{padding:32px 20px 64px;background:repeating-linear-gradient(to bottom,var(--bg) 0,var(--bg) 27px,var(--line) 27px,var(--line) 29px,var(--bg) 29px,var(--bg) 32px);font-family:${HAND};line-height:32px}
.theme-notebook .tl-head{margin-bottom:32px}
.theme-notebook .tl-title{font-size:1.9rem;line-height:64px}
.theme-notebook .tl-subtitle{margin-top:0}
.theme-notebook .tl-eras{padding-left:48px}
.theme-notebook .tl-eras::before{left:6px;top:0;bottom:-64px;width:7px;border:solid var(--edge);border-width:0 2px;border-radius:0;background:none}
.theme-notebook .tl-era{margin-bottom:32px}
.theme-notebook .tl-era:last-child{margin-bottom:0}
.theme-notebook .tl-era::before{left:-26px;top:6px;width:20px;height:20px;border:2px solid var(--accent);border-radius:3px;background:none;box-shadow:none}
.theme-notebook .tl-era-head{padding:0;border:0;border-radius:0;background:none}
.theme-notebook .tl-era-name{font-size:1.35rem;line-height:32px}
.theme-notebook .tl-era-period{margin-top:0;font-size:.95rem}
.theme-notebook .tl-era-desc,.theme-notebook .tl-events,.theme-notebook .tl-event-desc{margin-top:0}
.theme-notebook .tl-event{padding:0 0 0 22px}
.theme-notebook .tl-event::before{left:2px;top:15px;width:11px;height:3px;border:0;border-radius:2px;background:var(--dot)}
.theme-notebook .tl-event-title{margin-top:0;line-height:32px}
`;

// cards: no line; each era is one shadowed card with a numbered badge (CSS counter), dot bullets for events.
const CARDS = `
.theme-cards{font-family:${SANS}}
.theme-cards .tl-eras{padding-left:0;counter-reset:era}
.theme-cards .tl-eras::before{display:none}
.theme-cards .tl-era{margin-bottom:24px;padding:16px 18px 10px 68px;background:var(--card);border:1px solid var(--edge);border-radius:14px;box-shadow:0 2px 0 var(--edge),0 14px 22px -12px var(--edge)}
.theme-cards .tl-era::before{counter-increment:era;content:counter(era);left:16px;top:13px;width:36px;height:36px;border:0;border-radius:50%;background:var(--accent);box-shadow:none;color:var(--card);font-weight:800;line-height:36px;text-align:center}
.theme-cards .tl-era-head{padding:0;border:0;border-radius:0;background:none}
.theme-cards .tl-era-name{font-size:1.3rem}
.theme-cards .tl-event::before{left:2px;top:19px;width:8px;height:8px;border:0;background:var(--dot)}
`;

// newspaper: double rules (border-style double), stamped period box, stamp-like era marker, ▸ events, columns.
const NEWSPAPER = `
.theme-newspaper .tl-head{padding:14px 0;border-top:6px double var(--line);border-bottom:6px double var(--line)}
.theme-newspaper .tl-title{font-size:2.2rem;font-weight:900;text-transform:uppercase}
.theme-newspaper .tl-subtitle{font-style:italic}
.theme-newspaper .tl-eras{padding-left:42px}
.theme-newspaper .tl-eras::before{left:10px;width:3px;border:0;border-left:3px double var(--line);border-radius:0;background:none}
.theme-newspaper .tl-era::before{left:-39px;top:20px;width:18px;height:18px;border:3px double var(--accent);border-radius:0;background:var(--bg);box-shadow:none}
.theme-newspaper .tl-era-head{padding:10px 14px;border:0;border-top:4px double var(--line);border-bottom:4px double var(--line);border-radius:0}
.theme-newspaper .tl-era-name{font-weight:900}
.theme-newspaper .tl-era-period{display:inline-block;max-width:100%;margin-top:6px;padding:0 10px;border:2px solid var(--accent);letter-spacing:.06em}
.theme-newspaper .tl-events{column-width:15rem;column-gap:28px;column-rule:1px solid var(--edge)}
.theme-newspaper .tl-event{padding:8px 0 8px 18px;break-inside:avoid}
.theme-newspaper .tl-event::before{content:"▸";left:0;top:8px;width:auto;height:auto;border:0;border-radius:0;background:none;color:var(--dot);font-size:.9rem;line-height:1.7}
`;

// terminal: monospace, > and - prompt markers, dashed rule and dashed card borders. line C=9, P=32.
const TERMINAL = `
.theme-terminal{font-family:${MONO};font-size:15px}
.theme-terminal .tl-head{text-align:left}
.theme-terminal .tl-title{font-size:1.5rem}
.theme-terminal .tl-eras{padding-left:32px}
.theme-terminal .tl-eras::before{left:8px;width:0;border-left:2px dashed var(--line);border-radius:0;background:none}
.theme-terminal .tl-era::before{content:">";left:-32px;top:11px;width:18px;height:24px;border:0;border-radius:0;background:var(--bg);box-shadow:none;color:var(--accent);font-weight:700;line-height:24px;text-align:center}
.theme-terminal .tl-era-head{padding:10px 14px;border:1px dashed var(--edge);border-radius:0}
.theme-terminal .tl-era-name{font-size:1.15rem}
.theme-terminal .tl-event{padding-left:22px}
.theme-terminal .tl-event::before{content:"-";left:2px;top:10px;width:auto;height:auto;border:0;border-radius:0;background:none;color:var(--dot);line-height:1.7}
`;

/**
 * CSS of the eight structural themes by theme id, in THEMES order. Every rule starts with its own
 * `.theme-<id>` class, so a theme never changes another one.
 * @type {Readonly<Record<string, string>>}
 */
export const THEME_CSS = Object.freeze({
  block: BLOCK, diamond: DIAMOND, zigzag: ZIGZAG, metro: METRO,
  notebook: NOTEBOOK, cards: CARDS, newspaper: NEWSPAPER, terminal: TERMINAL,
});

// zigzag as a single column with its line on the left: one rule body for the container query and its fallback.
const ZIGZAG_ONE_COLUMN = `
.theme-zigzag .tl-eras{padding-left:48px}
.theme-zigzag .tl-eras::before{left:12px;margin-left:0}
.theme-zigzag .tl-era,.theme-zigzag .tl-era:nth-child(even){width:auto;margin-left:0;padding:0}
.theme-zigzag .tl-era:nth-child(odd)::before,.theme-zigzag .tl-era:nth-child(even)::before{left:-48px;right:auto}
.theme-zigzag .tl-event{padding-left:18px}
.theme-zigzag .tl-event::before{left:-39px}
`;

/**
 * Container, fallback and print rules of the structural themes; they must come after THEME_CSS. zigzag turns
 * into a single column when the timeline area is at most 600px wide (a container query on the zigzag root;
 * for an exported page that is the 640px viewport minus its 20px side padding). Browsers without container
 * queries get the same rules from a 640px viewport media query inside `@supports not`. In print the markers
 * and rules keep their colours (a dark terminal page keeps its background so the light text stays readable)
 * and a card is not split.
 * @type {string}
 */
export const THEME_MEDIA_CSS = `
@container (max-width:600px){${ZIGZAG_ONE_COLUMN}}
@supports not (container-type:inline-size){@media (max-width:640px){${ZIGZAG_ONE_COLUMN}}}
@media print{
.theme-block,.theme-diamond,.theme-zigzag,.theme-metro,.theme-notebook,.theme-cards,.theme-newspaper,.theme-terminal{-webkit-print-color-adjust:exact;print-color-adjust:exact}
.theme-terminal{background:var(--bg)}
.theme-cards .tl-era{break-inside:avoid}
}
`;
