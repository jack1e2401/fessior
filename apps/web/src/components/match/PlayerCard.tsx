import React from 'react';

/* =====================================================
   PlayerCard — Ink & Vermillion
   Props unchanged: { name, avatar, elo, winRate, isOpponent?, isSearching? }
   ===================================================== */

interface PlayerCardProps {
  name: string;
  avatar: string;
  elo: number;
  winRate: string;
  isOpponent?: boolean;
  isSearching?: boolean;
}

const PlayerCardInner: React.FC<PlayerCardProps> = ({
  name,
  avatar,
  elo,
  winRate,
  isOpponent = false,
  isSearching = false,
}) => {
  /* ── Base card wrapper ── */
  const borderSide = isOpponent
    ? 'border-r-[3px] border-r-charcoal'
    : 'border-l-[3px] border-l-vermilion';

  return (
    <div className={`w-full max-w-[320px] min-h-[400px] flex flex-col bg-washi border border-charcoal ${borderSide}`}>
      {/* ── Empty placeholder (no opponent yet) ── */}
      {isOpponent && !name ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-5">
          <div className="w-[120px] h-[120px] rounded-full border-[3px] border-charcoal bg-ink/30 flex items-center justify-center">
            <span className="font-display text-4xl font-bold text-stone/40">?</span>
          </div>
          <h2 className="font-display text-xl font-bold text-stone/40">Đối thủ</h2>
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="bg-charcoal/20 border border-charcoal p-3 flex flex-col items-center">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-stone mb-1.5">ELO HIỆN TẠI</span>
              <span className="font-display text-lg font-bold text-stone/40 tabular-nums">—</span>
            </div>
            <div className="bg-charcoal/20 border border-charcoal p-3 flex flex-col items-center">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-stone mb-1.5">TRẠNG THÁI</span>
              <span className="font-display text-lg font-bold text-stone/40">—</span>
            </div>
          </div>
          <div className="font-body text-xs text-stone">Chờ đối thủ</div>
        </div>
      ) : /* ── Searching state ── */
      isSearching ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-5">
          <div className="w-[120px] h-[120px] rounded-full border-[3px] border-dashed border-charcoal bg-ink/30 flex items-center justify-center">
            <span className="font-display text-3xl font-bold text-stone animate-pulse-soft">?</span>
          </div>
          <h2 className="font-display text-base font-bold text-linen">Đang tìm đối thủ...</h2>
          <p className="font-body text-xs text-stone">Đang ghép cặp ELO tương đương</p>
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="bg-charcoal/20 border border-charcoal p-3 flex flex-col items-center">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-stone mb-1.5">ELO HIỆN TẠI</span>
              <span className="font-display text-lg font-bold text-stone/40 tabular-nums">—</span>
            </div>
            <div className="bg-charcoal/20 border border-charcoal p-3 flex flex-col items-center">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-stone mb-1.5">TRẠNG THÁI</span>
              <span className="font-display text-lg font-bold text-stone/40">—</span>
            </div>
          </div>
        </div>
      ) : (
        /* ── Normal card ── */
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Avatar */}
          <div className="relative w-[120px] h-[120px] mb-5">
            <img
              src={avatar}
              alt={name}
              className="w-[120px] h-[120px] rounded-full object-cover border-[3px] border-charcoal bg-ink/30"
            />
          </div>

          {/* Name */}
          <h2 className="font-display text-xl font-bold text-linen mb-8 truncate max-w-full">
            {name}
          </h2>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="bg-charcoal/20 border border-charcoal p-3 flex flex-col items-center min-w-0">
              <span className="font-display text-[9px] font-bold uppercase tracking-[0.1em] text-stone mb-1.5 whitespace-nowrap">
                ELO HIỆN TẠI
              </span>
              <span className="font-display text-lg font-bold text-linen tabular-nums whitespace-nowrap">
                {elo}
              </span>
            </div>
            <div className="bg-charcoal/20 border border-charcoal p-3 flex flex-col items-center min-w-0">
              <span className="font-display text-[9px] font-bold uppercase tracking-[0.1em] text-stone mb-1.5 whitespace-nowrap">
                {isOpponent ? 'TRẠNG THÁI' : 'CHUỖI THẮNG'}
              </span>
              <span className="font-display text-lg font-bold text-linen whitespace-nowrap">
                {winRate}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PlayerCard = React.memo(PlayerCardInner);
