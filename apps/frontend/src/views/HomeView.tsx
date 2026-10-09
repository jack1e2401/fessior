import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  Circle,
  Code2,
  Crown,
  LoaderCircle,
  Maximize2,
  Search,
  Swords,
  X,
} from 'lucide-react';
import type { IMatch, IProblem, ISubmission } from '@ocj/contracts';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { CodeEditorPane } from '../components/editor/CodeEditorPane';
import { ConsolePane } from '../components/editor/ConsolePane';
import { ProblemDescription } from '../components/editor/ProblemDescription';
import { useProblems } from '../features/problems/hooks/useProblems';
import { MatchFindingView } from './MatchFindingView';
import { PvPWorkspaceView } from './PvPWorkspaceView';
import { DifficultyBadge } from '../components/shared/data/DifficultyBadge';
import { NearFullModal } from '../components/shared/NearFullModal';

type ProblemSummary = IProblem & {
  acceptanceRate?: number;
  totalSubmissions?: number;
  isSolved?: boolean;
};

const statusStyles: Record<string, string> = {
  ACCEPTED: 'text-emerald-400',
  PENDING: 'text-sky-400',
  PROCESSING: 'text-sky-400',
  WA: 'text-rose-400',
  TLE: 'text-amber-400',
  MLE: 'text-amber-400',
  CE: 'text-amber-400',
  RE: 'text-rose-400',
  SYSTEM_ERROR: 'text-stone',
};

const statusLabels: Record<string, string> = {
  ACCEPTED: 'Accepted',
  PENDING: 'Đang chờ',
  PROCESSING: 'Đang chấm',
  WA: 'Wrong answer',
  TLE: 'Time limit',
  MLE: 'Memory limit',
  CE: 'Compile error',
  RE: 'Runtime error',
  SYSTEM_ERROR: 'Lỗi hệ thống',
};

function formatTime(value?: string | Date | null) {
  if (!value) return 'Vừa xong';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Vừa xong';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return date.toLocaleDateString('vi-VN');
}

function asList<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

