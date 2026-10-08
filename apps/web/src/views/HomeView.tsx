import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BookOpen, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const HomeView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  useEffect(() => {
    const checkActiveMatch = async () => {
      try {
        const res = await api.getActiveMatch();
        if (res.success && res.data) setActiveMatchId(res.data.id);
      } catch (error) {
        console.error(error);
      }
    };

    checkActiveMatch();
  }, []);

  return (
    <div className="flex w-full max-w-[1200px] flex-col gap-6 p-4 mx-auto lg:p-8 font-body">
      {activeMatchId && (
        <div className="flex flex-col items-center justify-between gap-4 p-4 border md:flex-row bg-vermilion/20 border-vermilion rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-vermilion" size={20} />
            <span className="text-sm text-linen">Bạn đang có một trận đấu chưa kết thúc!</span>
          </div>
          <button
            onClick={() => navigate(`/match/${activeMatchId}`)}
            className="px-4 py-2 text-xs font-bold tracking-wider uppercase transition-colors bg-vermilion text-linen font-display hover:bg-vermilion-hover rounded-xl"
          >
            Vào lại trận đấu
          </button>
        </div>
      )}

      <div className="flex items-center gap-6 py-2">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-charcoal bg-[#06B6D4] text-2xl font-bold text-white shadow-sm font-display">
          {user?.avatarUrl || user?.avatar_url ? (
            <img
              src={user.avatarUrl || user.avatar_url || undefined}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{(user?.username || 'U').charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex flex-col">
          <h1 className="mb-1 text-2xl font-bold text-linen font-display">Xin chào, {user?.username}!</h1>
          <p className="text-stone">Cùng luyện tập để tiến bộ mỗi ngày nào!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="flex flex-col overflow-hidden border bg-ink border-charcoal rounded-xl">
          <div className="flex items-center gap-2 p-4 border-b bg-washi border-charcoal">
            <User className="text-stone" size={18} />
            <h2 className="font-bold tracking-wider text-linen font-display">Hồ sơ của bạn</h2>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone">Tên hiển thị</span>
              <span className="text-sm font-bold text-linen font-display">
                {(user as any)?.displayName || user?.username}
              </span>
            </div>
            <div className="h-px w-full bg-charcoal" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone">Elo Rating</span>
              <span className="text-lg font-bold text-linen font-mono">
                {user?.eloRating || (user as any)?.elo_rating || 1000}
              </span>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={() => navigate('/problems')}
          className="group flex cursor-pointer flex-col items-start gap-3 rounded-xl border border-charcoal bg-washi p-6 text-left transition-colors hover:border-stone"
        >
          <span className="w-fit rounded-xl border border-charcoal bg-ink p-3 transition-colors group-hover:border-vermilion">
            <BookOpen className="text-vermilion" size={24} />
          </span>
          <span className="font-bold tracking-wider text-linen font-display">Danh sách bài tập</span>
          <span className="text-xs text-stone">Khám phá các bài tập và gửi bài giải của bạn.</span>
        </button>
      </div>
    </div>
  );
};
