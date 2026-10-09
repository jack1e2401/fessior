import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  // Always show pagination UI even if 1 page or empty to keep layout consistent

  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    // Basic logic to show pages (always show first, last, current, and adjacent)
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (
      i === currentPage - 2 ||
      i === currentPage + 2
    ) {
      pages.push('...');
    }
  }

  // Remove duplicate ellipses
  const displayPages = pages.filter((p, index) => {
    return p !== '...' || pages[index - 1] !== '...';
  });

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center border border-charcoal bg-ink text-stone hover:border-vermilion hover:text-vermilion disabled:opacity-50 disabled:hover:border-charcoal disabled:hover:text-stone transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {displayPages.map((p, i) => (
        <button
          key={i}
          onClick={() => typeof p === 'number' && onPageChange(p)}
          disabled={p === '...'}
          className={`w-8 h-8 flex items-center justify-center font-display text-[13px] font-bold transition-colors ${
            p === currentPage
              ? 'bg-vermilion text-linen border border-vermilion'
              : p === '...'
              ? 'text-stone cursor-default'
              : 'border border-charcoal bg-ink text-stone hover:border-vermilion hover:text-vermilion'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center border border-charcoal bg-ink text-stone hover:border-vermilion hover:text-vermilion disabled:opacity-50 disabled:hover:border-charcoal disabled:hover:text-stone transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
