import React from 'react';
import type { ReactNode } from 'react';
import { FileQuestion } from 'lucide-react';

/* =====================================================
   EmptyState — Empty UI placeholder
   API unchanged: { icon?, title, description?, action? }
   Ink & Vermillion: icon Stone, title Linen, desc Stone
   ===================================================== */

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 text-stone">
        {icon ?? <FileQuestion size={48} strokeWidth={1.5} />}
      </div>
      <h3 className="font-display text-base font-bold text-linen mb-2">
        {title}
      </h3>
      {description && (
        <p className="font-body text-sm text-stone max-w-md leading-relaxed mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
});
