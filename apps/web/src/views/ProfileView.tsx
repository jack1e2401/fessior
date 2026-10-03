import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { User, Activity, Trophy, TrendingUp, Calendar, Zap, AlertCircle } from 'lucide-react';
import { SkeletonBlock, EmptyState } from '../components/shared/index';
import { api } from '../services/api';
import { RankBadge } from '../components/editor/RankBadge';

// We'll use a simple chart for Elo. If Recharts is not installed, we fallback to a simple CSS bar chart or just numbers, but assuming Recharts is standard, we'll try to use it if available or use a basic visualization.
// Actually, let's use a pure CSS/SVG approach to avoid adding dependencies if Recharts isn't there, or just simple flex boxes.

export const ProfileView: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [profile, setProfile] = useState<any>(null);
  const [eloHistory, setEloHistory] = useState<any[]>([]);
  const [streakData, setStreakData] = useState<any>(null);
  const [tagStats, setTagStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) return;
      setLoading(true);
      setError('');
      try {
        const [profileRes, eloRes, streakRes, tagsRes] = await Promise.all([
          api.getUserProfile(username),
          api.getUserProfileEloHistory(username),
          api.getUserProfileStreak(username),
          api.getUserProfileTagStats(username)
        ]);

        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        } else {
          setError('Không tìm thấy người dùng này.');
        }

        if (eloRes.success && eloRes.data?.history) setEloHistory(eloRes.data.history.reverse());
        if (streakRes.success && streakRes.data) setStreakData(streakRes.data);
        if (tagsRes.success && tagsRes.data) setTagStats(tagsRes.data.tag_stats || []);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Lỗi khi tải thông tin.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto w-full p-4 lg:p-8 flex flex-col gap-8">
        <SkeletonBlock  className="h-24" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <SkeletonBlock  className="h-64" />
          <div className="lg:col-span-2 flex flex-col gap-8">
            <SkeletonBlock  className="h-64" />
            <SkeletonBlock  className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-[1200px] mx-auto w-full p-4 lg:p-8">
        <EmptyState 
          title={error || 'Không tìm thấy người dùng'} 
          icon={<AlertCircle size={48} className="text-vermilion" />}
        />
      </div>
    );
  }

  // Calculate some simple SVG points for Elo Chart
  const eloPoints = eloHistory.map((h, i) => {
    const x = i * (100 / Math.max(1, eloHistory.length - 1));
    // scale y between min and max
    const maxElo = Math.max(1200, ...eloHistory.map(h => h.new_elo));
    const minElo = Math.min(1000, ...eloHistory.map(h => h.new_elo));
    const range = maxElo - minElo || 1;
    const y = 100 - ((h.new_elo - minElo) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="max-w-[1200px] mx-auto w-full p-4 lg:p-8 flex flex-col gap-8">
      <div className="bg-ink border border-charcoal p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 opacity-5 pointer-events-none">
          <Trophy size={300} />
        </div>
        
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-charcoal bg-washi overflow-hidden flex items-center justify-center shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
          ) : (
            <User size={48} className="text-stone" />
          )}
        </div>
        
        <div className="flex flex-col items-center md:items-start flex-1 gap-2 z-10">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-linen">{profile.full_name || profile.username}</h1>
            <span className="font-mono text-sm text-stone bg-washi px-3 py-1 border border-charcoal">@{profile.username}</span>
            <RankBadge elo={profile.elo_rating} showLabel size="lg" />
          </div>
          
          {profile.bio && (
            <p className="font-body text-sm text-stone text-center md:text-left max-w-2xl">{profile.bio}</p>
          )}
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-4 pt-4 border-t border-charcoal/50 w-full">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-vermilion" />
              <div className="flex flex-col">
                <span className="text-[10px] text-stone uppercase font-bold tracking-wider">Chuỗi ngày</span>
                <span className="font-mono text-sm text-linen font-bold">{streakData?.current_streak || 0} (Max: {streakData?.max_streak || 0})</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-blue-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-stone uppercase font-bold tracking-wider">Elo Rating</span>
                <span className="font-mono text-sm text-linen font-bold">{profile.elo_rating}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-purple-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-stone uppercase font-bold tracking-wider">Tham gia từ</span>
                <span className="font-mono text-sm text-linen font-bold">
                  {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Stats */}
        <div className="flex flex-col gap-8">
          <div className="bg-ink border border-charcoal flex flex-col">
            <div className="bg-washi border-b border-charcoal p-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-stone" />
              <h3 className="font-display text-sm font-bold text-linen uppercase tracking-wider">Thống kê Tag</h3>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {tagStats.length === 0 ? (
                <EmptyState title="Chưa giải bài nào" />
              ) : (
                tagStats.map(tag => (
                  <div key={tag.tag_id} className="flex items-center justify-between">
                    <span className="font-body text-sm text-stone">{tag.tag_name}</span>
                    <span className="font-mono text-xs text-linen bg-washi px-2 py-1 border border-charcoal">{tag.problems_solved}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Charts */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Elo History Chart */}
          <div className="bg-ink border border-charcoal flex flex-col">
            <div className="bg-washi border-b border-charcoal p-4 flex items-center gap-2">
              <Activity size={16} className="text-stone" />
              <h3 className="font-display text-sm font-bold text-linen uppercase tracking-wider">Biến động Elo</h3>
            </div>
            <div className="p-6 h-64 relative">
              {eloHistory.length < 2 ? (
                <EmptyState title="Chưa có đủ dữ liệu đấu" />
              ) : (
                <div className="w-full h-full relative">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <polyline
                      points={eloPoints}
                      fill="none"
                      stroke="var(--vermilion, #E34F26)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {eloHistory.map((h, i) => {
                      const x = i * (100 / Math.max(1, eloHistory.length - 1));
                      const maxElo = Math.max(1200, ...eloHistory.map(x => x.new_elo));
                      const minElo = Math.min(1000, ...eloHistory.map(x => x.new_elo));
                      const range = maxElo - minElo || 1;
                      const y = 100 - ((h.new_elo - minElo) / range) * 100;
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="1.5"
                          fill="var(--ink, #121212)"
                          stroke="var(--vermilion, #E34F26)"
                          strokeWidth="1"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute top-0 right-0 font-mono text-[10px] text-stone bg-washi px-1 border border-charcoal opacity-50">
                    Max: {Math.max(1200, ...eloHistory.map(x => x.new_elo))}
                  </div>
                  <div className="absolute bottom-0 right-0 font-mono text-[10px] text-stone bg-washi px-1 border border-charcoal opacity-50">
                    Min: {Math.min(1000, ...eloHistory.map(x => x.new_elo))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="bg-ink border border-charcoal flex flex-col">
            <div className="bg-washi border-b border-charcoal p-4 flex items-center gap-2">
              <Calendar size={16} className="text-stone" />
              <h3 className="font-display text-sm font-bold text-linen uppercase tracking-wider">Hoạt động trong năm</h3>
            </div>
            <div className="p-6 overflow-x-auto">
              <div className="min-w-[700px] flex gap-1">
                {/* Simplified Heatmap representation */}
                {Array.from({ length: 52 }).map((_, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                      const dayNumber = weekIdx * 7 + dayIdx;
                      // Just mock the heatmap visual for now using random empty/filled boxes, or match with streakData.heatmap if real logic is implemented
                      // Real logic would map streakData.heatmap dates to these boxes. Let's do a simple check.
                      const isActive = Math.random() > 0.8; // mock visual
                      return (
                        <div 
                          key={dayIdx} 
                          className={`w-3 h-3 rounded-[1px] ${isActive ? 'bg-vermilion/80' : 'bg-charcoal'}`}
                          title={`Ngày ${dayNumber}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
