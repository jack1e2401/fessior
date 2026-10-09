import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, LoaderCircle, Swords } from 'lucide-react';
import type { IMatch } from '@ocj/contracts';
import { matchRepository } from '../../app/api/client';
import { ApiError } from '../../lib/api/types';

const PAGE_SIZE = 20;

function formatDate(value?: string | Date | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function eloText(value: number) {
  return `${value > 0 ? '+' : ''}${value} ELO`;
}

export function AdminMatchesTab() {
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<IMatch | null>(null);
  const [detail, setDetail] = useState<IMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    matchRepository.getAllMatches({ page, limit: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setMatches(result.items);
        setTotal(result.total);
        if (selected && !result.items.some((match) => match.id === selected.id)) setSelected(null);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof ApiError ? cause.message : 'Không thể tải lịch sử trận đấu.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  useEffect(() => {
    if (!selected) { setDetail(null); setDetailError(''); return; }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError('');
    matchRepository.getMatch(selected.id)
      .then((match) => { if (!cancelled) setDetail(match); })
      .catch((cause: unknown) => { if (!cancelled) setDetailError(cause instanceof ApiError ? cause.message : 'Không tải được chi tiết trận đấu.'); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selected]);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
      <section className="min-w-0 border border-charcoal bg-washi">
        <header className="flex items-center justify-between gap-3 border-b border-charcoal px-5 py-4">
          <div><p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-vermilion">03 · Match settlement</p><h2 className="mb-0 mt-1 font-display text-base font-bold text-linen">Lịch sử 1v1</h2></div>
          <span className="text-xs text-stone">{total} trận</span>
        </header>
        {error ? <p role="alert" className="m-4 border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p> : null}
        {loading && matches.length === 0 ? <div className="flex items-center gap-2 p-5 text-sm text-stone"><LoaderCircle size={16} className="animate-spin" /> Đang tải trận đấu...</div> : null}
        {!loading && !error && matches.length === 0 ? <p className="p-5 text-sm text-stone">Chưa có trận đấu nào.</p> : null}
        {matches.length ? <div className="divide-y divide-charcoal">
          {matches.map((match) => {
            const participants = match.participants ?? [];
            const winner = participants.find((participant) => participant.is_winner);
            return <button key={match.id} type="button" onClick={() => setSelected(match)} className={`grid w-full gap-3 px-4 py-4 text-left transition-colors sm:grid-cols-[minmax(0,1fr)_minmax(100px,0.5fr)_auto] sm:items-center ${selected?.id === match.id ? 'bg-ink' : 'hover:bg-ink/60'}`}>
              <span className="min-w-0"><span className="flex items-center gap-2 text-sm font-semibold text-linen"><Swords size={14} className="shrink-0 text-vermilion" />{match.problem?.title ?? 'Bài tập đã xóa'}</span><span className="mt-1 block truncate text-xs text-stone">{participants.map((participant) => participant.user?.username ?? 'Người chơi').join('  vs  ') || 'Chưa có người chơi'}</span></span>
              <span className={`w-fit border px-2 py-1 text-[10px] font-bold ${match.status === 'RUNNING' ? 'border-sky-500/30 text-sky-300' : 'border-charcoal text-stone'}`}>{match.status}</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-vermilion"><Eye size={14} /> {winner ? `Thắng: ${winner.user?.username ?? 'player'}` : 'Chi tiết'}</span>
              <span className="text-[10px] text-stone sm:col-span-3">{formatDate(match.created_at)}</span>
            </button>;
          })}
        </div> : null}
        <footer className="flex items-center justify-between border-t border-charcoal px-4 py-3 text-xs text-stone"><span>Trang {page} / {pageCount}</span><div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} aria-label="Trang trước" className="border border-charcoal p-2 disabled:opacity-40"><ChevronLeft size={14} /></button><button type="button" disabled={page >= pageCount || loading} onClick={() => setPage((value) => value + 1)} aria-label="Trang sau" className="border border-charcoal p-2 disabled:opacity-40"><ChevronRight size={14} /></button></div></footer>
      </section>

      <aside className="h-fit border border-charcoal bg-washi">
        <header className="border-b border-charcoal px-5 py-4"><h2 className="m-0 font-display text-sm font-bold text-linen">Chi tiết trận</h2></header>
        {!selected ? <p className="p-5 text-sm text-stone">Chọn một trận để xem kết quả đã lưu.</p> : null}
        {detailLoading ? <div className="flex items-center gap-2 p-5 text-sm text-stone"><LoaderCircle size={16} className="animate-spin" /> Đang tải...</div> : null}
        {detailError ? <p role="alert" className="m-4 border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{detailError}</p> : null}
        {detail ? <div className="space-y-4 p-5">
          <div><p className="m-0 text-[10px] uppercase tracking-wider text-stone">{detail.problem?.title ?? selected?.problem?.title ?? 'Bài tập đã xóa'}</p><p className="mb-0 mt-1 font-mono text-xs text-stone">Match {detail.id}</p></div>
          <div className="flex items-center justify-between border-y border-charcoal py-3"><span className="text-xs text-stone">Trạng thái</span><span className="text-xs font-bold text-linen">{detail.status}</span></div>
          <div className="space-y-2">{(detail.participants ?? []).map((participant) => <div key={participant.id} className="flex items-center justify-between gap-3 border border-charcoal px-3 py-3">
            <div className="min-w-0"><p className="m-0 truncate text-sm font-semibold text-linen">{participant.user?.username ?? 'Người chơi'}{participant.is_winner ? <span className="ml-2 text-[10px] uppercase tracking-wider text-emerald-300">Winner</span> : null}</p><p className="mb-0 mt-1 text-[10px] text-stone">{participant.status}</p></div>
            <span className={`shrink-0 text-xs font-semibold ${participant.score_change > 0 ? 'text-emerald-300' : participant.score_change < 0 ? 'text-rose-300' : 'text-stone'}`}>{eloText(participant.score_change)}</span>
          </div>)}</div>
          <dl className="grid grid-cols-2 gap-3 border-t border-charcoal pt-3 text-xs"><div><dt className="text-stone">Bắt đầu</dt><dd className="mb-0 mt-1 text-linen">{formatDate(detail.started_at ?? detail.created_at)}</dd></div><div><dt className="text-stone">Kết thúc</dt><dd className="mb-0 mt-1 text-linen">{formatDate(detail.ended_at)}</dd></div></dl>
        </div> : null}
      </aside>
    </div>
  );
}
