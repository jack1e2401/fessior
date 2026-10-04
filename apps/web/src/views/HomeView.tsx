import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Flame, ArrowRight, AlertTriangle, Activity, Star, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getSubmissions } from '../features/submission/api/submissionApi';
import { fetchProblems } from '../features/problem/api/problemApi';

export const HomeView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [stats, setStats] = useState({ totalHours: 0, total: 0, accepted: 0, notAccepted: 0 });
  const [featuredProblems, setFeaturedProblems] = useState<any[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(true);

  // Generate calendar days
  const today = new Date();
  const currentMonth = today.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const currentDay = today.getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  // Adjust so Monday is 0 or Sunday is 0 depending on locale. Let's use Sunday = 0
  const calendarCells = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  useEffect(() => {
    const checkActiveMatch = async () => {
      try {
        const res = await api.getActiveMatch();
        if (res.success && res.data) {
          setActiveMatchId(res.data.id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkActiveMatch();

    const loadData = async () => {
      try {
        // 1. Submissions for Stats
        const subRes = await getSubmissions({ page: 1, limit: 100 });
        if (subRes && subRes.data) {
          const items = subRes.data.items || [];
          const accepted = items.filter((i: any) => i.status === 'ACCEPTED').length;
          const total = items.length; // We use current page count as total for now
          // Assume each problem took 0.5 hours roughly for mock
          const totalHours = Math.round(total * 0.5 * 10) / 10;
          setStats({
            totalHours,
            total,
            accepted,
            notAccepted: total - accepted
          });
        }
      } catch (e) {
        console.error(e);
      }
      setSubmissionsLoading(false);

      try {
        // Featured Problems (random 3)
        const probRes = await fetchProblems({ page: 1, limit: 50 });
        if (probRes && probRes.items) {
          const shuffled = [...probRes.items].sort(() => 0.5 - Math.random());
          setFeaturedProblems(shuffled.slice(0, 3));
        }
      } catch (e) {
        console.error(e);
      }
      setProblemsLoading(false);
    };

    loadData();
  }, []);



  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full p-4 lg:p-8 font-body">
      {/* ── Active Match Banner ── */}
      {activeMatchId && (
        <div className="bg-vermilion/20 border border-vermilion p-4 flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-vermilion" size={20} />
            <span className="font-body text-linen text-sm">
              Bạn đang có một trận đấu chưa kết thúc!
            </span>
          </div>
          <button
            onClick={() => navigate(`/match/${activeMatchId}`)}
            className="bg-vermilion text-linen px-4 py-2 font-display text-xs font-bold uppercase tracking-wider hover:bg-vermilion-hover transition-colors whitespace-nowrap rounded-xl"
          >
            Vào lại trận đấu
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left & Middle Columns ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Welcome Section */}
          <div className="flex items-center gap-6 py-2">
            <div className="w-16 h-16 rounded-full bg-[#06B6D4] text-white flex items-center justify-center font-display font-bold text-2xl shrink-0 overflow-hidden shadow-sm border border-charcoal">
            {user?.avatarUrl || user?.avatar_url ? (
              <img src={user?.avatarUrl || user?.avatar_url || undefined} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{(user?.username || 'U').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="font-display text-2xl font-bold text-linen mb-1">
                Xin chào, {user?.username}!
              </h1>
              <p className="font-body text-stone">
                Cùng luyện tập để tiến bộ mỗi ngày nào!
              </p>
            </div>
          </div>

          {/* Nested Grid for Profile, Stats, Daily Challenges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column (Profile & Stats) */}
            <div className="flex flex-col gap-6">

          {/* Hồ sơ của bạn */}
          <div className="bg-ink border border-charcoal flex flex-col rounded-xl overflow-hidden">
            <div className="bg-washi border-b border-charcoal p-4 flex items-center gap-2">
              <UserIcon />
              <h3 className="font-display font-bold text-linen uppercase tracking-wider">Hồ sơ của bạn</h3>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-stone">Tên hiển thị</span>
                <span className="font-display font-bold text-linen text-sm">{(user as any)?.displayName || user?.username}</span>
              </div>
              <div className="w-full h-[1px] bg-charcoal"></div>
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-stone">Elo Rating</span>
                <span className="font-mono font-bold text-linen text-lg">{user?.eloRating || (user as any)?.elo_rating || 1000}</span>
              </div>
              <div className="w-full h-[1px] bg-charcoal"></div>
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-stone">Code Coins</span>
                <span className="font-mono font-bold text-yellow-500 text-lg">{(user as any)?.code_coins || 0}</span>
              </div>
            </div>
          </div>

          {/* Thống kê bài tập */}
          <div className="bg-gradient-to-br from-blue-500 via-indigo-400 to-orange-500 border border-transparent shadow-lg flex flex-col rounded-xl overflow-hidden p-6 text-white">
            <div className="flex items-center gap-2 mb-6">
              <Activity size={24} className="text-white" />
              <h3 className="font-display font-bold text-xl tracking-wide">Thống kê bài tập</h3>
            </div>
            <div className="flex flex-col gap-4 flex-1">
              {submissionsLoading ? (
                <div className="flex flex-col gap-4">
                  <div className="h-6 bg-white/20 rounded-xl animate-pulse w-full"></div>
                  <div className="h-6 bg-white/20 rounded-xl animate-pulse w-full"></div>
                  <div className="h-6 bg-white/20 rounded-xl animate-pulse w-full"></div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="font-body text-base text-white/90">Số lượng bài tập đã giải</span>
                    <span className="font-display font-bold text-xl">{stats.total}</span>
                  </div>
                  <div className="w-full h-[1px] bg-white/20"></div>
                  <div className="flex justify-between items-center">
                    <span className="font-body text-base text-white/90">Số bài ACCEPTED</span>
                    <span className="font-display font-bold text-xl">{stats.accepted}</span>
                  </div>
                  <div className="w-full h-[1px] bg-white/20"></div>
                  <div className="flex justify-between items-center">
                    <span className="font-body text-base text-white/90">Số bài chưa ACCEPTED</span>
                    <span className="font-display font-bold text-xl">{stats.notAccepted}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Middle Column: Daily Challenge, Problems ── */}
        <div className="flex flex-col gap-6">

          {/* Thử thách hàng ngày */}
          <div className="bg-ink border border-charcoal flex flex-col rounded-xl overflow-hidden">
            <div className="bg-washi border-b border-charcoal p-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-vermilion" />
                <h3 className="font-display font-bold text-linen uppercase tracking-wider">Thử thách hàng ngày</h3>
              </div>
              <span className="font-mono text-xs text-stone bg-charcoal/50 px-2 py-1 flex items-center gap-2 whitespace-nowrap">
                <ClockIcon /> Còn lại 14:23:05
              </span>
            </div>
            <div className="p-4 flex justify-center">
              <button
                onClick={() => navigate('/problems')}
                className="bg-washi border border-charcoal text-linen px-4 py-2 font-display text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:border-vermilion hover:text-vermilion transition-colors w-full justify-center rounded-xl"
              >
                Tham gia ngay <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Danh sách bài tập */}
          <div
            onClick={() => navigate('/problems')}
            className="bg-washi border border-charcoal p-6 cursor-pointer hover:border-stone group transition-colors flex flex-col gap-3 rounded-xl overflow-hidden"
          >
            <div className="bg-ink p-3 w-fit border border-charcoal group-hover:border-vermilion transition-colors rounded-xl">
              <BookOpen size={24} className="text-vermilion" />
            </div>
            <h4 className="font-display font-bold text-linen uppercase tracking-wider">Danh sách bài tập</h4>
            <p className="font-body text-xs text-stone">Khám phá hơn 100+ bài tập thuật toán từ dễ đến khó.</p>
          </div>

          </div>
          </div>
        </div>

        {/* ── Right Column: Widgets ── */}
        <div className="flex flex-col gap-6">
          
          {/* Calendar Widget */}
          <div className="bg-ink border border-charcoal flex flex-col rounded-xl overflow-hidden">
            <div className="bg-washi border-b border-charcoal p-4 flex justify-between items-center">
              <h3 className="font-display font-bold text-linen uppercase tracking-wider flex items-center gap-2">
                <Calendar size={18} className="text-stone" /> Lịch
              </h3>
              <span className="font-body text-xs text-stone">{currentMonth}</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {DAYS.map(d => (
                  <div key={d} className="font-display text-[10px] text-stone font-bold">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarCells.map((day, i) => (
                  <div
                    key={i}
                    className={`aspect-square flex items-center justify-center font-mono text-xs rounded-full ${day === currentDay ? 'bg-vermilion text-linen font-bold' : day ? 'text-stone hover:bg-charcoal/50 hover:text-linen cursor-pointer' : ''
                      }`}
                  >
                    {day || ''}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Problems Widget */}
          <div className="bg-ink border border-charcoal flex flex-col rounded-xl overflow-hidden">
            <div className="bg-washi border-b border-charcoal p-4 flex items-center gap-2">
              <Star size={18} className="text-vermilion" />
              <h3 className="font-display font-bold text-linen uppercase tracking-wider">Bài tập nổi bật</h3>
            </div>
            <div className="p-0 flex flex-col">
              {problemsLoading ? (
                <div className="p-4 flex justify-center"><div className="w-6 h-6 border-2 border-charcoal border-t-stone rounded-full animate-spin"></div></div>
              ) : (
                featuredProblems.map((prob: any) => (
                  <div key={prob.id} onClick={() => navigate(`/problems/${prob.id}`)} className="flex flex-col gap-2 p-4 border-b border-charcoal last:border-b-0 hover:bg-washi transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-body text-sm text-linen group-hover:text-vermilion transition-colors line-clamp-2 leading-snug">{prob.title}</h4>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 whitespace-nowrap bg-washi border border-charcoal ${prob.difficulty === 'HARD' ? 'text-red-500' : prob.difficulty === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500'}`}>
                        {prob.difficulty}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Simple helper icons
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
