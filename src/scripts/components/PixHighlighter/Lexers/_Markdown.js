import { makePusher } from './_Utils.js';

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: lexer scanners are intentionally branch-heavy.
export function lexMarkdown(text) {
  const tokens = [];
  const push = makePusher(tokens);
  const lines = text.split('\n');
  let offset = 0;
  let inFence = false;
  let fenceChar = null;

  for (const line of lines) {
    const L = line.length;
    const trimmed = line.trim();
    // Fenced code block start/end
    if (/^(```|~~~)/.test(trimmed)) {
      push('mdc', offset, offset + L);
      const ch = trimmed[0];
      if (!inFence) {
        inFence = true;
        fenceChar = ch;
      } else if (inFence && ch === fenceChar) {
        inFence = false;
        fenceChar = null;
      }
      offset += L + 1; // +\n
      continue;
    }

    if (inFence) {
      push('mdc', offset, offset + L);
      offset += L + 1;
      continue;
    }

    // Heading
    if (/^#{1,6}\s+/.test(line)) {
      push('mdh', offset, offset + L);
      offset += L + 1;
      continue;
    }

    // Horizontal rule
    if (/^(\s*)([-*_]\s*){3,}$/.test(line)) {
      push('mdhr', offset, offset + L);
      offset += L + 1;
      continue;
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      push('mdbq', offset, offset + L);
      offset += L + 1;
      continue;
    }

    // List marker (ul/ol)
    if (/^\s*([-*+])\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const m = line.match(/^\s*((?:[-*+])|\d+\.)\s+/);
      if (m) push('mdli', offset + line.indexOf(m[1]), offset + line.indexOf(m[1]) + m[1].length);
    }

    // Inline code `...`
    scanInline(line, /`([^`]+)`/g, (s, e) => push('mdc', offset + s, offset + e));

    // Strong **...** o __...__
    scanInline(line, /\*\*([^*]+)\*\*/g, (s, e) => push('mds', offset + s, offset + e));
    scanInline(line, /__([^_]+)__/g, (s, e) => push('mds', offset + s, offset + e));

    // Emphasis *...* o _..._
    scanInline(line, /(?:^|[^*])\*([^*\n]+)\*(?!\*)/g, (s, e) =>
      push('mde', offset + s, offset + e)
    );
    scanInline(line, /(?:^|[^_])_([^_\n]+)_(?!_)/g, (s, e) => push('mde', offset + s, offset + e));

    // Link / Image
    scanInline(line, /!\[[^\]]*\]\([^)]*\)/g, (s, e) => push('mdimg', offset + s, offset + e));
    scanInline(line, /\[[^\]]+\]\([^)]*\)/g, (s, e) => push('mdl', offset + s, offset + e));

    offset += L + 1;
  }
  return tokens;

  function scanInline(line, re, cb) {
    let m;
    while ((m = re.exec(line))) {
      cb(m.index, m.index + m[0].length);
    }
  }
}
