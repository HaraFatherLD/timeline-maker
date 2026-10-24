// Snapshot of what shipped with v3 (taken from git HEAD before v4 was committed). Only
// extra-base-theme.test.js uses it: changing this file would hide a change of classic, dark or minimal.

// The v3 stylesheet with its font stacks expanded (TIMELINE_CSS must still start with exactly this text).
export const PRE_V4_BASE_CSS = [
  '',
  '.tl{box-sizing:border-box;padding:36px 20px 56px;background:var(--bg);color:var(--fg);',
  'font:16px/1.7 Georgia,"Times New Roman","Noto Serif KR","Noto Serif CJK KR","Nanum Myeongjo",Batang,serif;overflow-wrap:anywhere}',
  '.theme-dark{font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif}',
  '.theme-minimal{font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif}',
  '.tl *,.tl ::before,.tl ::after{box-sizing:border-box}',
  '.tl :where(h1,h2,h3,p,ol){margin:0;padding:0}',
  '.tl :where(ol){list-style:none}',
  '.tl-head,.tl-eras{max-width:760px;margin:0 auto}',
  '.tl-head{margin-bottom:36px;text-align:center}',
  '.tl-title{font-size:2rem;line-height:1.25;color:var(--title)}',
  '.tl-subtitle{margin-top:8px;color:var(--subtitle)}',
  '.tl-eras{position:relative;padding-left:34px}',
  '.tl-eras::before{content:"";position:absolute;left:9px;top:8px;bottom:0;width:4px;border-radius:2px;background:var(--line)}',
  '.tl-era{position:relative;margin-bottom:40px}',
  '.tl-era:last-child{margin-bottom:0}',
  '.tl-era::before{content:"";position:absolute;left:-34px;top:17px;width:22px;height:22px;border-radius:50%;',
  'background:var(--accent);border:4px solid var(--bg);box-shadow:0 0 0 2px var(--accent)}',
  '.tl-era-head{padding:14px 18px;background:var(--card);border:1px solid var(--edge);border-left:4px solid var(--accent);border-radius:6px}',
  '.tl-era-name{font-size:1.4rem;line-height:1.3;color:var(--era-name)}',
  '.tl-era-period{margin-top:2px;font-size:.9rem;font-weight:700;color:var(--accent)}',
  '.tl-era-desc{margin-top:8px;white-space:pre-line}',
  '.tl-events{margin-top:10px}',
  '.tl-event{position:relative;padding:10px 0 10px 18px}',
  '.tl-event::before{content:"";position:absolute;left:-29px;top:19px;width:12px;height:12px;border-radius:50%;',
  'background:var(--bg);border:3px solid var(--dot)}',
  '.tl-date{font-size:.85rem;font-weight:700;letter-spacing:.03em;color:var(--date)}',
  '.tl-event-title{margin-top:1px;font-size:1.1rem;line-height:1.4}',
  '.tl-event-desc{margin-top:4px;color:var(--muted);white-space:pre-line}',
  '.theme-minimal .tl-era-head{padding:0 0 0 2px;border:0;border-radius:0;background:none}',
  '.theme-minimal .tl-era::before{left:-32px;top:6px;width:18px;height:18px;background:var(--bg);box-shadow:none}',
  '@media (max-width:520px){.tl{padding:24px 14px 40px}.tl-title{font-size:1.6rem}.tl-era-head{padding:12px 14px}}',
  '@media print{.tl{background:none}.tl-era-head,.tl-event{break-inside:avoid}}',
  '',
].join('\n');

// The v3 default colours of classic, dark and minimal.
export const PRE_V4_PALETTES = {
  classic: {
    bg: '#f6f1e7', title: '#2b2622', subtitle: '#6f655a', fg: '#2b2622', muted: '#6f655a', line: '#cdbfa6',
    accent: '#8a3a2b', dot: '#8a3a2b', card: '#fffdf8', edge: '#e3d8c4', eraName: '#2b2622', date: '#8a3a2b',
  },
  dark: {
    bg: '#0f131b', title: '#e7e9ef', subtitle: '#99a2b4', fg: '#e7e9ef', muted: '#99a2b4', line: '#2b3446',
    accent: '#f0b35a', dot: '#f0b35a', card: '#171c28', edge: '#262e40', eraName: '#e7e9ef', date: '#f0b35a',
  },
  minimal: {
    bg: '#ffffff', title: '#1c1c1e', subtitle: '#6a6e75', fg: '#1c1c1e', muted: '#6a6e75', line: '#d6d8dd',
    accent: '#1c1c1e', dot: '#1c1c1e', card: '#ffffff', edge: '#ffffff', eraName: '#1c1c1e', date: '#1c1c1e',
  },
};
