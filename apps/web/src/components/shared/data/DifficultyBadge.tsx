import React from 'react';

/* =====================================================
   DifficultyBadge — Problem difficulty indicator
   Monotone palette: NO green/orange/red.
   All levels use Washi fill + Charcoal border.
   Differentiation by letter + subtle opacity.
   API unchanged: { difficulty: 'EASY'|'MEDIUM'|'HARD', size? }
   ===================================================== */

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  size?: 'small' | 'default';
}

const LABELS: Record<Difficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

const LETTERS: Record<Difficulty, string> = {
  EASY: 'E',
  MEDIUM: 'M',
  HARD: 'H',
};

export const DifficultyBadge = React.memo(function DifficultyBadge({
  difficulty,
  size = 'default',
}: DifficultyBadgeProps) {
  const isSmall = size === 'small';
  const letter = LETTERS[difficulty];

  return (
    <span
      title={LABELS[difficulty]}
      className={`
        inline-flex items-center justify-center font-display font-bold uppercase
        bg-washi border border-charcoal text-linen
        ${isSmall ? 'text-[10px] px-1.5 py-0 leading-none' : 'text-xs px-2.5 py-1'}
      `}
    >
      {letter}
    </span>
  );
});
