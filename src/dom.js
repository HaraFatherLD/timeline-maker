// Tiny DOM helpers shared by the form builders. Everything is built with createElement/textContent,
// so strings become text nodes and never markup.

/** Display names of the themes in the UI (keys are the THEMES values). */
export const THEME_LABELS = Object.freeze({
  classic: '클래식', dark: '다크', minimal: '미니멀', block: '블록', diamond: '다이아', zigzag: '지그재그',
  metro: '노선도', notebook: '노트', cards: '카드 배지', newspaper: '신문', terminal: '터미널',
});

/**
 * Create an element with an optional class name; string children become text nodes.
 * @param {string} tag
 * @param {string} [className]
 * @param {...(Node | string)} children
 * @returns {HTMLElement}
 */
export function h(tag, className, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children);
  return node;
}

/**
 * Create a `<button type="button">`.
 * @param {string} text visible label
 * @param {(event: Event) => void} onClick
 * @param {{ label?: string, key?: string, disabled?: boolean, variant?: string, title?: string }} [opts]
 *   label: aria-label (also the tooltip); key: data-key used to restore focus; variant: extra class name
 * @returns {HTMLButtonElement}
 */
export function button(text, onClick, { label = '', key = '', disabled = false, variant = '', title = '' } = {}) {
  const node = h('button', variant, text);
  node.type = 'button';
  if (label) node.setAttribute('aria-label', label);
  if (label || title) node.title = title || label;
  node.disabled = disabled;
  if (key) node.dataset.key = key;
  node.addEventListener('click', onClick);
  return node;
}
