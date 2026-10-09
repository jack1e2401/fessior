import FessiorMark from '../../../assets/FessiorMark.png';

export function AppLogo(props: { variant?: 'full' | 'mark' }) {
  const variant = props.variant ?? 'full';
  return (
    <div className="inline-flex select-none items-center gap-2">
      <img src={FessiorMark} alt="" className="h-9 w-9 shrink-0 object-contain" />
      {variant === 'full' && (
        <span className="font-display text-[17px] font-bold tracking-[0.12em] text-linen">FESSIOR</span>
      )}
    </div>
  );
}
