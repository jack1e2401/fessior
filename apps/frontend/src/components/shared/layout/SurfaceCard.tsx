import type { ReactNode } from 'react';
import { Card } from './Card';

/* =====================================================
   SurfaceCard — backward-compatible wrapper over Card
   API unchanged: { title?, children, className? }
   ===================================================== */

export function SurfaceCard(props: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={props.className}>
      {props.title && (
        <div className="font-display text-sm font-bold uppercase tracking-[0.12em] text-stone mb-4">
          {props.title}
        </div>
      )}
      {props.children}
    </Card>
  );
}
