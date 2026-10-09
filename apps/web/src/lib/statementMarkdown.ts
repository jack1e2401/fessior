export type StatementFormat = 'heading' | 'bold' | 'inlineCode' | 'bullets' | 'codeBlock';

export interface FormattedStatement {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

export function normalizeStatementForEditing(statement: string) {
  if (!/<\/?(?:p|br|strong|b|em|i|code|pre|ul|ol|li|h[1-6])\b/i.test(statement)) {
    return statement;
  }

  return statement
    .replace(/<pre\b[^>]*>\s*<code\b[^>]*>/gi, '\n\n```\n')
    .replace(/<\/code>\s*<\/pre>/gi, '\n```\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p\b[^>]*>/gi, '')
    .replace(/<\/p>\s*/gi, '\n\n')
    .replace(/<h[1-6]\b[^>]*>/gi, '## ')
    .replace(/<\/h[1-6]>\s*/gi, '\n\n')
    .replace(/<strong\b[^>]*>|<b\b[^>]*>/gi, '**')
    .replace(/<\/strong>|<\/b>/gi, '**')
    .replace(/<em\b[^>]*>|<i\b[^>]*>/gi, '*')
    .replace(/<\/em>|<\/i>/gi, '*')
    .replace(/<code\b[^>]*>/gi, '`')
    .replace(/<\/code>/gi, '`')
    .replace(/<li\b[^>]*>/gi, '- ')
    .replace(/<\/li>\s*/gi, '\n')
    .replace(/<\/?(?:ul|ol)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/&(?:nbsp|#160);|&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/gi, (entity) => decodeHtmlEntities(entity))
    .trim();
}

const formatTokens: Record<StatementFormat, { prefix: string; suffix: string; placeholder: string }> = {
  heading: { prefix: '## ', suffix: '', placeholder: 'Section title' },
  bold: { prefix: '**', suffix: '**', placeholder: 'important text' },
  inlineCode: { prefix: '`', suffix: '`', placeholder: 'code' },
  bullets: { prefix: '- ', suffix: '', placeholder: 'list item' },
  codeBlock: { prefix: '```\n', suffix: '\n```', placeholder: 'code here' },
};

export function applyStatementFormat(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  format: StatementFormat,
): FormattedStatement {
  const selectedText = value.slice(selectionStart, selectionEnd);
  const token = formatTokens[format];
  const content = selectedText || token.placeholder;
  const formattedContent = format === 'bullets'
    ? content.split('\n').map((line) => `${token.prefix}${line}`).join('\n')
    : `${token.prefix}${content}${token.suffix}`;
  const nextValue = `${value.slice(0, selectionStart)}${formattedContent}${value.slice(selectionEnd)}`;
  const contentStart = selectionStart + token.prefix.length;

  return {
    value: nextValue,
    selectionStart: contentStart,
    selectionEnd: contentStart + content.length,
  };
}
