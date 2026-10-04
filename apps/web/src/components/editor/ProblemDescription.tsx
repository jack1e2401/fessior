import type { IProblem } from '@ocj/contracts';
import { renderMarkdownToHtml } from '../../lib/utils';
import { DifficultyBadge } from '../shared/index';

interface ProblemProps {
  problem?: IProblem | null;
}

export function ProblemDescription({ problem }: ProblemProps) {
  const title = problem?.title || 'Đang tải...';
  const difficulty = problem?.difficulty || 'EASY';
  const description = problem?.description || '<p>Đang tải chi tiết đề bài...</p>';

  return (
    <section className="flex flex-col h-[480px] bg-washi border border-charcoal overflow-hidden">
      <div className="flex items-center gap-1.5 font-display text-xs font-semibold px-4 py-2.5 text-vermilion border-b border-charcoal">
        Chi tiết đề bài
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <h1 className="font-display text-lg font-bold text-linen mb-3">{title}</h1>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <DifficultyBadge difficulty={difficulty as any} size="small" />
        </div>
        <div
          className="font-body text-sm text-linen/85 leading-relaxed [&_pre]:bg-ink [&_pre]:border [&_pre]:border-charcoal [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:text-linen [&_pre]:overflow-x-auto [&_code]:text-vermilion"
          dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(description) }}
        />
      </div>
    </section>
  );
}
