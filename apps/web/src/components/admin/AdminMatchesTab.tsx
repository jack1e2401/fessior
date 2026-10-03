import React, { useEffect, useState } from 'react';
import { Trophy, Trash2, Eye, Award } from 'lucide-react';
import { api } from '../../services/api';
import type { IMatch } from '@ocj/contracts';
import { AdminCard, AdminHeader, AdminButton, AdminListRow, AdminBadge } from './ui/AdminUI';

export const AdminMatchesTab: React.FC = () => {
  const [history, setHistory] = useState<IMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<IMatch | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getMatchHistory();
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleInspect = async (mid: string) => {
    try {
      const res = await api.getMatchDetails(mid);
      if (res.success) {
        setSelectedMatch(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi tải chi tiết trận đấu');
    }
  };

  const handleDelete = async (mid: string) => {
    if (!window.confirm('Xóa bản ghi trận đấu này? Lệnh này sẽ loại bỏ hoàn toàn lịch sử đấu.')) return;
    try {
      const res = await api.deleteMatch(mid);
      if (res.success) {
        setHistory(prev => prev.filter(m => m.id !== mid));
        if (selectedMatch?.id === mid) {
          setSelectedMatch(null);
        }
        alert('Đã xóa trận đấu thành công.');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa trận đấu');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left side: List Match History */}
      <AdminCard>
        <AdminHeader>Lịch Sử Trận Đấu Toàn Hệ Thống</AdminHeader>
        <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
          {loading ? (
            <p className="text-stone text-sm">Đang tải...</p>
          ) : history.length === 0 ? (
            <p className="text-stone text-sm">Chưa có trận đấu nào được lưu trữ.</p>
          ) : (
            history.map((m, idx) => {
              const mid = m.id;
              return (
                <AdminListRow key={mid || idx}>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-sm text-linen font-body flex items-center gap-2">
                      <Trophy size={14} className="text-yellow-500" />
                      Trận Đấu #{mid?.slice(-6)}
                    </span>
                    <div className="flex items-center gap-2">
                      <AdminBadge color={m.status === 'FINISHED' ? 'green' : 'yellow'}>
                        Trạng thái: {m.status || 'FINISHED'}
                      </AdminBadge>
                      <AdminBadge>
                        {m.started_at ? new Date(m.started_at).toLocaleDateString() : '—'}
                      </AdminBadge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <AdminButton variant="icon-edit" onClick={() => handleInspect(mid)} title="Xem chi tiết trận đấu">
                      <Eye size={14} />
                    </AdminButton>
                    <AdminButton variant="icon-delete" onClick={() => handleDelete(mid)} title="Xóa bản ghi">
                      <Trash2 size={14} />
                    </AdminButton>
                  </div>
                </AdminListRow>
              );
            })
          )}
        </div>
      </AdminCard>

      {/* Right side: Detailed View */}
      <AdminCard>
        <AdminHeader>Chi Tiết Trận Đấu</AdminHeader>
        {selectedMatch ? (
          <div className="flex flex-col gap-4 text-sm text-surface-300">
            <div><strong className="text-linen">Mã trận đấu:</strong> {selectedMatch.id}</div>
            <div className="flex items-center gap-2">
              <strong className="text-linen">Trạng thái:</strong> 
              <AdminBadge color={selectedMatch.status === 'FINISHED' ? 'green' : 'yellow'}>{selectedMatch.status}</AdminBadge>
            </div>
            <div><strong className="text-linen">Bài tập:</strong> {selectedMatch.problem?.title || selectedMatch.problem_id}</div>
            
            <div className="border-t border-charcoal pt-4 mt-1">
              <h4 className="text-linen text-sm mb-3 flex items-center gap-2 font-semibold">
                <Award size={14} className="text-yellow-500" /> Danh sách người chơi
              </h4>
              <div className="flex flex-col gap-3">
                {[selectedMatch.player1, selectedMatch.player2].map((p, index) => p && (
                  <div key={index} className="bg-ink/50 p-3 rounded-xl border border-charcoal/50 flex flex-col gap-1">
                    <div><strong className="text-stone">Người chơi {index + 1}:</strong> <span className="text-linen font-semibold">{p.username || p.id}</span></div>
                    <div><strong className="text-stone">ELO:</strong> <span className="text-linen">{p.elo_rating ?? p.eloRating ?? '—'}</span></div>
                  </div>
                ))}
                {!selectedMatch.player1 && !selectedMatch.player2 && (
                  <div className="text-stone text-xs">Player IDs: {selectedMatch.player1_id} vs {selectedMatch.player2_id}</div>
                )}
              </div>
            </div>

            <div className="border-t border-charcoal pt-4 mt-1 text-xs text-stone flex flex-col gap-1">
              <div>Bắt đầu: {selectedMatch.started_at ? new Date(selectedMatch.started_at).toLocaleString() : '—'}</div>
              {selectedMatch.ended_at && <div>Kết thúc: {new Date(selectedMatch.ended_at).toLocaleString()}</div>}
            </div>
          </div>
        ) : (
          <p className="text-stone text-sm">Nhấp vào biểu tượng con mắt ở danh sách để xem chi tiết trận đấu và người chơi.</p>
        )}
      </AdminCard>
    </div>
  );
};


