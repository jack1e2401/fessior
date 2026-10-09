import React from 'react';
import type { ReactNode } from 'react';

/* =====================================================
   PageHeader — Page title + subtitle + optional action
   API unchanged: { title, subtitle?, extra? }
   Ink & Vermillion: font-display Linen, divider Charcoal
   ===================================================== */

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
}

export const PageHeader = React.memo(function PageHeader({
  title,
  subtitle,
  extra,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8 border-b border-charcoal pb-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-linen tracking-[-0.01em]">
          {title}
        </h1>
        {subtitle && (
          <p className="font-body text-sm text-stone mt-1">{subtitle}</p>
        )}
      </div>
      {extra && <div className="shrink-0">{extra}</div>}
    </div>
  );
});
