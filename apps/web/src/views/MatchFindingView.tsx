import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import { PlayerCard } from '../components/match/PlayerCard';
import { FindingCircle } from '../components/match/FindingCircle';
import { RecentMatchesWidget } from '../components/match/RecentMatchesWidget';
import { AlertTriangle } from 'lucide-react';

/* =====================================================
   MatchFindingView — Ink & Vermillion Lobby
   ===================================================== */

interface MatchFindingViewProps {
  onStartMatch: (matchData: any) => void;
}

export const MatchFindingView: React.FC<MatchFindingViewProps> = ({ onStartMatch }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDuration, setSearchDuration] = useState(0);
  const [opponent, setOpponent] = useState<any>(null);
  const [matchData, setMatchData] = useState<any>(null);

  useEffect(() => {
    const checkActiveMatch = async () => {
      try {
        const res = await api.getActiveMatch();
        if (res.success && res.data) {
          setActiveMatchId(res.data.id);
        }
      } catch (e) {
        // Ignore
      }
    };
    checkActiveMatch();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setSearchDuration(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  useEffect(() => {
    socketService.onQueueStatus((data) => {
      if (data.status === 'QUEUED') {
        setIsSearching(true);
        setOpponent(null);
        setMatchData(null);
      } else if (data.status === 'IDLE') {
        setIsSearching(false);
      }
    });

    socketService.onMatchFound((data) => {
      setIsSearching(false);
      setMatchData(data);
      const rival = data.player1.userId === user?.id ? data.player2 : data.player1;
      setOpponent({
        name: rival.username,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${rival.username}`,
        elo: rival.elo,
        winRate: 'Đang đấu',
        isOpponent: true,
      });
    });
  }, [user]);

  const handleToggleSearch = () => {
    if (isSearching) {
      socketService.leaveQueue();
    } else {
      setOpponent(null);
      setMatchData(null);
      socketService.joinQueue();
    }
  };

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* ── Active Match Banner ── */}
      {activeMatchId && (
        <div className="bg-vermilion/20 border border-vermilion p-4 flex items-center justify-between mx-auto w-full max-w-[1200px]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-vermilion" size={20} />
            <span className="font-body text-linen text-sm">
              Bạn đang có một trận đấu chưa kết thúc! Bạn không thể tìm trận mới.
            </span>
          </div>
          <button
            onClick={() => navigate(`/match/${activeMatchId}`)}
            className="bg-vermilion text-linen px-4 py-2 font-display text-xs font-bold uppercase tracking-wider hover:bg-vermilion-hover transition-colors"
          >
            Vào lại trận đấu
          </button>
        </div>
      )}

      {/* ── Lobby Arena: Host + Circle + Opponent (all same card style, equal height) ── */}
      <div className={`flex items-stretch justify-center gap-6 lg:gap-8 flex-col lg:flex-row ${activeMatchId ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Host */}
        <PlayerCard
          name={user?.username || 'Bạn'}
          avatar={user?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || 'You'}`}
          elo={user?.elo_rating || 1000}
          winRate={`Streak: ${user?.streak_count || 0}`}
        />

        {/* Center Circle — now in matching card wrapper */}
        <FindingCircle
          isSearching={isSearching}
          onToggleSearch={handleToggleSearch}
          searchDuration={searchDuration}
        />

        {/* Opponent */}
        {opponent ? (
          <PlayerCard
            name={opponent.name}
            avatar={opponent.avatar}
            elo={opponent.elo}
            winRate={opponent.winRate}
            isOpponent={true}
          />
        ) : (
          <PlayerCard
            name=""
            avatar=""
            elo={0}
            winRate="-"
            isOpponent={true}
            isSearching={isSearching}
          />
        )}
      </div>

      {/* VS reveal when opponent found (outside 3-col, centered) */}
      {matchData && opponent && (
        <div className="flex justify-center -mt-4">
          <button
            onClick={() => onStartMatch(matchData)}
            className="font-display text-xl font-bold uppercase tracking-wide bg-vermilion text-linen px-10 py-3 hover:bg-vermilion-hover transition-colors cursor-pointer animate-vs-grow"
          >
            BẮT ĐẦU
          </button>
        </div>
      )}

      <div className="w-full max-w-[1200px] mx-auto">
        <RecentMatchesWidget />
      </div>

    </div>
  );
};
