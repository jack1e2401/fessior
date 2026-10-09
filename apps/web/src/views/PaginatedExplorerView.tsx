import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { api } from '../services/api';
import { DifficultyBadge } from '../components/shared/data/DifficultyBadge';

type PageResult = { total: number; items: any[]; page?: number; limit?: number };
const PAGE_SIZE = 20;

function normalizePage(data: any): PageResult {
  const source = data?.items ? data : data?.data?.items ? data.data : { items: Array.isArray(data) ? data : [], total: 0 };
  return { total: Number(source.total ?? source.items?.length ?? 0), items: source.items ?? [] };
}

export function PaginatedExplorerView() {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const kind = pathname.startsWith('/problems') ? 'problems'
    : pathname.startsWith('/submissions') ? 'submissions'
      : pathname.startsWith('/matches/history') ? 'matches' : 'leaderboard';
  const titles = { problems: 'Bài tập', submissions: 'Bài nộp', matches: 'Lịch sử đấu', leaderboard: 'Xếp hạng' };
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [query, setQuery] = useState(() => searchParams.get('search') ?? '');
  const [data, setData] = useState<PageResult>({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => { setPage(1); setQuery(''); }, [kind]);
  useEffect(() => {
    setPage(Math.max(1, Number(searchParams.get('page')) || 1));
    setQuery(searchParams.get('search') ?? '');
  }, [searchParams]);

  const navigatePage = (nextPage: number) => {
    const boundedPage = Math.max(1, nextPage);
    setPage(boundedPage);
    const next = new URLSearchParams(searchParams);
    if (boundedPage === 1) next.delete('page');
    else next.set('page', String(boundedPage));
    setSearchParams(next, { replace: true });
  };

  const updateProblemSearch = (value: string) => {
    setQuery(value);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    if (value.trim()) next.set('search', value.trim());
    else next.delete('search');
    setSearchParams(next, { replace: true });
  };
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const params = { page, limit: PAGE_SIZE, ...(kind === 'problems' && query.trim() ? { search: query.trim() } : {}) };
    const request = kind === 'problems' ? api.getProblems(params)
      : kind === 'submissions' ? api.getSubmissions(params)
        : kind === 'matches' ? api.getAllMatchHistory(params) : api.getLeaderboard(params);
    request.then((response: any) => {
      if (cancelled) return;
      if (!response?.success) { setError(true); return; }
      setData(normalizePage(response.data));
    }).catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [kind, page, query]);

  const pageCount = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const cell = (item: any, index: number) => {
    if (kind === 'problems') return (
      <Link to={`/problems/${item.slug}`} className="flex items-center justify-between gap-4 p-4 text-linen hover:bg-ink/70" key={item.id ?? item.slug}>
        <span className="font-semibold">{item.title}</span><DifficultyBadge difficulty={item.difficulty} size="small" showLabel />
      </Link>
    );
    if (kind === 'submissions') return (
      <Link to={`/submissions/${item.id}`} className="flex items-center justify-between gap-4 p-4 text-linen hover:bg-ink/70" key={item.id}>
        <span><b>{item.problem?.title ?? 'Bài tập'}</b><small className="ml-3 text-stone">{item.language}</small></span>
        <span className="text-sm">{item.status}</span>
      </Link>
    );
    if (kind === 'matches') return (
      <article className="grid gap-2 p-4 text-sm text-linen sm:grid-cols-[1fr_auto]" key={item.id}>
        <span>{item.participants?.map((p: any) => p.user?.username).filter(Boolean).join(' vs ') || 'Match'} · {item.problem?.title ?? item.problem_id}</span>
        <span className="text-stone">{item.status} · {new Date(item.created_at).toLocaleString()}</span>
      </article>
    );
    return (
      <article className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 p-4 text-linen" key={item.id}>
        <span className="font-display text-stone">#{item.rank ?? (page - 1) * PAGE_SIZE + index + 1}</span>
        <span>{item.username}</span><span className="font-bold tabular-nums text-vermilion">{item.eloRating} ELO</span>
      </article>
    );
  };

  return (
    <section className="mx-auto w-full max-w-5xl text-linen">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="m-0 font-display text-2xl font-bold">{titles[kind]}</h1><p className="mb-0 mt-1 text-sm text-stone">{data.total} mục</p></div>
        {kind === 'problems' && <label className="flex items-center gap-2 border border-charcoal px-3 py-2"><Search size={15} className="text-stone" /><input aria-label="Tìm bài tập" value={query} onChange={(event) => updateProblemSearch(event.target.value)} className="w-56 bg-transparent text-sm outline-none" placeholder="Tìm bài tập..." /></label>}
      </header>
      <div className="divide-y divide-charcoal border border-charcoal bg-washi">
        {loading ? <p className="p-6 text-sm text-stone">Đang tải...</p>
          : error ? <p className="p-6 text-sm text-rose-400">Không thể tải dữ liệu. Thử tải lại trang.</p>
            : data.items.length ? data.items.map(cell)
              : <p className="p-6 text-sm text-stone">Chưa có dữ liệu.</p>}
      </div>
      <footer className="mt-4 flex items-center justify-between">
        <span className="text-sm text-stone">Trang {page} / {pageCount}</span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1 || loading} onClick={() => navigatePage(page - 1)} className="border border-charcoal p-2 text-linen disabled:opacity-40" aria-label="Trang trước"><ChevronLeft size={18} /></button>
          <button type="button" disabled={page >= pageCount || loading} onClick={() => navigatePage(page + 1)} className="border border-charcoal p-2 text-linen disabled:opacity-40" aria-label="Trang sau"><ChevronRight size={18} /></button>
        </div>
      </footer>
    </section>
  );
}
