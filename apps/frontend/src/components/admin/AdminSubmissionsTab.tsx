import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react';
import type { AdminSubmissionSummary, ProblemListItem, SubmissionStatus } from '@ocj/contracts';
import { problemRepository, submissionRepository } from '../../app/api/client';
import { ApiError } from '../../lib/api/types';

const PAGE_SIZE = 20;
const REFRESH_INTERVAL_MS = 5_000;
const MAX_AUTO_REFRESHES = 12;
const statuses: SubmissionStatus[] = ['PENDING', 'PROCESSING', 'ACCEPTED', 'WA', 'TLE', 'MLE', 'RE', 'CE', 'SYSTEM_ERROR'];
const inputClass = 'rounded-md border border-charcoal bg-ink px-3 py-2 text-sm text-linen outline-none focus:border-vermilion';

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Không thể tải dữ liệu. Kiểm tra kết nối rồi thử lại.';
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value));
}

export function AdminSubmissionsTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') ?? '';
  const [items, setItems] = useState<AdminSubmissionSummary[]>([]);
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [status, setStatus] = useState<SubmissionStatus | ''>(() => statuses.includes(initialStatus as SubmissionStatus) ? initialStatus as SubmissionStatus : '');
  const [problemId, setProblemId] = useState(() => searchParams.get('problemId') ?? '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshesLeft, setRefreshesLeft] = useState(MAX_AUTO_REFRESHES);
  const [manualRefresh, setManualRefresh] = useState(0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveSubmission = items.some((item) => item.status === 'PENDING' || item.status === 'PROCESSING');

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await submissionRepository.getAdminSubmissions({
        page,
        limit: PAGE_SIZE,
        ...(status ? { status } : {}),
        ...(problemId ? { problemId } : {}),
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [page, status, problemId]);

  useEffect(() => {
    void problemRepository.getProblems({ page: 1, limit: 100 })
      .then((result) => setProblems(result.items))
      .catch(() => setProblems([]));
  }, []);

  useEffect(() => { void loadSubmissions(); }, [loadSubmissions, manualRefresh]);

  useEffect(() => {
    setRefreshesLeft(MAX_AUTO_REFRESHES);
  }, [page, status, problemId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (status) params.set('status', status);
    if (problemId) params.set('problemId', problemId);
    setSearchParams(params, { replace: true });
  }, [page, status, problemId, setSearchParams]);

  useEffect(() => {
    if (!hasActiveSubmission || refreshesLeft <= 0 || loading || error) return;
    const timer = window.setTimeout(() => {
      setRefreshesLeft((remaining) => remaining - 1);
      void loadSubmissions();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [hasActiveSubmission, refreshesLeft, loading, error, loadSubmissions]);

  return (
    <section className="border border-charcoal bg-washi">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-charcoal px-5 py-4">
        <div>
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-vermilion">02 · Persisted judging</p>
          <h2 className="mb-0 mt-1 font-display text-base font-bold text-linen">Bài nộp toàn hệ thống</h2>
        </div>
        <button type="button" onClick={() => setManualRefresh((value) => value + 1)} disabled={loading} className="inline-flex items-center gap-2 border border-charcoal px-3 py-2 text-xs font-semibold text-linen hover:border-vermilion disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-b border-charcoal p-4">
        <label className="flex items-center gap-2 text-xs text-stone">Trạng thái
          <select aria-label="Lọc theo trạng thái" value={status} onChange={(event) => { setStatus(event.target.value as SubmissionStatus | ''); setPage(1); }} className={inputClass}>
            <option value="">Tất cả</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-stone">Bài tập
          <select aria-label="Lọc theo bài tập" value={problemId} onChange={(event) => { setProblemId(event.target.value); setPage(1); }} className={inputClass}>
            <option value="">Tất cả bài</option>{problems.map((problem) => <option key={problem.id ?? problem.slug} value={problem.id ?? problem.slug}>{problem.title}</option>)}
          </select>
        </label>
        <span className="ml-auto text-xs text-stone">{total} bài nộp · trang {page}/{pageCount}</span>
      </div>

      {error ? <div role="alert" className="m-4 border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div> : null}
      {loading && items.length === 0 ? <p className="p-5 text-sm text-stone">Đang tải bài nộp...</p> : null}
      {!loading && !error && items.length === 0 ? <p className="p-5 text-sm text-stone">Không có bài nộp phù hợp bộ lọc.</p> : null}

      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead className="bg-ink text-[10px] uppercase tracking-wider text-stone"><tr>
              <th className="px-4 py-3 font-semibold">Người dùng</th><th className="px-4 py-3 font-semibold">Bài tập</th><th className="px-4 py-3 font-semibold">Kết quả</th><th className="px-4 py-3 font-semibold">Ngôn ngữ</th><th className="px-4 py-3 font-semibold">Tests</th><th className="px-4 py-3 font-semibold">Đã nộp</th><th className="px-4 py-3"><span className="sr-only">Chi tiết</span></th>
            </tr></thead>
            <tbody className="divide-y divide-charcoal">
              {items.map((item) => <tr key={item.id} className="hover:bg-ink/50">
                <td className="px-4 py-3 font-medium text-linen">{item.user.username}</td>
                <td className="px-4 py-3 text-linen"><span className="block">{item.problem.title}</span><span className="font-mono text-[10px] text-stone">{item.id.slice(0, 8)}</span></td>
                <td className="px-4 py-3"><span className={`inline-flex border px-2 py-1 text-[10px] font-bold ${item.status === 'ACCEPTED' ? 'border-emerald-500/30 text-emerald-300' : item.status === 'PENDING' || item.status === 'PROCESSING' ? 'border-sky-500/30 text-sky-300' : 'border-charcoal text-stone'}`}>{item.status}</span></td>
                <td className="px-4 py-3 text-stone">{item.language.toUpperCase()}</td>
                <td className="px-4 py-3 text-stone">{item.testCasesPassed}/{item.testCasesTotal} · v{item.testcaseSetVersion}</td>
                <td className="px-4 py-3 text-xs text-stone">{formatDate(item.createdAt)}</td>
                <td className="px-4 py-3"><button type="button" onClick={() => navigate(`/submissions/${item.id}`, { state: { from: `${location.pathname}${location.search}` } })} className="inline-flex items-center gap-1.5 text-xs font-semibold text-vermilion hover:text-linen"><ExternalLink size={13} /> Mở</button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      ) : null}

      <footer className="flex items-center justify-between border-t border-charcoal px-4 py-3 text-xs text-stone">
        <span>{hasActiveSubmission ? (refreshesLeft > 0 ? `Tự làm mới khi đang chấm · còn ${refreshesLeft} lần` : 'Tự làm mới đã dừng; bấm Làm mới để kiểm tra lại') : 'Chỉ metadata; source code nằm trong chi tiết bài nộp'}</span>
        <div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} aria-label="Trang trước" className="border border-charcoal p-2 disabled:opacity-40"><ChevronLeft size={14} /></button><button type="button" disabled={page >= pageCount || loading} onClick={() => setPage((value) => value + 1)} aria-label="Trang sau" className="border border-charcoal p-2 disabled:opacity-40"><ChevronRight size={14} /></button></div>
      </footer>
    </section>
  );
}
