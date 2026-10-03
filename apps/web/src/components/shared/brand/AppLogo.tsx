/* =====================================================
   AppLogo — Queu Arena brand mark (Ink & Vermillion)
   ===================================================== */

export function AppLogo(props: { variant?: 'full' | 'mark' }) {
  const variant = props.variant ?? 'full';
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      {/* Mark: rhombus Charcoal + Vermilion core dot */}
      <div className="relative grid h-10 w-10 place-items-center rounded-[3px] bg-charcoal">
        <div className="h-3 w-3 bg-vermilion rotate-45" />
      </div>
      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <div className="font-display text-[15px] font-bold tracking-tight text-linen">
            QUEU
          </div>
          <div className="font-display text-[10px] font-bold tracking-[0.2em] text-vermilion uppercase">
            ARENA
          </div>
        </div>
      )}
    </div>
  );
}
