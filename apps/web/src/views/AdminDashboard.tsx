import { useAuth } from '../context/AuthContext';
import { AdminMatchesTab } from '../components/admin/AdminMatchesTab';
import { AdminProblemsTab } from '../components/admin/AdminProblemsTab';
import { AdminSubmissionsTab } from '../components/admin/AdminSubmissionsTab';

interface AdminDashboardProps {
  currentSubView: string;
  onViewChange: (view: string) => void;
}

const tabs = [
  { id: 'problems', label: 'Bài tập & Testcase' },
  { id: 'submissions', label: 'Bài nộp & Chấm' },
  { id: 'matches', label: 'Lịch sử 1v1' },
] as const;

export function AdminDashboard({ currentSubView, onViewChange }: AdminDashboardProps) {
  const { user } = useAuth();
  const requestedTab = currentSubView.split('/')[1];
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : 'problems';

  if (user?.role !== 'ADMIN') {
    return <div className="mx-auto mt-12 max-w-xl border border-charcoal bg-washi p-8 text-center">
      <h1 className="m-0 font-display text-xl font-bold text-vermilion">Quyền truy cập bị từ chối</h1>
      <p className="mb-0 mt-2 text-sm text-stone">Tài khoản hiện tại không có quyền quản trị.</p>
    </div>;
  }

  return (
    <main className="min-h-screen bg-ink text-linen">
      <header className="sticky top-0 z-20 border-b border-charcoal bg-washi/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1760px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <div><p className="m-0 text-[9px] font-semibold uppercase tracking-[0.18em] text-vermilion">Fessior · Admin</p><h1 className="mb-0 mt-0.5 truncate font-display text-sm font-bold sm:text-base">Admin panel</h1></div>
            <nav aria-label="Quy trình quản trị" className="flex max-w-full gap-1 overflow-x-auto sm:ml-3">
              {tabs.map((tab) => <button key={tab.id} type="button" aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => onViewChange(`admin/${tab.id}`)} className={`shrink-0 border-b-2 px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-vermilion ${activeTab === tab.id ? 'border-vermilion text-vermilion' : 'border-transparent text-stone hover:text-linen'}`}>{tab.label}</button>)}
            </nav>
          </div>
          <button type="button" onClick={() => onViewChange('home')} className="border border-charcoal px-3 py-2 text-xs font-semibold text-stone transition-colors hover:border-vermilion hover:text-linen">Thoát admin</button>
        </div>
      </header>
      <div className="mx-auto max-w-[1760px] px-5 py-7 sm:px-8 sm:py-9 2xl:px-10">
        {activeTab === 'problems' ? <AdminProblemsTab /> : null}
        {activeTab === 'submissions' ? <AdminSubmissionsTab /> : null}
        {activeTab === 'matches' ? <AdminMatchesTab /> : null}
      </div>
    </main>
  );
}

export default AdminDashboard;
