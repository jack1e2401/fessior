import React, { useState, useEffect } from 'react';
import { Terminal, Play, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import { TestCaseSelector } from './TestCaseSelector';
import { ExecutionResultPanel } from './ExecutionResultPanel';
import type { IProblem } from '@ocj/contracts';

/* =====================================================
   ConsolePane — Ink & Vermillion
   Props unchanged: 7 props
   No purple gradient, no glow
   ===================================================== */

interface ConsolePaneProps {
  problem: IProblem | null;
  code: string;
  language: string;
  onSubmit: () => void;
  isSubmitting: boolean;
  verdict: string;
  verdictDetails?: any;
  showSubmit?: boolean;
  showSampleTests?: boolean;
  className?: string;
}

export const ConsolePane: React.FC<ConsolePaneProps> = ({
  problem,
  code,
  language,
  onSubmit,
  isSubmitting,
  verdict,
  verdictDetails,
  showSubmit = true,
  showSampleTests = true,
  className = 'h-[340px]',
}) => {
  const [activeTab, setActiveTab] = useState<'cases' | 'result'>('cases');
  const [testMode, setTestMode] = useState<'sample' | 'custom'>('sample');
  const [sampleTestCases, setSampleTestCases] = useState<any[]>([]);
  const [activeSampleIdx, setActiveSampleIdx] = useState<number>(0);
  const [customTestcases, setCustomTestcases] = useState<Array<{ input: string; expectedOutput: string }>>([{ input: '', expectedOutput: '' }]);

  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState<any[] | null>(null);
  const [runActiveCaseIdx, setRunActiveCaseIdx] = useState<number>(0);

  const problemId = problem?.id || problem?.slug;

  useEffect(() => {
    let cancelled = false;
    setSampleTestCases([]);
    setActiveSampleIdx(0);
    setCustomTestcases([{ input: '', expectedOutput: '' }]);
    setTestMode(problemId ? 'sample' : 'custom');
    if (!problemId) return () => { cancelled = true; };

    api.getTestcases(problemId, true).then((res) => {
      if (cancelled || !res.success || !res.data) return;
      setSampleTestCases(res.data);
      setCustomTestcases([{ input: res.data[0]?.input ?? '', expectedOutput: res.data[0]?.output ?? '' }]);
    });

    return () => { cancelled = true; };
  }, [problemId]);

  useEffect(() => {
    if (verdict || isSubmitting) {
      setActiveTab('result');
      setRunResults(null);
    }
  }, [verdict, isSubmitting]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setRunResults(null);
    setActiveTab('result');
    try {
      const payload: any = { code, language };
      if (problemId) payload.problemId = problemId;
      if (!showSampleTests) {
        // Playground mode — always send custom testcases (including an empty input)
        payload.customTestcases = customTestcases;
      } else if (testMode === 'custom') {
        payload.customTestcases = customTestcases;
      } else if (sampleTestCases.length > 0) {
        payload.exampleTestcaseIds = sampleTestCases.map(({ id }) => id);
      }
      const res = await api.runCode(payload);
      if (res.success && res.data) {
        setRunResults(res.data);
        setRunActiveCaseIdx(0);
      } else {
        setRunResults([{ status: 'SYSTEM_ERROR', error: 'Không thể kết nối đến hệ thống biên dịch.', actualOutput: '', input: testMode === 'custom' ? customTestcases[0]?.input ?? '' : '' }]);
      }
    } catch (err: any) {
      setRunResults([{ status: 'SYSTEM_ERROR', error: err.message || 'Lỗi không xác định khi thực thi mã nguồn.', actualOutput: '', input: testMode === 'custom' ? customTestcases[0]?.input ?? '' : '' }]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className={`flex flex-col ${className} bg-ink border border-charcoal border-t-0 overflow-hidden`}>
      {/* ── Header ── */}
      <div className="h-12 bg-washi border-b border-charcoal flex items-center justify-between px-4 shrink-0">
        <div className="flex gap-1">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 font-body text-xs transition-colors cursor-pointer ${activeTab === 'cases' ? 'bg-charcoal/30 text-linen' : 'text-stone hover:text-linen'
              }`}
            onClick={() => setActiveTab('cases')}
          >
            <Terminal size={13} />
            <span>Kiểm thử</span>
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 font-body text-xs transition-colors cursor-pointer ${activeTab === 'result' ? 'bg-charcoal/30 text-linen' : 'text-stone hover:text-linen'
              }`}
            onClick={() => setActiveTab('result')}
          >
            <CheckCircle size={13} />
            <span>Kết quả</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 border border-charcoal text-linen font-display text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 hover:border-stone transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
          >
            <Play size={12} />
            <span>{isRunning ? 'Đang chạy...' : 'Chạy thử'}</span>
          </button>
        {/* Submit is hidden when no problem context is available. */}
        {showSubmit && (
          <button
            className="bg-vermilion text-linen font-display text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 hover:bg-vermilion-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onSubmit}
            disabled={isRunning || isSubmitting}
          >
            <span>{isSubmitting ? 'Đang nộp...' : 'Nộp bài'}</span>
          </button>
        )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 bg-ink p-4 overflow-y-auto">
        {activeTab === 'cases' ? (
          showSampleTests ? (
            <TestCaseSelector
              testMode={testMode}
              setTestMode={setTestMode}
              sampleTestCases={sampleTestCases}
              activeSampleIdx={activeSampleIdx}
              setActiveSampleIdx={setActiveSampleIdx}
              customTestcases={customTestcases}
              setCustomTestcases={setCustomTestcases}
            />
          ) : (
            /* ── Playground mode: custom input only, no sample tests ── */
            <div className="flex flex-col gap-1.5">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-stone">Dữ liệu đầu vào (stdin)</span>
              <textarea
                className="bg-ink border border-charcoal p-3 font-mono text-xs text-linen placeholder-stone w-full h-32 resize-none outline-none focus:border-vermilion transition-colors"
                value={customTestcases[0]?.input ?? ''}
                onChange={(e) => setCustomTestcases([{ ...customTestcases[0], input: e.target.value }])}
                placeholder="Nhập stdin cho chương trình của bạn..."
                spellCheck="false"
              />
            </div>
          )
        ) : (
          <ExecutionResultPanel
            isRunning={isRunning}
            isSubmitting={isSubmitting}
            runResults={runResults}
            runActiveCaseIdx={runActiveCaseIdx}
            setRunActiveCaseIdx={setRunActiveCaseIdx}
            verdict={verdict}
            verdictDetails={verdictDetails}
          />
        )}
      </div>
    </div>
  );
};
