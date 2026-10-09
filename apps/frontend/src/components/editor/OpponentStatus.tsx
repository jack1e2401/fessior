import React, { useState, useEffect } from 'react';
import { Timer, UserCheck } from 'lucide-react';

/* =====================================================
   OpponentStatus — Ink & Vermillion
   Props unchanged: 6 props
   Mono dual progress bars: user=vermilion, opponent=charcoal
   ===================================================== */

interface OpponentStatusProps {
  opponentName: string;
  opponentAvatar: string;
  isSubmitted: boolean;
  timeLeftSeconds: number;
  userProgress: number;
  opponentProgress: number;
}

export const OpponentStatus: React.FC<OpponentStatusProps> = ({
  opponentName,
  opponentAvatar,
  isSubmitted,
  timeLeftSeconds,
  userProgress,
  opponentProgress,
}) => {
  const [secs, setSecs] = useState(timeLeftSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecs((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="bg-washi border border-charcoal p-5 mb-4">
      {/* ── Header row ── */}
      <div className="flex justify-between items-center border-b border-charcoal pb-3 mb-3.5">
        <div className="flex items-center gap-2 font-body text-sm font-semibold text-stone">
          <UserCheck size={16} className="text-stone" />
          <span>Thông tin đối thủ</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-sm font-medium text-linen bg-ink border border-charcoal px-2.5 py-1">
          <Timer size={14} className="text-vermilion animate-pulse-soft" />
          <span>Thời gian: {formatTime(secs)}</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex items-center justify-between gap-8 md:flex-row flex-col">
        {/* Opponent profile */}
        <div className="flex items-center gap-3">
          <img
            src={opponentAvatar}
            alt={opponentName}
            className="w-10 h-10 rounded-full border-[2px] border-charcoal bg-ink/30 shrink-0"
          />
          <div className="flex flex-col">
            <span className="font-body text-[11px] text-stone">Trạng thái:</span>
            <span className={`font-body text-sm font-bold ${isSubmitted ? 'text-stone' : 'text-vermilion'}`}>
              {isSubmitted ? 'Đã nộp bài' : 'Đang làm bài'}
            </span>
          </div>
        </div>

        {/* Progress bars */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between font-display text-[11px] font-bold">
            <span className="text-vermilion">Bạn: {userProgress}%</span>
            <span className="text-linen">{opponentName}: {opponentProgress}%</span>
          </div>
          <div className="h-2.5 bg-charcoal/20 overflow-hidden flex w-full">
            <div className="bg-vermilion h-full transition-all duration-500" style={{ width: `${userProgress}%` }} />
            <div className="bg-charcoal h-full transition-all duration-500" style={{ width: `${opponentProgress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
