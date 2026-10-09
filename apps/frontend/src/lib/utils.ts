// 1. Công thức tính toán ELO của người chơi sau mỗi trận đấu PvP
export interface EloChangeResult {
  newWinnerElo: number;
  newLoserElo: number;
  winnerChange: number;
  loserChange: number;
}

export function calculateEloPvP(
  winnerElo: number,
  loserElo: number,
  options?: { floor?: number; winBonus?: number; lossPenalty?: number }
): EloChangeResult {
  const floor = options?.floor ?? 800;
  const winnerChange = options?.winBonus ?? 25;
  const loserChange = options?.lossPenalty ?? -15;

  return {
    newWinnerElo: winnerElo + winnerChange,
    newLoserElo: Math.max(floor, loserElo + loserChange),
    winnerChange,
    loserChange,
  };
}

// 2. Hàm format dung lượng bộ nhớ và thời gian thực thi
export function formatMemoryKb(kb: number): string {
  if (!kb && kb !== 0) return '0 KB';
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB`;
  }
  return `${kb} KB`;
}

export function formatMemoryMb(mb: number): string {
  if (!mb && mb !== 0) return '0 MB';
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

export function formatExecutionTime(ms: number | string): string {
  const msVal = typeof ms === 'string' ? parseFloat(ms) : ms;
  if (isNaN(msVal)) return '0ms';
  if (msVal >= 1000) {
    return `${(msVal / 1000).toFixed(2)}s`;
  }
  return `${msVal}ms`;
}

// 3. Hàm parse/hiển thị thông điệp lỗi hoặc định dạng Markdown
export function parseErrorMessage(error: any): string {
  if (!error) {
    return 'Đã xảy ra lỗi không xác định.';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return JSON.stringify(error);
}

export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  // Older problems store HTML directly. Keep rendering that format while new
  // statements use escaped Markdown so authored text cannot inject markup.
  if (/<\/?(?:p|br|strong|b|em|i|code|pre|ul|ol|li|h[1-6])\b/i.test(markdown)) return markdown;

  const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const renderInline = (value: string) => escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let code: string[] | null = null;
  const flushParagraph = () => {
    if (paragraph.length) blocks.push(`<p>${paragraph.map(renderInline).join('<br />')}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) blocks.push(`<ul>${list.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
    list = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      flushParagraph(); flushList();
      if (code) {
        blocks.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        code = null;
      } else code = [];
      continue;
    }
    if (code) { code.push(line); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushList();
      const level = heading[1].length;
      blocks.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph();
      list.push(line.replace(/^\s*[-*]\s+/, ''));
    } else if (!line.trim()) {
      flushParagraph(); flushList();
    } else {
      flushList(); paragraph.push(line);
    }
  }
  if (code) blocks.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  flushParagraph(); flushList();
  return blocks.join('');
}
