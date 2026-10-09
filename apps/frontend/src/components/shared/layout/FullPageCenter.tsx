import type { ReactNode } from 'react';

/* =====================================================
   FullPageCenter — Full-page centered container
   Ink background, no AntD dependency
   ===================================================== */

export function FullPageCenter(props: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-ink text-linen font-body">
      <div className="mx-auto flex min-h-screen w-full max-w-[960px] items-center justify-center px-8 py-10">
        {props.children}
      </div>
    </div>
  );
}
