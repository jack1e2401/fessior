import React from 'react';

/* =====================================================
   StatusBadge — Submission verdict indicator
   Monotone palette: NO green/red/blue/yellow.
   - ACCEPTED = Vermilion outline (special, the only accent moment)
   - PENDING/PROCESSING = Stone text, pulse animation
   - All errors = Washi fill + Charcoal border + Linen text
   API unchanged: { status: string }
   ===================================================== */

interface StatusBadgeProps {
  status: string;
}

const LABELS: Record<string, string> = {
  ACCEPTED: 'Accepted',
  WA: 'Wrong Answer',
  TLE: 'Time Limit',
  MLE: 'Memory Limit',
  RE: 'Runtime Error',
  CE: 'Compile Error',
  SYSTEM_ERROR: 'System Error',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  ERROR: 'Error',
};

export const StatusBadge = React.memo(function StatusBadge({
  status,
}: StatusBadgeProps) {
  const label = LABELS[status] ?? status;

  // ACCEPTED: Vermilion outline — the only accent moment
  if (status === 'ACCEPTED') {
    return (
      <span className="inline-flex items-center font-display text-xs font-bold uppercase text-vermilion border border-vermilion px-2.5 py-1">
        {label}
      </span>
    );
  }

  // PENDING / PROCESSING: animated pulse
  if (status === 'PENDING' || status === 'PROCESSING') {
    return (
      <span className="inline-flex items-center font-display text-xs font-bold uppercase text-stone px-2.5 py-1 animate-pulse-soft">
        {label}
      </span>
    );
  }

  // Everything else: standard badge
  return (
    <span className="inline-flex items-center font-display text-xs font-bold uppercase bg-washi border border-charcoal text-linen px-2.5 py-1">
      {label}
    </span>
  );
});
