import React from 'react';
import type { ReactNode } from 'react';

/* =====================================================
   SectionHeader — Section divider with uppercase label
   API unchanged: { title, action? }
   Ink & Vermillion: font-display uppercase Stone, border Charcoal
   ===================================================== */

interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
}

export const SectionHeader = React.memo(function SectionHeader({
  title,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-charcoal pb-3 mb-4">
      <span className="font-display text-xs font-bold uppercase tracking-[0.15em] text-stone">
        {title}
      </span>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
});
