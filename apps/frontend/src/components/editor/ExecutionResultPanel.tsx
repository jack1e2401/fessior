import React from 'react';
import { AlertCircle, Clock, Cpu, LoaderCircle } from 'lucide-react';
import { formatExecutionTime, formatMemoryKb } from '../../lib/utils';
import { StatusBadge } from '../shared/index';
import { Spin } from 'antd';

/* =====================================================
   ExecutionResultPanel — Ink & Vermillion
   Props unchanged: 7 props
   ===================================================== */

interface ExecutionResultPanelProps {
  isRunning: boolean;
  isSubmitting: boolean;
  runResults: any[] | null;
  runActiveCaseIdx: number;
  setRunActiveCaseIdx: (idx: number) => void;
  verdict: string;
  verdictDetails?: any;
}

export const ExecutionResultPanel: React.FC<ExecutionResultPanelProps> = ({
  isRunning,
  isSubmitting,
  runResults,
  runActiveCaseIdx,
  setRunActiveCaseIdx,
  verdict,
  verdictDetails,
}) => {
  const isAwaitingJudge = verdict === 'PENDING' || verdict === 'PROCESSING';
  const hasTestcaseSummary = Number.isFinite(verdictDetails?.testCasesPassed)
    && Number.isFinite(verdictDetails?.testCasesTotal);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Running state ── */}
      {isRunning && (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <Spin size="medium" />
          <p className="font-body text-xs text-stone">Đang biên dịch và thực thi mã nguồn...</p>
        </div>
      )}

      {/* ── Submitting state ── */}
      {isSubmitting && (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <Spin size="medium" />
          <p className="font-body text-xs text-stone">Đang chấm điểm trên hệ thống Sandbox...</p>
        </div>
      )}

      {/* ── Idle: no results yet ── */}
      {!isRunning && !isSubmitting && !runResults && !verdict && (
        <p className="font-body text-xs text-stone text-center py-10">
          Chưa có kết quả chạy thử. Hãy nhấn nút Chạy thử hoặc Nộp bài.
        </p>
      )}

      {!isRunning && !isSubmitting && runResults?.length === 0 && (
        <p className="py-8 text-center text-xs text-stone">Không có testcase mẫu để chạy. Chọn Tùy biến Input để thêm testcase của bạn.</p>
      )}

      {/* ── Run Results ── */}
      {!isRunning && !isSubmitting && runResults && (
        <div className="flex flex-col gap-3">
          {runResults.some((r) => r.status === 'SYSTEM_ERROR') ? (
            <div className="border border-charcoal bg-washi p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-stone" />
                <span className="font-display text-xs font-bold text-linen">Lỗi Hệ Thống Chấm Bài</span>
              </div>
              <pre className="font-mono text-xs text-linen/80 whitespace-pre-wrap">
                {runResults[0].error || runResults[0].actualOutput || 'Sandbox chưa sẵn sàng.'}
              </pre>
            </div>
          ) : runResults.some((r) => r.status === 'CE') ? (
            <div className="border border-vermilion bg-washi p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-vermilion" />
                <span className="font-display text-xs font-bold text-linen">Lỗi Biên Dịch (Compilation Error)</span>
              </div>
              <pre className="font-mono text-xs text-linen/80 whitespace-pre-wrap">
                {runResults[0].error || runResults[0].actualOutput || 'No output details provided.'}
              </pre>
            </div>
          ) : runResults.some((r) => r.status === 'RE') ? (
            <div className="border border-vermilion bg-washi p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-vermilion" />
                <span className="font-display text-xs font-bold text-linen">Lỗi Thực Thi (Runtime Error)</span>
              </div>
              <pre className="font-mono text-xs text-linen/80 whitespace-pre-wrap">
                {runResults[0].error || 'Chương trình kết thúc với mã lỗi khác 0.'}
              </pre>
            </div>
          ) : (
            <>
              {/* Case tabs */}
              <div className="flex gap-1.5 flex-wrap">
                {runResults.map((result, idx) => (
                  <button
                    key={idx}
                    className={`font-display text-[10px] font-bold px-2 py-1 border cursor-pointer transition-colors ${runActiveCaseIdx === idx ? 'border-charcoal bg-charcoal/30 text-linen' : 'border-charcoal/50 text-stone hover:text-linen'
                      }`}
                    onClick={() => setRunActiveCaseIdx(idx)}
                  >
                    Case {idx + 1} ({result.status})
                  </button>
                ))}
              </div>

              {/* Active case detail */}
              {runResults[runActiveCaseIdx] && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={runResults[runActiveCaseIdx].status} />
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-body text-[11px] text-stone">
                        <Clock size={11} />
                        {formatExecutionTime(runResults[runActiveCaseIdx].time)}
                      </span>
                      <span className="flex items-center gap-1 font-body text-[11px] text-stone">
                        <Cpu size={11} />
                        {formatMemoryKb(runResults[runActiveCaseIdx].memory)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-stone block mb-1.5">Input</span>
                    <pre className="bg-ink border border-charcoal p-2.5 font-mono text-xs text-linen whitespace-pre-wrap">
                      {runResults[runActiveCaseIdx].input || 'Empty input'}
                    </pre>
                  </div>
                  <div>
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-stone block mb-1.5">Your Output</span>
                    <pre className="bg-ink border border-charcoal p-2.5 font-mono text-xs text-linen whitespace-pre-wrap">
                      {runResults[runActiveCaseIdx].actualOutput || 'No output'}
                    </pre>
                  </div>
                  {runResults[runActiveCaseIdx].hasExpectedOutput && (
                    <div>
                      <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-stone block mb-1.5">Expected Output</span>
                      <pre className="bg-ink border border-charcoal p-2.5 font-mono text-xs text-linen whitespace-pre-wrap">
                        {runResults[runActiveCaseIdx].expectedOutput || 'Empty output'}
                      </pre>
                    </div>
                  )}
                  {!runResults[runActiveCaseIdx].hasExpectedOutput && runResults[runActiveCaseIdx].status === 'EXECUTED' && (
                    <p className="m-0 text-xs text-stone">Chưa nhập expected output; kết quả này chỉ xác nhận chương trình chạy xong.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Submission is queued or being judged ── */}
      {!isRunning && !isSubmitting && isAwaitingJudge && (
        <div aria-live="polite" className="flex items-center gap-4 border border-charcoal bg-washi px-4 py-5">
          <LoaderCircle aria-hidden="true" size={22} className="shrink-0 animate-spin text-vermilion" />
          <div className="min-w-0 flex-1">
            <p className="m-0 font-display text-sm font-bold text-linen">Bài làm của bạn đang được xử lý</p>
            <p className="mb-0 mt-1 font-body text-xs text-stone">Hệ thống đang chấm bài. Kết quả sẽ hiển thị tại đây khi hoàn tất.</p>
          </div>
          <StatusBadge status={verdict} />
        </div>
      )}

      {/* ── Official Verdict ── */}
      {!isRunning && !isSubmitting && verdict && !isAwaitingJudge && (
        <div className="flex flex-col gap-3">
          <div className="bg-washi border border-charcoal p-3 text-center">
            <StatusBadge status={verdict} />
          </div>

          {verdictDetails && (hasTestcaseSummary || verdictDetails.error) && (
            <div className="flex flex-col gap-3">
              {hasTestcaseSummary && (
                <p className="font-body text-sm text-linen">
                  <span className="text-stone">Số lượng Testcases đạt: </span>
                  <span className="font-display font-bold text-vermilion">
                    {verdictDetails.testCasesPassed} / {verdictDetails.testCasesTotal}
                  </span>
                </p>
              )}
              {verdictDetails.error && (
                <div className="border border-vermilion bg-washi p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={14} className="text-vermilion" />
                    <span className="font-display text-xs font-bold text-linen">Chi tiết thông báo lỗi</span>
                  </div>
                  <pre className="font-mono text-xs text-linen/80 whitespace-pre-wrap">{verdictDetails.error}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
