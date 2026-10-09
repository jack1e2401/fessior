import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Clock3, Cpu, FileCode2, LoaderCircle, RotateCw } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { ISubmission } from '@ocj/contracts';
import { StatusBadge } from '../components/shared/data/StatusBadge';
import { submissionRepository } from '../app/api/client';
import { ApiError } from '../lib/api/types';

function formatDate(value?: string | Date) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatMemory(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return '—';
  return value >= 1024 ? `${(value / 1024).toFixed(1)} MB` : `${value} KB`;
}

function languageLabel(language?: string) {
  switch (language?.toLowerCase()) {
    case 'cpp': return 'C++';
    case 'java': return 'Java';
    case 'python': return 'Python';
    default: return language || '—';
  }
}

export function SubmissionDetailView() {
  const { submissionId = '' } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const query = useQuery<ISubmission, Error>({
    queryKey: ['submissions', 'detail', submissionId],
    queryFn: () => submissionRepository.getSubmission(submissionId),
    enabled: Boolean(submissionId),
    retry: 0,
  });

  const submission = query.data;
  const statusCode = query.error instanceof ApiError ? query.error.statusCode : undefined;

  const handleBack = () => {
    navigate(from || '/home');
  };

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 pb-10 font-body">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex w-fit items-center gap-2 border border-charcoal px-3 py-2 text-sm text-stone transition-colors hover:border-vermilion hover:text-linen"
      >
        <ArrowLeft size={16} /> Quay lại workbench
      </button>

      {query.isLoading ? (
        <section aria-live="polite" className="grid min-h-[360px] place-items-center border border-charcoal bg-washi">
          <div className="flex items-center gap-3 text-sm text-stone">
            <LoaderCircle size={18} className="animate-spin text-vermilion" /> Đang tải submission...
          </div>
        </section>
      ) : query.isError ? (
        <section className="grid min-h-[360px] place-items-center border border-charcoal bg-washi px-6 py-10 text-center">
          <div className="max-w-md">
            <h1 className="m-0 font-display text-xl font-bold text-linen">
              {statusCode === 404 ? 'Không tìm thấy submission' : 'Không tải được submission'}
            </h1>
            <p className="mb-0 mt-2 text-sm leading-6 text-stone">
              {statusCode === 404
                ? 'Submission này không tồn tại hoặc đã bị xóa.'
                : query.error.message || 'Đã xảy ra lỗi khi kết nối tới API.'}
            </p>
            {statusCode !== 404 && (
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="mt-5 inline-flex items-center gap-2 border border-vermilion px-4 py-2 text-sm font-semibold text-vermilion transition-colors hover:bg-vermilion hover:text-black"
              >
                <RotateCw size={15} /> Thử lại
              </button>
            )}
          </div>
        </section>
      ) : submission ? (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4 border border-charcoal bg-washi p-5 sm:p-7">
            <div className="min-w-0">
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.18em] text-stone">Submission detail</p>
              <h1 className="mb-0 mt-2 break-all font-display text-xl font-bold text-linen sm:text-2xl">
                Submission #{submission.id ?? submissionId}
              </h1>
              <p className="mb-0 mt-2 text-sm text-stone">
                {submission.problem?.title ?? `Problem ${submission.problemId}`}
              </p>
            </div>
            <StatusBadge status={submission.status} />
          </header>

          <section aria-label="Thông tin submission" className="grid grid-cols-1 border border-charcoal bg-washi sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-b border-charcoal p-4 sm:border-r lg:border-b-0">
              <p className="m-0 flex items-center gap-2 text-xs text-stone"><FileCode2 size={14} /> Ngôn ngữ</p>
              <p className="mb-0 mt-2 text-sm font-semibold text-linen">{languageLabel(submission.language)}</p>
            </div>
            <div className="border-b border-charcoal p-4 lg:border-b-0 lg:border-r">
              <p className="m-0 flex items-center gap-2 text-xs text-stone"><Clock3 size={14} /> Runtime</p>
              <p className="mb-0 mt-2 text-sm font-semibold tabular-nums text-linen">
                {submission.executionTime == null ? '—' : `${submission.executionTime} ms`}
              </p>
            </div>
            <div className="border-b border-charcoal p-4 sm:border-r sm:border-b-0">
              <p className="m-0 flex items-center gap-2 text-xs text-stone"><Cpu size={14} /> Memory</p>
              <p className="mb-0 mt-2 text-sm font-semibold tabular-nums text-linen">{formatMemory(submission.memoryUsed)}</p>
            </div>
            <div className="p-4">
              <p className="m-0 flex items-center gap-2 text-xs text-stone"><Clock3 size={14} /> Đã nộp</p>
              <p className="mb-0 mt-2 text-sm font-semibold text-linen">{formatDate(submission.createdAt)}</p>
            </div>
          </section>

          {typeof submission.testCasesTotal === 'number' && submission.testCasesTotal > 0 && (
            <section className="flex flex-wrap items-center justify-between gap-3 border border-charcoal bg-washi p-5">
              <div>
                <h2 className="m-0 font-display text-sm font-bold text-linen">Kết quả chấm</h2>
                <p className="mb-0 mt-1 text-xs text-stone">Testcase set v{submission.testcaseSetVersion ?? '—'} · {submission.testCasesTotal} testcase</p>
              </div>
              <p className="m-0 flex items-center gap-2 font-display text-lg font-bold tabular-nums text-linen">
                <CheckCircle2 size={17} className="text-vermilion" />
                {submission.testCasesPassed ?? 0} / {submission.testCasesTotal}
              </p>
            </section>
          )}

          <section className="border border-charcoal bg-washi">
            <header className="border-b border-charcoal px-5 py-4">
              <h2 className="m-0 font-display text-sm font-bold text-linen">Judging</h2>
            </header>
            {submission.caseResults?.length ? (
              <div className="divide-y divide-charcoal/70">
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className={submission.caseResults[0].status === 'CE' ? 'text-rose-400' : 'text-emerald-400'}>{submission.caseResults[0].status === 'CE' ? '× Compile error' : '✓ Compile'}</span>
                </div>
                {submission.caseResults.map((result) => (
                  <div key={result.position} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3 text-sm">
                    <span className={result.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-rose-400'}>{result.status === 'ACCEPTED' ? '✓' : '×'} Test {result.position} · {result.status}</span>
                    <span className="tabular-nums text-stone">{result.executionTime == null ? '—' : `${result.executionTime} ms`}</span>
                    <span className="tabular-nums text-stone">{formatMemory(result.memoryUsed)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="m-0 px-5 py-4 text-sm text-stone">Backend chưa lưu kết quả từng testcase cho submission này.</p>}
          </section>

          <section className="border border-charcoal bg-washi">
            <header className="border-b border-charcoal px-5 py-4"><h2 className="m-0 font-display text-sm font-bold text-linen">Timeline</h2></header>
            {submission.statusTimeline?.length ? (
              <ol className="m-0 list-none divide-y divide-charcoal/70 p-0">
                {submission.statusTimeline.map((event, index) => <li key={`${event.status}-${index}`} className="flex items-center justify-between gap-4 px-5 py-3 text-sm"><span className="font-mono text-linen">{event.status === 'PENDING' ? 'QUEUED' : event.status}</span><time className="text-xs text-stone">{formatDate(event.at)}</time></li>)}
              </ol>
            ) : <p className="m-0 px-5 py-4 text-sm text-stone">Không có timeline được lưu cho submission này.</p>}
          </section>

          <section className="overflow-hidden border border-charcoal bg-ink">
            <header className="flex items-center justify-between border-b border-charcoal bg-washi px-4 py-3">
              <h2 className="m-0 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-linen">
                <FileCode2 size={15} className="text-vermilion" /> Source code
              </h2>
              <span className="text-xs text-stone">{languageLabel(submission.language)}</span>
            </header>
            <pre className="m-0 max-h-[min(58vh,680px)] overflow-auto p-5 text-xs leading-6 text-linen sm:p-7 sm:text-sm">
              <code className="font-mono">{submission.code}</code>
            </pre>
          </section>
        </>
      ) : null}
    </div>
  );
}
