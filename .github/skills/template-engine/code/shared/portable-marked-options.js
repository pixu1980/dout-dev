import { Renderer } from 'marked';

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function createPortableMarkedOptions(options = {}) {
  const renderer = new Renderer();
  const codeBlockIs = options.codeBlockIs || 'pix-highlighter';
  let taskCounter = 0;

  renderer.code = (code, infostring) => {
    const actualCode = typeof code === 'object' && code && 'text' in code ? code.text : code;
    const language = (infostring || code?.lang || '').trim().split(/\s+/)[0] || '';
    const languageAttr = language ? ` data-lang="${escapeHtml(language)}"` : '';
    return `<pre is="${escapeHtml(codeBlockIs)}"${languageAttr}><code>${escapeHtml(actualCode)}</code></pre>`;
  };

  renderer.listitem = function listitem(tokenOrText, task, checked) {
    if (tokenOrText && typeof tokenOrText === 'object' && 'type' in tokenOrText) {
      const token = tokenOrText;
      const parsed = this.parser.parse(token.tokens, !!token.loose).trim();

      if (token.task) {
        taskCounter += 1;
        const id = `md-task-${taskCounter}`;
        const checkedAttr = token.checked ? ' checked' : '';
        const ariaLabel = escapeHtml(
          String(token.text || '')
            .replace(/\s+/g, ' ')
            .trim()
        );
        return `<li class="task-list-item"><label for="${id}"><input id="${id}" type="checkbox" disabled${checkedAttr} aria-label="${ariaLabel}" /> ${parsed}</label></li>`;
      }

      return `<li>${parsed}</li>`;
    }

    if (task) {
      taskCounter += 1;
      const id = `md-task-${taskCounter}`;
      const checkedAttr = checked ? ' checked' : '';
      const ariaLabel = escapeHtml(
        String(tokenOrText || '')
          .replace(/\s+/g, ' ')
          .trim()
      );
      return `<li class="task-list-item"><label for="${id}"><input id="${id}" type="checkbox" disabled${checkedAttr} aria-label="${ariaLabel}" /> ${tokenOrText}</label></li>`;
    }

    return `<li>${tokenOrText}</li>`;
  };

  return { renderer };
}
