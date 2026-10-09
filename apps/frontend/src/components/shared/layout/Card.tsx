import type { ReactNode, HTMLAttributes } from 'react';

/* =====================================================
   Card — Internal base component (not exported publicly)
   Ink & Vermillion design system
   ===================================================== */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Visual variant */
  variant?: 'standard' | 'active';
  /** Enable hover lift effect */
  hover?: boolean;
}

export function Card({ children, variant = 'standard', hover = false, className = '', ...rest }: CardProps) {
  const base = 'bg-washi border border-charcoal p-6';
  const active = variant === 'active' ? 'border-l-[3px] border-l-vermilion' : '';
  const h = hover ? 'cursor-pointer transition-colors hover:border-stone' : '';

  return (
    <div className={`${base} ${active} ${h} ${className}`} {...rest}>
      {children}
    </div>
  );
}
