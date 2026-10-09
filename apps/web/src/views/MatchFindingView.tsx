import React, { useEffect, useState } from 'react';
import { Crown, Search, Shield, Swords, Timer, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/socket';

interface MatchFindingViewProps {
  onStartMatch: (matchData: { matchId: string }) => void;
  onClose: () => void;
}

export const MatchFindingView: React.FC<MatchFindingViewProps> = ({ onStartMatch, onClose }) => {
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [searchDuration, setSearchDuration] = useState(0);
  const elo = user?.eloRating ?? user?.elo_rating ?? 1000;

  useEffect(() => {
    const stopQueueListener = socketService.onQueueStatus((data) => {
      setIsSearching(data.status === 'QUEUED');
    });
    const stopMatchListener = socketService.onMatchFound((data) => {
      setIsSearching(false);
      onStartMatch({ matchId: data.matchId });
    });
    return () => {
      stopQueueListener();
      stopMatchListener();
    };
  }, [onStartMatch]);

  useEffect(() => {
    if (!isSearching) {
      setSearchDuration(0);
      return;
    }
    const interval = setInterval(() => setSearchDuration((seconds) => seconds + 1), 1000);
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleToggleSearch = () => {
    if (isSearching) {
      socketService.leaveQueue();
      setIsSearching(false);
      return;
    }
    setSearchDuration(0);
    setIsSearching(true);
    socketService.joinQueue();
  };

  const handleClose = () => {
    if (isSearching) socketService.leaveQueue();
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearching, onClose]);

  const minutes = Math.floor(searchDuration / 60).toString().padStart(2, '0');
  const seconds = (searchDuration % 60).toString().padStart(2, '0');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tìm trận 1v1"
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section className="relative flex max-h-[100dvh] w-full max-w-[900px] flex-col overflow-y-auto border border-charcoal bg-ink shadow-2xl">
        <header className="flex items-center justify-between border-b border-charcoal bg-washi px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center border border-vermilion/50 bg-vermilion/10 text-vermilion">
              <Swords size={19} />
            </div>
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.2em] text-vermilion">Solo queue · 1v1</p>
              <h2 className="font-display text-base font-bold text-linen">Tìm trận đấu</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng tìm trận"
            className="grid h-10 w-10 place-items-center border border-charcoal text-stone transition-colors hover:border-vermilion hover:text-linen"
          >
            <X size={18} />
          </button>
        </header>

        <div className="grid flex-1 md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex min-h-[390px] flex-col items-center justify-center px-6 py-10 text-center sm:px-10">
            <span className="inline-flex items-center gap-2 border border-charcoal bg-washi px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-stone">
              <span className={`h-1.5 w-1.5 rounded-full ${isSearching ? 'animate-pulse bg-vermilion' : 'bg-stone'}`} />
              {isSearching ? 'Đang trong hàng chờ' : 'Hàng chờ xếp hạng'}
            </span>

            <div className="relative my-8 grid h-36 w-36 place-items-center sm:h-44 sm:w-44">
              <div className={`absolute inset-0 rounded-full border border-vermilion/30 ${isSearching ? 'animate-ping opacity-20' : ''}`} />
              <div className={`absolute inset-2 rounded-full border border-charcoal ${isSearching ? 'animate-spin border-t-vermilion' : ''}`} />
              <div className="absolute inset-5 rounded-full border border-charcoal/70" />
              <div className="relative grid h-20 w-20 place-items-center rounded-full border border-vermilion/40 bg-washi text-vermilion shadow-[0_0_45px_rgba(255,85,0,0.12)] sm:h-24 sm:w-24">
                {isSearching ? <Swords size={33} /> : <Search size={30} />}
              </div>
            </div>

            <h3 className="m-0 font-display text-2xl font-bold text-linen sm:text-3xl">
              {isSearching ? 'Đang tìm đối thủ' : 'Sẵn sàng vào trận?'}
            </h3>
            <p className="mb-0 mt-2 max-w-md text-sm leading-6 text-stone">
              {isSearching
                ? 'Đang tìm một người chơi có mức ELO phù hợp. Bro có thể hủy hàng chờ bất cứ lúc nào.'
                : 'Bắt đầu hàng chờ để ghép cặp 1v1 với người chơi có mức ELO gần bạn.'}
            </p>

            {isSearching && (
              <div className="mt-7 inline-flex items-center gap-3 border-y border-charcoal px-6 py-3">
                <Timer size={17} className="text-vermilion" />
                <span className="font-display text-2xl font-bold tabular-nums tracking-widest text-linen">{minutes}:{seconds}</span>
                <span className="text-xs uppercase tracking-wider text-stone">Thời gian chờ</span>
              </div>
            )}
          </div>

          <aside className="flex flex-col justify-between border-t border-charcoal bg-washi/60 p-5 sm:p-8 md:border-l md:border-t-0">
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.18em] text-stone">Người chơi</p>
              <div className="mt-4 flex items-center gap-4 border border-charcoal bg-ink p-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center border border-vermilion/40 bg-vermilion/10 font-display text-xl font-bold text-vermilion">
                  {user?.username?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-base font-bold text-linen">{user?.username ?? 'Bạn'}</p>
                  <p className="mb-0 mt-1 text-xs text-stone">Bạn</p>
                </div>
                <Shield size={18} className="text-stone" />
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-charcoal" />
                <span className="font-display text-xs font-bold uppercase tracking-widest text-stone">Đối thủ</span>
                <div className="h-px flex-1 bg-charcoal" />
              </div>

              <div className="flex items-center gap-4 border border-dashed border-charcoal p-4">
                <div className={`grid h-14 w-14 shrink-0 place-items-center border border-charcoal text-stone ${isSearching ? 'animate-pulse' : ''}`}>
                  <span className="font-display text-xl">?</span>
                </div>
                <div>
                  <p className="m-0 text-sm font-semibold text-stone">{isSearching ? 'Đang tìm người chơi...' : 'Chưa ghép đối thủ'}</p>
                  <p className="mb-0 mt-1 text-xs text-stone/70">Ghép cặp dựa trên ELO</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border border-charcoal px-4 py-3">
                <span className="flex items-center gap-2 text-xs text-stone"><Crown size={15} className="text-vermilion" /> ELO hiện tại</span>
                <span className="font-display text-sm font-bold tabular-nums text-linen">{elo}</span>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={handleToggleSearch}
                className={`group flex w-full items-center justify-center gap-3 px-5 py-3.5 text-sm font-bold transition-all duration-200 active:scale-[0.99] ${isSearching ? 'border border-charcoal bg-ink text-linen hover:border-vermilion' : 'bg-vermilion text-black hover:bg-vermilion-hover'}`}
              >
                {isSearching ? <X size={16} /> : <Swords size={16} />}
                {isSearching ? 'Hủy tìm trận' : 'Bắt đầu tìm trận'}
              </button>
              <p className="mb-0 mt-3 text-center text-[11px] text-stone">{isSearching ? 'Bạn vẫn có thể hủy trước khi tìm được trận.' : 'Trận đấu bắt đầu ngay khi tìm được đối thủ.'}</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};
