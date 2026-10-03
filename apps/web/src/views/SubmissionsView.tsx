import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function formatRelativeTime(timestamp?: string | number): string {
  if (!timestamp) return "Just now";
  const diff = Date.now() - new Date(timestamp).getTime();
  if (diff < 60 * 1000) return "Just now";
  
  const minutes = Math.floor(diff / (60 * 1000));
  if (minutes < 60) return `${minutes} mins ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function mapLanguageLabel(lang: string): string {
  if (!lang) return 'Unknown';
  const mapping: Record<string, string> = {
    cpp: "C++",
    python: "Python",
    java: "Java",
    javascript: "JavaScript",
    go: "Go",
    rust: "Rust",
  };
  return mapping[lang.toLowerCase()] ?? lang;
}

function getStatusDisplay(status: string) {
  const s = (status || '').toUpperCase();
  if (s === 'ACCEPTED' || s === 'FULL_ACCEPTED') return { label: 'Accepted', color: '#10b981' };
  if (s === 'WA' || s === 'WRONG_ANSWER') return { label: 'Wrong Answer', color: '#ef4444' };
  if (s === 'TLE' || s === 'TIME_LIMIT_EXCEEDED') return { label: 'Time Limit Exceeded', color: '#f59e0b' };
  if (s === 'MLE' || s === 'MEMORY_LIMIT_EXCEEDED') return { label: 'Memory Limit Exceeded', color: '#f59e0b' };
  if (s === 'CE' || s === 'COMPILE_ERROR') return { label: 'Compile Error', color: '#f59e0b' };
  if (s === 'RE' || s === 'RUNTIME_ERROR') return { label: 'Runtime Error', color: '#f59e0b' };
  if (s === 'SYSTEM_ERROR' || s === 'ERROR') return { label: 'System Error', color: '#6b7280' };
  if (s === 'PROCESSING') return { label: 'Processing...', color: '#60a5fa' };
  if (s === 'PENDING') return { label: 'Pending...', color: '#9ca3af' };
  return { label: status || 'Unknown', color: '#6b7280' };
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
    <div className="flex items-center justify-center gap-2 mt-6 font-body">
      <button 
        disabled={page <= 1} 
        onClick={() => onPage(page - 1)}
        className="px-3 py-1.5 border border-charcoal rounded-md text-stone text-sm bg-washi disabled:opacity-50 hover:border-vermilion hover:text-vermilion transition-colors"
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
            className={`px-3 py-1.5 border rounded-md text-sm transition-colors ${p === page ? 'bg-vermilion text-linen border-vermilion' : 'bg-washi border-charcoal text-stone hover:border-vermilion hover:text-vermilion'}`}
          >
            {p}
          </button>
        )
      )}
      <button
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="px-3 py-1.5 border border-charcoal rounded-md text-stone text-sm bg-washi disabled:opacity-50 hover:border-vermilion hover:text-vermilion transition-colors"
      >
        Next
      </button>
    </div>
  );
}

export const SubmissionsView: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    api.getSubmissions().then(res => {
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.items || []);
        const sorted = list.sort((a: any, b: any) => 
          new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime()
        );
        setSubmissions(sorted);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return submissions.slice(startIndex, startIndex + pageSize);
  }, [submissions, currentPage]);

  const handleViewDetail = async (sub: any) => {
    setSelectedSub(sub);
    try {
      const res = await api.getSubmissionDetail(sub.id || sub._id);
      if (res.success && res.data) {
        setSelectedSub(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto w-full flex flex-col py-8 font-body bg-ink p-6 rounded-2xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-[2rem] font-extrabold text-linen m-0 tracking-tight">Submission</h1>
          <p className="text-[1rem] text-stone m-0">All submissions today</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" size={16} />
            <input 
              type="text" 
              placeholder="Search problems..." 
              className="pl-9 pr-4 py-2.5 bg-washi border border-charcoal rounded-lg text-sm text-linen focus:outline-none focus:border-vermilion transition-shadow w-[240px]" 
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-charcoal rounded-lg bg-washi text-stone text-sm font-semibold hover:border-vermilion hover:text-vermilion transition-colors shadow-sm">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-charcoal rounded-lg bg-washi text-stone text-sm font-semibold hover:border-vermilion hover:text-vermilion transition-colors shadow-sm">
            <ArrowUpDown size={16} /> Sort by
          </button>
        </div>
      </div>

      <div className="bg-washi border border-charcoal rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-stone">Loading...</div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-stone">No submissions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-charcoal">
                  <th className="px-6 py-5 font-bold text-stone tracking-wider uppercase text-[0.75rem]">Time</th>
                  <th className="px-6 py-5 font-bold text-stone tracking-wider uppercase text-[0.75rem]">User</th>
                  <th className="px-6 py-5 font-bold text-stone tracking-wider uppercase text-[0.75rem]">Problem</th>
                  <th className="px-6 py-5 font-bold text-stone tracking-wider uppercase text-[0.75rem]">Language</th>
                  <th className="px-6 py-5 font-bold text-stone tracking-wider uppercase text-[0.75rem]">Status</th>
                  <th className="px-6 py-5 font-bold text-stone tracking-wider uppercase text-[0.75rem] text-right">Runtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal">
                {paginatedSubmissions.map(sub => {
                  const statusData = getStatusDisplay(sub.status);
                  const username = sub.user?.username || sub.username || user?.username || 'Khoidesu';
                  const problemName = sub.problemId?.title || sub.problem?.title || sub.problemId || 'Unknown Problem';
                  
                  return (
                    <tr 
                      key={sub.id || sub._id} 
                      className="hover:bg-ink cursor-pointer transition-colors" 
                      onClick={() => handleViewDetail(sub)}
                    >
                      <td className="px-6 py-4 text-stone">
                        <div className="w-[60px] whitespace-normal leading-tight">
                          {formatRelativeTime(sub.createdAt || sub.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-linen">
                        {username}
                      </td>
                      <td className="px-6 py-4 font-bold text-linen">
                        {problemName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[0.75rem] font-bold bg-ink border border-charcoal text-stone">
                          {mapLanguageLabel(sub.language)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span style={{ color: statusData.color }}>{statusData.label}</span>
                      </td>
                      <td className="px-6 py-4 text-stone text-right font-medium">
                        {sub.executionTime ? `${sub.executionTime}ms` : '0ms'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {Math.ceil(submissions.length / pageSize) > 1 && (
        <CustomPagination 
          page={currentPage} 
          total={submissions.length} 
          limit={pageSize} 
          onPage={setCurrentPage} 
        />
      )}

      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-body">
          <div className="bg-ink border border-charcoal rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
            <div className="px-6 py-5 border-b border-charcoal flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-linen">
                Submission #{String(selectedSub.id || selectedSub._id).slice(-6)}
              </h3>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-stone hover:text-vermilion transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-washi rounded-xl border border-charcoal">
                <div>
                  <div className="text-[11px] text-stone uppercase font-bold mb-1">Problem</div>
                  <div className="text-sm text-linen font-bold">
                    {selectedSub.problemId?.title || selectedSub.problem?.title || selectedSub.problemId || 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-stone uppercase font-bold mb-1">Result</div>
                  <div className="text-sm font-bold" style={{ color: getStatusDisplay(selectedSub.status).color }}>
                    {getStatusDisplay(selectedSub.status).label}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-stone uppercase font-bold mb-1">Language</div>
                  <div className="text-sm text-linen font-mono font-medium">{mapLanguageLabel(selectedSub.language)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-stone uppercase font-bold mb-1">Difficulty</div>
                  <div className="text-sm text-stone font-medium">
                    {selectedSub.problemId?.difficulty || selectedSub.problem?.difficulty || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-linen mb-3 uppercase tracking-wider">Source Code</h4>
                <pre className="bg-washi border border-charcoal p-5 rounded-xl text-sm text-linen font-mono overflow-x-auto shadow-inner">
                  <code>{selectedSub.code}</code>
                </pre>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsView;
