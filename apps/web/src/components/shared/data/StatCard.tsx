import React from 'react';
import type { ReactNode } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

/* =====================================================
   StatCard — Numeric stat with optional trend indicator
   Ink & Vermillion: mono value Linen, trend vermilion fill/outline
   API unchanged: { label, value, icon?, trend? }
   ===================================================== */

interface TrendInfo {
  value: number;
  isUp: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: TrendInfo;
}

export const StatCard = React.memo(function StatCard({
  label,
  value,
  icon,
  trend,
}: StatCardProps) {
  return (
    <div className="bg-washi border border-charcoal p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-stone mb-2">
            {label}
          </div>
          <div className="font-display text-3xl font-bold text-linen tracking-[-0.02em]">
            {value}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isUp ? (
                <>
                  <ArrowUp size={14} className="text-vermilion" />
                  <span className="font-display text-xs font-bold text-vermilion">
                    +{trend.value}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDown size={14} className="text-vermilion" />
                  <span className="font-display text-xs font-bold text-vermilion">
                    -{trend.value}%
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        {icon && <div className="text-stone shrink-0 ml-4 mt-1">{icon}</div>}
      </div>
    </div>
  );
});
