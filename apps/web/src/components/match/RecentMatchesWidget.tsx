import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* =====================================================
   RecentMatchesWidget — Last 5 finished matches
   Ink & Vermillion: ▲ Win = vermilion fill, ▼ Loss = outline
   ===================================================== */

interface MatchRow {
  id: string;
  opponent: string;
  result: 'win' | 'loss';
  eloChange: number;
  when: string;
}

export const RecentMatchesWidget: React.FC = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await api.getMatchHistory();
        if (res.success && res.data) {
          const items = (res.data?.items ?? res.data ?? []).slice(0, 5);
          const rows: MatchRow[] = items.map((m: any) => {
            const isWinner = user ? m.winner_id === user.id : m.winner_id === m.player1_id;
            
            let opponentName = m.opponent_name;
            if (!opponentName && user) {
               if (m.player1?.id === user.id) opponentName = m.player2?.username;
               else if (m.player2?.id === user.id) opponentName = m.player1?.username;
            }
            opponentName = opponentName ?? 'Đối thủ';

            let realEloChange = m.elo_change;
            if (realEloChange === undefined && m.participants && m.participants.length > 0) {
               const myParticipant = m.participants.find((p: any) => p.user_id === user?.id || p.user?.id === user?.id);
               if (myParticipant) {
                  realEloChange = myParticipant.score_change;
               }
            }
            realEloChange = realEloChange ?? (isWinner ? 25 : -15);

            return {
              id: m.id,
              opponent: opponentName,
              result: isWinner ? 'win' : 'loss',
              eloChange: realEloChange,
              when: m.ended_at ? formatRelativeTime(new Date(m.ended_at)) : 'Vừa xong',
            };
          });
          setMatches(rows);
        }
      } catch (e) {
        setError('Không tải được lịch sử trận.');
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  return (
    <div className="bg-washi border border-charcoal p-4 flex flex-col gap-3 min-h-[200px]">
      <h3 className="font-display text-xs font-bold uppercase tracking-[0.12em] text-stone">
        Trận gần đây
      </h3>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="font-body text-xs text-stone animate-pulse-soft">Đang tải...</div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-body text-xs text-stone">{error}</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-body text-xs text-stone">Chưa có trận đấu nào.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {matches.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between py-2 border-b border-charcoal/50 last:border-b-0"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`shrink-0 font-display text-[10px] font-bold uppercase w-[52px] text-center py-0.5 ${m.result === 'win'
                      ? 'bg-vermilion text-linen'
                      : 'border border-vermilion text-vermilion'
                    }`}
                >
                  {m.result === 'win' ? '▲ Win' : '▼ Loss'}
                </div>
                <span className="font-body text-sm text-linen truncate">
                  {m.opponent}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className={`font-display text-xs font-bold tabular-nums ${m.result === 'win' ? 'text-vermilion' : 'text-stone'
                  }`}>
                  {m.result === 'win' ? '+' : ''}{m.eloChange}
                </span>
                <span className="font-body text-[11px] text-stone/60 tabular-nums">
                  {m.when}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── helpers ── */

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày`;
  return date.toLocaleDateString('vi-VN');
}
