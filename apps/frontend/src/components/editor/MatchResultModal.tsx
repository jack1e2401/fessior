import React from 'react';
import { ArrowUp, ArrowDown, Users } from 'lucide-react';

interface MatchResultModalProps {
  result: any;
  currentUserId: string;
  onClose: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  result,
  currentUserId,
  onClose,
}) => {
  const isWinner = result.winnerId === currentUserId;
  const userUpdate = result.eloUpdates?.[currentUserId];
  
  const allUserIds = Object.keys(result.eloUpdates ?? {});
  const opponentIds = allUserIds.filter((k) => k !== currentUserId);
  const isMultiplayer = allUserIds.length > 2;

  const renderEloChange = (change: number) => {
    if (change >= 0) {
      return (
        <div className="flex items-center gap-1 font-display text-xs font-bold text-vermilion">
          <ArrowUp size={12} className="text-vermilion" />
          <span>+{change}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 font-display text-xs font-bold text-stone">
        <ArrowDown size={12} className="text-stone" />
        <span>{change}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-ink/85 z-50 flex items-center justify-center p-4">
      <div className="bg-washi border border-charcoal p-10 text-center min-w-[360px] max-w-[420px]">
        {/* Title */}
        <h2 className={`font-display text-2xl font-bold uppercase tracking-wider mb-2 ${isWinner ? 'text-vermilion' : 'text-stone'}`}>
          {isWinner ? 'CHIẾN THẮNG' : 'THẤT BẠI'}
        </h2>
        <p className="font-body text-xs text-stone mb-8">Kết quả trận đấu PvP Arena</p>

        {/* ELO Changes */}
        <div className="flex flex-col items-center mb-8 gap-6">
          {/* User */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-body text-xs text-stone uppercase tracking-wider">Bạn</span>
            <span className="font-display text-4xl font-bold text-linen tabular-nums">
              {userUpdate?.elo ?? 1000}
            </span>
            {renderEloChange(userUpdate?.change ?? 0)}
          </div>

          <div className="w-full h-px bg-charcoal" />

          {/* Opponents */}
          {isMultiplayer ? (
            <div className="w-full text-left">
              <span className="font-display text-xs font-bold text-stone uppercase tracking-wider flex items-center gap-2 mb-3">
                <Users size={14} /> Đối thủ ({opponentIds.length})
              </span>
              <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-2">
                {opponentIds.map(opId => {
                  const op = result.eloUpdates[opId];
                  return (
                    <div key={opId} className="flex justify-between items-center bg-ink border border-charcoal px-3 py-2">
                      <span className="font-body text-xs text-linen">{op.username || `User ${opId.substring(0, 4)}`}</span>
                      {renderEloChange(op.change)}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            opponentIds.length === 1 && (
              <div className="flex flex-col items-center gap-2">
                <span className="font-body text-xs text-stone uppercase tracking-wider">Đối thủ</span>
                <span className="font-display text-2xl font-bold text-linen tabular-nums">
                  {result.eloUpdates[opponentIds[0]].elo ?? 1000}
                </span>
                {renderEloChange(result.eloUpdates[opponentIds[0]].change ?? 0)}
              </div>
            )
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="bg-vermilion text-linen font-display text-sm font-bold uppercase tracking-wider px-8 py-3 w-full hover:bg-vermilion-hover transition-colors cursor-pointer"
        >
          Quay lại sảnh
        </button>
      </div>
    </div>
  );
};
