/* =====================================================
   SkeletonBlock — Animated placeholder for loading states
   ===================================================== */

interface SkeletonBlockProps {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  className?: string;
}

export function SkeletonBlock({ width = '100%', height = 16, rounded = false, className = '' }: SkeletonBlockProps) {
  const w = typeof width === 'number' ? `${width}px` : width;
  const h = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`animate-pulse bg-charcoal/50 ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={{ width: w, height: h }}
    />
  );
}
