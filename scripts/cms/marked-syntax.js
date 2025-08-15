// Marked configuration / custom renderer producing <pre is="pix-highlighter"> blocks
import { Renderer } from 'marked';

function escapeHtml(str) {
  // Don't accidentally transform objects into [object Object]; if not string leave as-is
  if (typeof str !== 'string') return `${str}`; // simple conversion
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function createMarkedOptions() {
  const renderer = new Renderer();
  // Robust override: some environments provide a token object instead of raw string.
  renderer.code = (code, infostring) => {
    const actualCode = typeof code === 'object' && code && 'text' in code ? code.text : code;
    const lang = (infostring || (code?.lang) || '').trim().split(/\s+/)[0] || '';
    const langAttr = lang ? ` lang="${lang}"` : '';
    return `<pre is="pix-highlighter"${langAttr}><code>${escapeHtml(actualCode)}</code></pre>`;
  };
  return { renderer, headerIds: false, mangle: false };
}