export const HomeView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { problemSlug, matchId: routeMatchId } = useParams<{ problemSlug?: string; matchId?: string }>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string>();
  const [problemDetail, setProblemDetail] = useState<IProblem | null>(null);
  const [language, setLanguage] = useState<'cpp' | 'java' | 'python'>('python');
  const [code, setCode] = useState('');
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<'problems' | 'activity' | null>(null);
  const [matchWorkspaceId, setMatchWorkspaceId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ISubmission[]>([]);
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [submissionId, setSubmissionId] = useState<string>();
  const [verdict, setVerdict] = useState('');
  const [verdictDetails, setVerdictDetails] = useState<any>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [recentSubmissionError, setRecentSubmissionError] = useState(false);
  const [recentMatchError, setRecentMatchError] = useState(false);

  const handleMatchFound = useCallback((match: { matchId: string }) => {
    setShowMatchmaking(false);
    setMatchWorkspaceId(match.matchId);
  }, []);

  const { problems, total: problemTotal, isLoading: problemsLoading, isError: problemsError } = useProblems({
    search: searchQuery,
    page: 1,
    limit: 3,
  });

  const selectedSummary = useMemo(
    () => (problems as ProblemSummary[]).find((problem) => problem.slug === selectedSlug),
    [problems, selectedSlug],
  );
  const selectedProblem = problemDetail?.slug === selectedSlug ? problemDetail : selectedSummary;

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchText.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    if (problemSlug) {
      setSelectedSlug(problemSlug);
      return;
    }
    if (!selectedSlug && problems.length > 0) {
      setSelectedSlug(problems[0].slug);
    }
  }, [problemSlug, problems, selectedSlug]);

  useEffect(() => {
    if (!selectedSlug) return;
    let cancelled = false;
    setProblemDetail(null);
    setVerdict('');
    setVerdictDetails(undefined);

    api.getProblemDetail(selectedSlug).then((response) => {
      if (!cancelled && response.success && response.data) {
        setProblemDetail(response.data as IProblem);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  useEffect(() => {
    if (!selectedProblem) return;
    setCode(selectedProblem.starterCodes?.[language] ?? '');
  }, [selectedProblem?.slug, language, problemDetail]);

  const loadSubmissions = useCallback(async () => {
    setSubmissionsLoading(true);
    try {
      const response = await api.getSubmissions({ page: 1, limit: 5 });
      if (response.success) {
        setRecentSubmissionError(false);
        setSubmissions(asList<ISubmission>(response.data));
      } else setRecentSubmissionError(true);
    } catch {
      setRecentSubmissionError(true);
    } finally {
      setSubmissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (routeMatchId) {
      setMatchWorkspaceId(routeMatchId);
    } else {
      api.getActiveMatch().then((response) => {
        if (!cancelled && response.success && response.data) setMatchWorkspaceId(response.data.id);
      });
    }
    loadSubmissions();
    api.getMatchHistory({ page: 1, limit: 4 }).then((response) => {
      if (cancelled) return;
      if (response.success) {
        setRecentMatchError(false);
        setMatches(asList<IMatch>(response.data));
      } else setRecentMatchError(true);
    }).catch(() => {
      if (!cancelled) setRecentMatchError(true);
    }).finally(() => {
      if (!cancelled) setMatchesLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadSubmissions, routeMatchId]);

  useEffect(() => {
    if (!submissionId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      const response = await api.getSubmissionDetail(submissionId);
      if (cancelled) return;
      const submission = response.data as ISubmission | undefined;
      if (!response.success || !submission) {
        timer = setTimeout(poll, 2000);
        return;
      }

      if (submission.status !== 'PENDING' && submission.status !== 'PROCESSING') {
        setVerdict(submission.status);
        setVerdictDetails({
          testCasesPassed: submission.testCasesPassed,
          testCasesTotal: submission.testCasesTotal,
          error: submission.errorMessage,
        });
        void loadSubmissions();
        return;
      }

      if (attempts < 30) timer = setTimeout(poll, 2000);
    };

    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [submissionId, loadSubmissions]);

  const handleSelectProblem = (problem: IProblem) => {
    setSelectedSlug(problem.slug);
    setProblemDetail(null);
    setSubmissionId(undefined);
    setVerdict('');
    navigate(`/problems/${problem.slug}`);
  };

  const openSubmission = (id?: string) => {
    if (!id) return;
    const from = `${location.pathname}${location.search}${location.hash}`;
    navigate(`/submissions/${id}`, { state: { from } });
  };

  const handleLanguageChange = (value: string) => {
    if (value === 'cpp' || value === 'java' || value === 'python') setLanguage(value);
  };

  const handleSubmit = async () => {
    if (!selectedProblem?.id) return;
    setIsSubmitting(true);
    setSubmissionId(undefined);
    setVerdict('');
    setVerdictDetails(undefined);
    const response = await api.submitCode({ problemId: selectedProblem.id, code, language });
    setIsSubmitting(false);
    if (response.success && response.data?.id) {
      setSubmissionId(response.data.id);
      setVerdict('PENDING');
      setVerdictDetails({});
      void loadSubmissions();
    }
  };

  const toggleSearch = () => {
    if (searchOpen) {
      setSearchOpen(false);
      setSearchText('');
      return;
    }
    setSearchOpen(true);
  };

  const toggleMatchmaking = () => {
    if (showMatchmaking) socketService.leaveQueue();
    setShowMatchmaking((visible) => !visible);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 pb-8 font-body">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-bold text-linen font-display">Xin chào, {user?.username ?? 'coder'}!</h1>
          <p className="mb-0 mt-1 text-sm text-stone">Chọn bài toán và bắt đầu giải ngay tại đây.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-charcoal bg-washi px-3 py-2 text-sm text-linen">
            <Crown size={15} className="text-vermilion" />
            <span className="font-bold tabular-nums">{user?.eloRating ?? user?.elo_rating ?? 1000} ELO</span>
          </div>
          <button
            type="button"
            onClick={toggleMatchmaking}
            disabled={Boolean(matchWorkspaceId)}
            className="inline-flex items-center gap-2 border border-vermilion bg-vermilion px-3 py-2 text-sm font-bold text-black transition-colors hover:bg-vermilion-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Swords size={16} /> {matchWorkspaceId ? 'Đang trong trận' : showMatchmaking ? 'Đóng tìm trận' : 'Tìm trận 1v1'}
          </button>
        </div>
      </header>

      {matchWorkspaceId ? (
        <PvPWorkspaceView
          key={matchWorkspaceId}
          matchId={matchWorkspaceId}
          onClose={() => {
            setMatchWorkspaceId(null);
            navigate('/home', { replace: true });
          }}
        />
      ) : (
        <>
          {showMatchmaking && (
            <MatchFindingView
              onStartMatch={handleMatchFound}
              onClose={() => setShowMatchmaking(false)}
            />
          )}

          <div className="grid min-h-0 grid-cols-1 items-start gap-4 xl:grid-cols-[250px_minmax(420px,1fr)_270px]">
        <aside className="flex max-h-[calc(100vh-190px)] min-h-[360px] flex-col border border-charcoal bg-washi">
          <div className="flex items-center justify-between border-b border-charcoal px-3 py-3">
            <div>
              <h2 className="m-0 text-sm font-bold uppercase tracking-wider text-linen font-display">Bài tập gợi ý</h2>
              <p className="mb-0 mt-1 text-xs text-stone">3 bài để bắt đầu · {problemTotal} tổng</p>
            </div>
            <button
              type="button"
              aria-label="Mở danh sách tất cả bài tập"
              onClick={() => navigate('/problems')}
              className="grid h-9 w-9 place-items-center border border-charcoal text-stone transition-colors hover:border-vermilion hover:text-linen"
            >
              <Maximize2 size={16} />
            </button>
            <button
              type="button"
              aria-label={searchOpen ? 'Đóng tìm kiếm' : 'Tìm bài tập'}
              aria-expanded={searchOpen}
              onClick={toggleSearch}
              className={`grid h-9 w-9 place-items-center border transition-colors ${searchOpen ? 'border-vermilion text-vermilion' : 'border-charcoal text-stone hover:text-linen'}`}
            >
              {searchOpen ? <X size={17} /> : <Search size={17} />}
            </button>
          </div>

          {searchOpen && (
            <div className="border-b border-charcoal p-3">
              <input
                autoFocus
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') toggleSearch();
                }}
                placeholder="Tìm theo tên bài..."
                className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-linen outline-none placeholder:text-stone focus:border-vermilion"
              />
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {problemsLoading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-xs text-stone">
                <LoaderCircle size={15} className="animate-spin" /> Đang tải bài tập...
              </div>
            ) : problemsError ? (
              <p className="p-4 text-xs text-rose-400">Không tải được danh sách bài.</p>
            ) : problems.length === 0 ? (
              <p className="p-4 text-xs text-stone">Không tìm thấy bài phù hợp.</p>
            ) : (
              (problems as ProblemSummary[]).map((problem) => {
                const selected = problem.slug === selectedSlug;
                return (
                  <button
                    type="button"
                    key={problem.id ?? problem.slug}
                    onClick={() => handleSelectProblem(problem)}
                    className={`flex w-full flex-col gap-2 border-b border-charcoal/70 px-3 py-3 text-left transition-colors ${selected ? 'border-l-2 border-l-vermilion bg-ink' : 'hover:bg-ink/70'}`}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-linen">
                      {problem.isSolved ? <Check size={15} className="shrink-0 text-emerald-400" /> : <Circle size={14} className="shrink-0 text-stone" />}
                      <span className="truncate">{problem.title}</span>
                      <DifficultyBadge difficulty={problem.difficulty} size="small" showLabel />
                    </span>
                    <span className="flex items-center justify-between pl-5 text-[11px] text-stone">
                      <span>{problem.acceptanceRate ?? 0}% AC · {problem.totalSubmissions ?? 0} lượt</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex min-w-0 flex-col gap-3">
          {selectedProblem ? (
            <>
              <ProblemDescription problem={selectedProblem} className="h-[210px]" />
              <CodeEditorPane
                className="h-[min(48vh,440px)] min-h-[300px]"
                code={code}
                language={language}
                onCodeChange={setCode}
                onLanguageChange={handleLanguageChange}
              />
              <ConsolePane
                className="h-[280px]"
                problem={selectedProblem}
                code={code}
                language={language}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                verdict={verdict}
                verdictDetails={verdictDetails}
              />
            </>
          ) : (
            <section className="grid min-h-[500px] place-items-center border border-charcoal bg-washi p-6 text-center">
              <div>
                <Code2 size={32} className="mx-auto text-stone" />
                <p className="mb-0 mt-3 text-sm text-linen">Chọn một bài tập để mở code editor.</p>
              </div>
            </section>
          )}
        </main>

        <aside className="flex flex-col gap-4">
          <section className="border border-charcoal bg-washi">
            <div className="flex items-center justify-between border-b border-charcoal px-3 py-3">
              <div>
                <h2 className="m-0 text-xs font-bold uppercase tracking-wider text-linen font-display">Bài nộp gần đây</h2>
                <span className="text-[11px] text-stone">5 gần nhất</span>
              </div>
              <button
                type="button"
                aria-label="Mở rộng hoạt động gần đây"
                onClick={() => setExpandedPanel('activity')}
                className="grid h-8 w-8 place-items-center border border-charcoal text-stone transition-colors hover:border-vermilion hover:text-linen"
              >
                <Maximize2 size={15} />
              </button>
            </div>
            <div className="divide-y divide-charcoal/70">
              {submissionsLoading ? (
                <p className="m-0 p-4 text-xs text-stone">Đang tải bài nộp...</p>
              ) : recentSubmissionError ? (
                <p className="m-0 p-4 text-xs text-rose-400">Không tải được bài nộp gần đây.</p>
              ) : submissions.length === 0 ? (
                <p className="m-0 p-4 text-xs text-stone">Chưa có bài nộp. Chọn bài và gửi lời giải đầu tiên.</p>
              ) : submissions.map((submission) => (
                <button
                  type="button"
                  key={submission.id}
                  onClick={() => openSubmission(submission.id)}
                  disabled={!submission.id}
                  className="flex w-full items-start justify-between gap-2 px-3 py-3 text-left transition-colors hover:bg-ink/70 disabled:cursor-default"
                >
                  <div className="min-w-0">
                    <p className="m-0 truncate text-xs font-semibold text-linen">
                      {(submission as any).problem?.title ?? 'Bài tập'}
                    </p>
                    <p className={`mb-0 mt-1 text-[11px] ${statusStyles[submission.status] ?? 'text-stone'}`}>
                      {statusLabels[submission.status] ?? submission.status}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="m-0 text-[11px] text-stone">{submission.executionTime ? `${submission.executionTime}ms` : '—'}</p>
                    <p className="mb-0 mt-1 text-[10px] text-stone/70">{formatTime(submission.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="border border-charcoal bg-washi">
            <div className="flex items-center justify-between border-b border-charcoal px-3 py-3">
              <h2 className="m-0 text-xs font-bold uppercase tracking-wider text-linen font-display">Trận gần đây</h2>
              <Swords size={15} className="text-vermilion" />
            </div>
            {matchesLoading ? (
              <p className="m-0 p-4 text-xs text-stone">Đang tải lịch sử...</p>
            ) : recentMatchError ? (
              <p className="m-0 p-4 text-xs text-rose-400">Không tải được trận gần đây.</p>
            ) : matches.length === 0 ? (
              <p className="m-0 p-4 text-xs text-stone">Chưa có trận đấu nào.</p>
            ) : (
              <div className="divide-y divide-charcoal/70">
                {matches.map((match) => {
                  const mine = match.participants?.find((participant) => participant.user_id === user?.id);
                  const opponent = match.participants?.find((participant) => participant.user_id !== user?.id);
                  const label = match.status === 'RUNNING'
                    ? 'Đang đấu'
                    : match.status === 'DRAW'
                      ? 'Hòa'
                      : mine?.is_winner
                        ? 'Thắng'
                        : 'Thua';
                  const delta = mine?.score_change;
                  return (
                    <div key={match.id} className="flex items-center justify-between gap-2 px-3 py-3">
                      <div className="min-w-0">
                        <p className="m-0 truncate text-xs font-semibold text-linen">vs {opponent?.user?.username ?? 'Đối thủ'}</p>
                        <p className="mb-0 mt-1 text-[10px] text-stone">{label} · {formatTime(match.ended_at ?? match.started_at ?? match.created_at)}</p>
                      </div>
                      {match.status !== 'RUNNING' && typeof delta === 'number' && (
                        <span className={`shrink-0 text-xs font-bold tabular-nums ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {delta > 0 ? '+' : ''}{delta} ELO
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
          </div>
        </>
      )}

      {expandedPanel === 'problems' && (
        <NearFullModal
          title="Danh sách bài tập"
          subtitle={`${problemTotal} bài · Chọn bài để mở đề và editor trong workbench`}
          onClose={() => setExpandedPanel(null)}
        >
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 text-sm text-stone">Tìm và chọn một bài để tiếp tục giải.</p>
            <div className="relative w-full sm:max-w-sm">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
              <input
                autoFocus
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Tìm theo tên bài..."
                className="w-full border border-charcoal bg-washi py-3 pl-10 pr-3 text-sm text-linen outline-none placeholder:text-stone focus:border-vermilion"
              />
            </div>
          </div>
          <div className="border-y border-charcoal">
            {problemsLoading ? (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-stone"><LoaderCircle size={17} className="animate-spin" /> Đang tải bài tập...</div>
            ) : problemsError ? (
              <p className="p-6 text-sm text-rose-400">Không tải được danh sách bài.</p>
            ) : problems.length === 0 ? (
              <p className="p-6 text-sm text-stone">Không tìm thấy bài phù hợp.</p>
            ) : (problems as ProblemSummary[]).map((problem) => (
              <button
                type="button"
                key={problem.id ?? problem.slug}
                onClick={() => { handleSelectProblem(problem); setExpandedPanel(null); }}
                className="flex w-full items-center justify-between gap-4 border-b border-charcoal/70 px-4 py-5 text-left transition-colors last:border-b-0 hover:bg-washi sm:px-6"
              >
                <span className="flex min-w-0 items-center gap-3">
                  {problem.isSolved ? <Check size={17} className="shrink-0 text-emerald-400" /> : <Circle size={16} className="shrink-0 text-stone" />}
                  <span className="truncate text-base font-semibold text-linen">{problem.title}</span>
                  <DifficultyBadge difficulty={problem.difficulty} size="small" showLabel />
                </span>
                <span className="shrink-0 text-xs tabular-nums text-stone">{problem.acceptanceRate ?? 0}% AC · {problem.totalSubmissions ?? 0} lượt</span>
              </button>
            ))}
          </div>
        </NearFullModal>
      )}

      {expandedPanel === 'activity' && (
        <NearFullModal
          title="Hoạt động gần đây"
          subtitle="Bài nộp và lịch sử trận đấu của bạn"
          onClose={() => setExpandedPanel(null)}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="border border-charcoal bg-washi">
              <header className="border-b border-charcoal px-5 py-4">
                <h3 className="m-0 font-display text-sm font-bold uppercase tracking-wider text-linen">Bài nộp gần đây</h3>
              </header>
              {submissionsLoading ? (
                <p className="m-0 p-5 text-sm text-stone">Đang tải bài nộp...</p>
              ) : recentSubmissionError ? (
                <p className="m-0 p-5 text-sm text-rose-400">Không tải được bài nộp gần đây.</p>
              ) : submissions.length === 0 ? (
                <p className="m-0 p-5 text-sm text-stone">Chưa có bài nộp nào.</p>
              ) : (
                <div className="divide-y divide-charcoal/70">
                  {submissions.map((submission) => (
                    <button
                      type="button"
                      key={submission.id}
                      onClick={() => { openSubmission(submission.id); setExpandedPanel(null); }}
                      disabled={!submission.id}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-ink/70 disabled:cursor-default"
                    >
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-semibold text-linen">{(submission as any).problem?.title ?? 'Bài tập'}</p>
                        <p className={`mb-0 mt-2 text-xs ${statusStyles[submission.status] ?? 'text-stone'}`}>{statusLabels[submission.status] ?? submission.status}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="m-0 text-xs text-stone">{submission.executionTime ? `${submission.executionTime}ms` : '—'}</p>
                        <p className="mb-0 mt-2 text-[11px] text-stone/70">{formatTime(submission.createdAt)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="border border-charcoal bg-washi">
              <header className="flex items-center justify-between border-b border-charcoal px-5 py-4">
                <h3 className="m-0 font-display text-sm font-bold uppercase tracking-wider text-linen">Trận gần đây</h3>
                <Swords size={16} className="text-vermilion" />
              </header>
              {matchesLoading ? (
                <p className="m-0 p-5 text-sm text-stone">Đang tải lịch sử...</p>
              ) : recentMatchError ? (
                <p className="m-0 p-5 text-sm text-rose-400">Không tải được lịch sử trận đấu.</p>
              ) : matches.length === 0 ? (
                <p className="m-0 p-5 text-sm text-stone">Chưa có trận đấu nào.</p>
              ) : (
                <div className="divide-y divide-charcoal/70">
                  {matches.map((match) => {
                    const mine = match.participants?.find((participant) => participant.user_id === user?.id);
                    const opponent = match.participants?.find((participant) => participant.user_id !== user?.id);
                    const label = match.status === 'RUNNING' ? 'Đang đấu' : match.status === 'DRAW' ? 'Hòa' : mine?.is_winner ? 'Thắng' : 'Thua';
                    const delta = mine?.score_change;
                    return (
                      <article key={match.id} className="flex items-center justify-between gap-4 px-5 py-5">
                        <div className="min-w-0">
                          <p className="m-0 truncate text-sm font-semibold text-linen">vs {opponent?.user?.username ?? 'Đối thủ'}</p>
                          <p className="mb-0 mt-2 text-xs text-stone">{label} · {formatTime(match.ended_at ?? match.started_at ?? match.created_at)}</p>
                        </div>
                        {match.status !== 'RUNNING' && typeof delta === 'number' && <span className={`shrink-0 text-sm font-bold tabular-nums ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{delta > 0 ? '+' : ''}{delta} ELO</span>}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </NearFullModal>
      )}
    </div>
  );
};
