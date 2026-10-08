import { useEffect, useMemo, useState } from 'react';
import { Spin } from 'antd';
import { Search, CheckCircle2, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProblems } from './hooks/useProblems';
import { useMatchStore } from '../../stores/match.store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DifficultyBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    EASY: { label: "Dễ", bg: "bg-green-500/10", text: "text-green-400" },
    MEDIUM: { label: "Trung bình", bg: "bg-yellow-500/10", text: "text-yellow-400" },
    HARD: { label: "Khó", bg: "bg-red-500/10", text: "text-red-400" },
  };
  const { label, bg, text } = map[level] || map.MEDIUM;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[0.75rem] font-bold ${bg} ${text}`}>
      {label}
    </span>
  );
}

function CustomPagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pages: (number | "...")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1, 2, 3);
    if (page > 5) pages.push("...");
    if (page > 3 && page < totalPages - 2) pages.push(page);
    if (page < totalPages - 4) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6 font-sans">
      <button 
        disabled={page <= 1} 
        onClick={() => onPage(page - 1)}
        className="px-3 py-1.5 border border-charcoal rounded-md text-stone text-sm bg-washi disabled:opacity-50 hover:bg-charcoal/20 transition-colors"
      >
        Previous
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="text-stone px-1">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            className={`px-3 py-1.5 border border-charcoal rounded-md text-sm transition-colors ${p === page ? 'bg-vermilion text-linen border-vermilion' : 'bg-washi text-stone hover:bg-charcoal/20'}`}
          >
            {p}
          </button>
        )
      )}
      <button
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="px-3 py-1.5 border border-charcoal rounded-md text-stone text-sm bg-washi disabled:opacity-50 hover:bg-charcoal/20 transition-colors"
      >
        Next
      </button>
    </div>
  );
}

// ─── Filter Bar ────────────────────────────────────────────────────────────────

function FilterBar({ activeDiff, onDiff }: {
  activeDiff: string;
  onDiff: (d: string) => void;
}) {
  const difficulties = ["EASY", "MEDIUM", "HARD"];
  const diffLabel: Record<string, string> = {
    EASY: "Dễ",
    MEDIUM: "Trung bình",
    HARD: "Khó",
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-ink rounded-xl border border-charcoal mb-4 animate-fade-in-up shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="flex items-center gap-2 text-sm font-bold text-stone w-[80px]">
          <Filter size={16} /> Độ khó
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1.5 rounded-md text-[0.8rem] font-semibold border transition-colors ${!activeDiff ? 'bg-washi border-vermilion text-linen' : 'bg-ink border-charcoal text-stone hover:bg-charcoal/30'}`}
            onClick={() => onDiff("")}
          >
            Tất cả
          </button>
          {difficulties.map((d) => (
            <button
              key={d}
              className={`px-3 py-1.5 rounded-md text-[0.8rem] font-semibold border transition-colors ${activeDiff === d ? 'bg-washi border-vermilion text-linen' : 'bg-ink border-charcoal text-stone hover:bg-charcoal/30'}`}
              onClick={() => onDiff(activeDiff === d ? "" : d)}
            >
              {diffLabel[d]}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── ProblemsPage ───

export function ProblemsPage() {
  const navigate = useNavigate();
  const { problems, isLoading, isError } = useProblems();
  const setSelectedProblem = useMatchStore((s) => s.setSelectedProblem);

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    return problems.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch = !q
        || p.title.toLowerCase().includes(q)
        || p.slug.toLowerCase().includes(q);
      const matchesDifficulty = !difficulty || p.difficulty === difficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [problems, search, difficulty]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, difficulty]);

  const currentProblems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, currentPage]);

  const handleSelect = (slug: string) => {
    const problem = problems.find((p) => p.slug === slug) ?? null;
    setSelectedProblem(problem);
    navigate(`/solve/${slug}`);
  };

  return (
    <div className="max-w-[1000px] mx-auto w-full flex flex-col py-8 font-sans">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-[2rem] font-extrabold text-linen m-0 tracking-tight font-display">Problems</h1>
          <p className="text-[1rem] text-stone m-0">Chọn bài toán để nộp lời giải.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" size={16} />
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-ink border border-charcoal rounded-lg text-sm text-linen focus:outline-none focus:border-vermilion transition-colors w-[240px]"
            />
          </div>

          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-semibold transition-colors shadow-sm ${showFilter ? 'bg-charcoal/50 border-vermilion text-linen' : 'bg-ink border-charcoal text-linen hover:bg-charcoal/30'}`}
          >
            <Filter size={16} /> Filter
          </button>
          
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showFilter && (
        <FilterBar
          activeDiff={difficulty}
          onDiff={setDifficulty}
        />
      )}

      {/* ── Active filters indicator ── */}
      {(difficulty || search) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {difficulty && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vermilion/10 text-vermilion text-xs font-bold border border-vermilion/20">
              Độ khó: {difficulty}
              <button onClick={() => setDifficulty("")} className="hover:text-linen"><X size={12} /></button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vermilion/10 text-vermilion text-xs font-bold border border-vermilion/20">
              Tìm: "{search}"
              <button
                onClick={() => setSearch("")}
                className="hover:text-linen"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-washi border border-charcoal rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 flex justify-center text-stone"><Spin size="large" /></div>
        ) : isError ? (
          <div className="p-12 text-center text-vermilion">⚠ Lỗi khi tải danh sách bài tập.</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4 text-stone">
            <CheckCircle2 size={40} className="text-charcoal" />
            <p className="text-lg font-semibold">Không tìm thấy bài toán nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-charcoal bg-ink/30">
                  <th className="px-6 py-5 font-bold text-stone tracking-wider uppercase text-[0.75rem]">Tên bài</th>
                  <th className="px-6 py-5 font-bold text-stone tracking-wider uppercase text-[0.75rem] text-center w-[120px]">Độ khó</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal">
                {currentProblems.map((p) => {
                  return (
                    <tr
                      key={p.id ?? p.slug}
                      className="hover:bg-ink/40 cursor-pointer transition-colors"
                      onClick={() => handleSelect(p.slug)}
                    >
                      <td className="px-6 py-4 align-middle">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-bold text-linen text-[15px]">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle text-center">
                        <DifficultyBadge level={p.difficulty ?? "EASY"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {filtered.length > pageSize && (
        <CustomPagination
          page={currentPage}
          total={filtered.length}
          limit={pageSize}
          onPage={setCurrentPage}
        />
      )}
    </div>
  );
}
