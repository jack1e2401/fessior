import React from 'react';

/* =====================================================
   PlayerCard — Ink & Vermillion
   Matchmaking participant identity and current ELO.
   ===================================================== */

interface PlayerCardProps {
  name: string;
  avatar: string;
  elo: number;
  isOpponent?: boolean;
  isSearching?: boolean;
}

const PlayerCardInner: React.FC<PlayerCardProps> = ({
  name,
  avatar,
  elo,
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
        </div>
      ) : (
        /* ── Normal card ── */
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Avatar */}
          <div className="relative w-[120px] h-[120px] mb-5">
            {avatar ? (
              <img src={avatar} alt={name} className="h-[120px] w-[120px] rounded-full border-[3px] border-charcoal bg-ink/30 object-cover" />
            ) : (
              <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-[3px] border-charcoal bg-ink/30 text-3xl font-bold text-stone">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name */}
          <h2 className="font-display text-xl font-bold text-linen mb-8 truncate max-w-full">
            {name}
          </h2>

          {/* Stats */}
          <div className="w-full border border-charcoal bg-charcoal/20 p-3 text-center">
            <span className="mb-1.5 block whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.1em] text-stone font-display">
              ELO HIỆN TẠI
            </span>
            <span className="whitespace-nowrap text-lg font-bold text-linen font-display tabular-nums">{elo}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const PlayerCard = React.memo(PlayerCardInner);
