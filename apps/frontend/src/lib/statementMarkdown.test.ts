import { describe, expect, it } from 'vitest';
import { applyStatementFormat, normalizeStatementForEditing } from './statementMarkdown';
import { renderMarkdownToHtml } from './utils';

describe('problem statement authoring', () => {
  it('converts the existing HTML statement format to editable Markdown', () => {
    expect(normalizeStatementForEditing('<p>Use <code>nums</code> and return a value.</p><p>Done.</p>'))
      .toBe('Use `nums` and return a value.\n\nDone.');
    expect(normalizeStatementForEditing('<p>Check <code>a &lt; b</code>.</p>'))
      .toBe('Check `a < b`.');
  });

  it('wraps selected text in the chosen Markdown syntax', () => {
    expect(applyStatementFormat('Given nums', 6, 10, 'inlineCode')).toMatchObject({
      value: 'Given `nums`',
      selectionStart: 7,
      selectionEnd: 11,
    });
  });

  it('renders section headings, code spans, and bullet lists for the preview', () => {
    const html = renderMarkdownToHtml('## Input\nRead `n` values.\n\n- First\n- Second');
    expect(html).toContain('<h2>Input</h2>');
    expect(html).toContain('<code>n</code>');
    expect(html).toContain('<ul><li>First</li><li>Second</li></ul>');
  });
});
