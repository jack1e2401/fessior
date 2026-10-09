import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShellLayout } from '../layouts/AppShellLayout';
import { AuthPage } from '../../features/auth/AuthPage';
import { HomeView } from '../../views/HomeView';
import { SubmissionDetailView } from '../../views/SubmissionDetailView';
import { AdminDashboard } from '../../views/AdminDashboard';
import { PaginatedExplorerView } from '../../views/PaginatedExplorerView';
import { SandboxView } from '../../views/SandboxView';

/* =====================================================
   Route Wrappers
   ===================================================== */

function AdminRouteWrapper() {
  const nav = useNavigate();
  const params = useParams<{ subview?: string }>();
  const currentSubView = `admin/${params.subview ?? 'problems'}`;

  return (
    <AdminDashboard
      currentSubView={currentSubView}
      onViewChange={(view) => nav(`/${view}`)}
    />
  );
}

/* =====================================================
   AppRouter — main application router
   ===================================================== */

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/auth" element={<AuthPage />} />

        {/* ── Protected App Shell ── */}
        <Route
          element={
            <ProtectedRoute>
              <AppShellLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomeView />} />
          <Route path="/problems" element={<PaginatedExplorerView />} />
          <Route path="/problems/:problemSlug" element={<HomeView />} />
          <Route path="/submissions" element={<PaginatedExplorerView />} />
          <Route path="/matches/history" element={<PaginatedExplorerView />} />
          <Route path="/leaderboard" element={<PaginatedExplorerView />} />
          <Route path="/sandbox" element={<SandboxView />} />
          <Route path="/solve/:problemSlug" element={<HomeView />} />
          <Route path="/match" element={<HomeView />} />
          <Route path="/match/:matchId" element={<HomeView />} />
          <Route path="/submissions/:submissionId" element={<SubmissionDetailView />} />
        </Route>

        {/* ── Protected Admin Shell ── */}
        <Route path="/admin/:subview" element={<ProtectedRoute><AdminRouteWrapper /></ProtectedRoute>} />
        <Route path="/admin" element={<Navigate to="/admin/problems" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
