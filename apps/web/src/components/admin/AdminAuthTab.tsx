import React, { useEffect, useState } from 'react';
import { Shield, Key, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { AdminCard, AdminHeader, AdminInput, AdminFormGroup, AdminButton, AdminListRow, AdminBadge } from './ui/AdminUI';

export const AdminAuthTab: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAuthInfo = async () => {
    setLoading(true);
    try {
      const profileRes = await api.getMe();
      if (profileRes.success) setProfile(profileRes.data);

      const sessionRes = await api.getSessions();
      if (sessionRes.success) setSessions(sessionRes.data?.sessions || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthInfo();
  }, []);

  const handleRevokeSession = async (sid: string) => {
    if (!window.confirm('Hủy bỏ phiên làm việc này?')) return;
    try {
      const res = await api.revokeSession(sid);
      if (res.success) {
        setSessions(prev => prev.filter(s => s.id !== sid));
        alert('Đã hủy phiên làm việc.');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hủy phiên');
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm('Hủy bỏ tất cả phiên làm việc khác?')) return;
    try {
      const res = await api.revokeAllSessions();
      if (res.success) {
        alert('Đã hủy tất cả các phiên khác.');
        fetchAuthInfo();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hủy toàn bộ phiên');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setStatusMsg('Đổi mật khẩu thành công!');
        setNewPassword('');
        setCurrentPassword('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi đổi mật khẩu');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left side: Profile and Password Change */}
      <div className="flex flex-col gap-6">
        <AdminCard>
          <AdminHeader>Thông Tin Quản Trị Viên</AdminHeader>
          {profile ? (
            <div className="flex flex-col gap-2.5 text-sm text-surface-300">
              <div><strong className="text-linen">Tài khoản:</strong> {profile.username}</div>
              <div><strong className="text-linen">Email:</strong> {profile.email}</div>
              <div className="flex items-center gap-2">
                <strong className="text-linen">Vai trò:</strong> 
                <AdminBadge color="green">{profile.role}</AdminBadge>
              </div>
              <div><strong className="text-linen">ELO hiện tại:</strong> {profile.elo_rating}</div>
            </div>
          ) : (
            <p className="text-stone text-sm">Đang tải thông tin cá nhân...</p>
          )}
        </AdminCard>

        <AdminCard>
          <AdminHeader>Đổi Mật Khẩu Quản Trị</AdminHeader>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4 mt-2">
            <AdminFormGroup label={<><Key size={14} /> Mật khẩu hiện tại</>}>
              <AdminInput
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </AdminFormGroup>
            <AdminFormGroup label={<><Key size={14} /> Mật khẩu mới</>}>
              <AdminInput
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </AdminFormGroup>
            <AdminButton type="submit" className="mt-2">Cập nhật mật khẩu</AdminButton>
          </form>
          {statusMsg && <p className="text-emerald-400 text-sm mt-1">{statusMsg}</p>}
          {errorMsg && <p className="text-red-400 text-sm mt-1">{errorMsg}</p>}
        </AdminCard>
      </div>

      {/* Right side: Session List */}
      <AdminCard>
        <AdminHeader 
          rightNode={
            sessions.length > 1 && (
              <AdminButton variant="icon-delete" onClick={handleRevokeAll} title="Đăng xuất khỏi toàn bộ thiết bị khác">
                <Trash2 size={14} />
              </AdminButton>
            )
          }
        >
          Danh Sách Phiên Đăng Nhập
        </AdminHeader>

        <div className="flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-1">
          {loading ? (
            <p className="text-stone text-sm">Đang tải...</p>
          ) : sessions.length === 0 ? (
            <p className="text-stone text-sm">Không tìm thấy phiên làm việc nào.</p>
          ) : (
            sessions.map((s, idx) => (
              <AdminListRow key={s.id || idx}>
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-sm text-linen font-body flex items-center gap-2">
                    <Shield size={14} className={s.isCurrent ? 'text-emerald-400' : 'text-stone'} />
                    Session ID: {s.id?.slice(-8) || idx} {s.isCurrent && '(Hiện tại)'}
                  </span>
                  <div className="flex items-center gap-2">
                    <AdminBadge>IP: {s.ipAddress || '127.0.0.1'}</AdminBadge>
                    <AdminBadge>HĐH: {s.device || 'Windows Chrome'}</AdminBadge>
                  </div>
                </div>

                {!s.isCurrent && (
                  <AdminButton variant="icon-delete" onClick={() => handleRevokeSession(s.id)} title="Thu hồi phiên">
                    <Trash2 size={14} />
                  </AdminButton>
                )}
              </AdminListRow>
            ))
          )}
        </div>
      </AdminCard>
    </div>
  );
};
