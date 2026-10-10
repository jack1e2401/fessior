import { useCallback, useRef } from 'react';
import { Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AppLogo } from '../../components/shared/brand/AppLogo';
import { useAuth } from '../../context/AuthContext';
import { Role } from '@ocj/contracts';
import { Crown, LayoutDashboard, Settings } from 'lucide-react';
import { AnimeStaggerVisual } from '../../features/auth/AnimeStaggerVisual';

/* =====================================================
   TopBar — Washi bg, Charcoal border, mono styling
   ===================================================== */

function TopBar(props: {
  user: ReturnType<typeof useAuth>['user'];
  onLogout: () => void;
}) {
  const { user, onLogout } = props;
  const userDropdownItems = [
    { key: 'settings', label: 'Cài đặt tài khoản', icon: <Settings size={14} />, onClick: () => window.location.href = '/settings' },
    ...(user?.role === Role.ADMIN ? [{ key: 'admin', label: 'Trang Quản trị', icon: <LayoutDashboard size={14} />, onClick: () => window.location.href = '/admin' }] : []),
    { type: 'divider' as const },
    { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, onClick: onLogout },
  ];

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-washi border-b border-charcoal shrink-0">
      {/* ── Logo ── */}
      <div
        className="flex items-center cursor-pointer shrink-0"
        onClick={() => window.location.href = '/home'}
      >
        <AppLogo />
      </div>

      {/* ── Right Section ── */}
      <nav aria-label="Điều hướng chính" className="ml-6 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {[
          ['/home', 'Trang chủ'], ['/problems', 'Bài tập'], ['/submissions', 'Bài nộp'],
          ['/matches/history', 'Lịch sử đấu'], ['/leaderboard', 'Xếp hạng'], ['/sandbox', 'Sandbox'],
        ].map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `shrink-0 px-2 py-2 text-xs transition-colors sm:px-3 sm:text-sm ${isActive ? 'text-vermilion' : 'text-stone hover:text-linen'}`}>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-4 ml-3">
        {/* Rating — Washi fill, NO Vermilion fill for small text */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-washi border border-charcoal">
          <Crown size={14} className="text-stone" />
          <span className="font-display text-sm font-bold text-linen tabular-nums">
            {user?.eloRating ?? user?.elo_rating ?? 1000}
          </span>
        </div>

        {/* User Dropdown */}
        <Dropdown menu={{ items: userDropdownItems }} trigger={['click']} placement="bottomRight">
          <div className="flex items-center gap-2.5 cursor-pointer px-2 py-1 hover:bg-charcoal/30 transition-colors">
            <Avatar
              size={32}
              src={user?.avatar || user?.avatarUrl || (user as any)?.avatar_url}
              icon={<UserOutlined />}
              className="shrink-0"
            >
              {user?.username?.charAt(0)?.toUpperCase()}
            </Avatar>
            <div className="hidden md:block">
              <div className="font-body text-sm font-semibold text-linen leading-tight">
                {user?.username ?? 'User'}
              </div>
              <div className="font-body text-xs text-stone leading-tight">
                {user?.role === Role.ADMIN ? 'Admin' : 'Coder'}
              </div>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}

/* =====================================================
   AppShellLayout — Ink shell, Washi top bar
   ===================================================== */

export function AppShellLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLElement>(null);
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/auth', { replace: true });
  }, [logout, navigate]);

  return (
    <div className="relative isolate flex flex-col h-screen overflow-hidden bg-ink">
      <AnimeStaggerVisual variant="ambient" scrollContainer={scrollContainerRef} scrollTarget={scrollTargetRef} />
      {/* ── Top Bar ── */}
      <TopBar
        user={user}
        onLogout={handleLogout}
      />

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <main ref={scrollContainerRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-transparent">
          <div ref={scrollTargetRef} className="mx-auto w-full max-w-[1700px] p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
