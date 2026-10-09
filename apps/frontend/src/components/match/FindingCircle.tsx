import React, { useRef } from 'react';
import { Swords } from 'lucide-react';

/* =====================================================
   FindingCircle — "The Pulse Ring"
   Ink & Vermillion signature element
   Props unchanged: { isSearching, onToggleSearch, searchDuration }
   States: idle | searching | found | timeout | cancelled
   ===================================================== */

interface FindingCircleProps {
  isSearching: boolean;
  onToggleSearch: () => void;
  searchDuration: number;
}

export const FindingCircle: React.FC<FindingCircleProps> = ({
  isSearching,
  onToggleSearch,
  searchDuration,
}) => {
  const ringRef = useRef<HTMLDivElement>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isTimeout = searchDuration > 300;

  return (
    <div className="w-full max-w-[320px] min-h-[400px] bg-washi border border-charcoal flex items-center justify-center p-6">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* ── Ring ── */}
        <div
          ref={ringRef}
          className={`
            w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] rounded-full border-[3px] flex items-center justify-center
            transition-all duration-400 ease
            ${isSearching
              ? 'border-vermilion ring-pulse'
              : 'border-charcoal'
            }
          `}
        >
          <div className="flex flex-col items-center gap-3">
            {/* Swords icon */}
            <div className={`transition-all duration-300 ${isSearching ? 'text-vermilion' : 'text-stone'}`}>
              <Swords size={40} strokeWidth={1.5} />
            </div>

            {/* Rank / Status text */}
            {isTimeout ? (
              <div className="text-center space-y-1">
                <div className="font-display text-xs font-bold text-stone uppercase tracking-wider">
                  KHÔNG TÌM THẤY
                </div>
                <div className="font-body text-[11px] text-stone">
                  Thử lại với ELO khác?
                </div>
              </div>
            ) : isSearching ? (
              <div className="text-center space-y-1">
                <div className="font-display text-sm font-bold text-vermilion uppercase tracking-wider">
                  ĐANG TÌM
                </div>
                <div className="font-display text-xl font-bold text-vermilion tabular-nums tracking-tight">
                  {formatTime(searchDuration)}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-0.5">
                <div className="font-display text-[8px] font-bold text-stone uppercase tracking-[0.15em]">
                  RANK CỦA BẠN
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-linen tracking-[-0.01em]">
                  VÀNG III
                </h2>
              </div>
            )}

            {/* Action button */}
            <button
              onClick={onToggleSearch}
              className={`
                font-display text-[11px] font-bold uppercase tracking-wider px-5 py-2 transition-all cursor-pointer
                ${isSearching
                  ? 'border border-vermilion text-linen hover:bg-vermilion/10'
                  : 'bg-vermilion text-linen hover:bg-vermilion-hover'
                }
              `}
            >
              {isTimeout ? 'TÌM LẠI' : isSearching ? 'HUỶ' : 'TÌM ĐỐI THỦ (1V1)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
