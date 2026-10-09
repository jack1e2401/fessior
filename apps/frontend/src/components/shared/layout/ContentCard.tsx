import React from 'react';
import type { ReactNode } from 'react';
import { Card } from './Card';

/* =====================================================
   ContentCard — backward-compatible wrapper over Card
   API unchanged: { children, className?, onClick?, hover? }
   ===================================================== */

interface ContentCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const ContentCard = React.memo(function ContentCard({
  children,
  className,
  onClick,
  hover = false,
}: ContentCardProps) {
  return (
    <Card
      variant="standard"
      hover={hover || !!onClick}
      className={className}
      onClick={onClick}
    >
      {children}
    </Card>
  );
});
