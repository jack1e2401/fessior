import React from 'react';

/* =====================================================
   TestCaseSelector — Ink & Vermillion
   Props unchanged: 7 props
   ===================================================== */

interface TestCaseSelectorProps {
  testMode: 'sample' | 'custom';
  setTestMode: (mode: 'sample' | 'custom') => void;
  sampleTestCases: any[];
  activeSampleIdx: number;
  setActiveSampleIdx: (idx: number) => void;
  customTestcases: Array<{ input: string; expectedOutput: string }>;
  setCustomTestcases: (cases: Array<{ input: string; expectedOutput: string }>) => void;
}

export const TestCaseSelector: React.FC<TestCaseSelectorProps> = ({
  testMode,
  setTestMode,
  sampleTestCases,
  activeSampleIdx,
  setActiveSampleIdx,
  customTestcases,
  setCustomTestcases,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Mode buttons */}
      <div className="flex gap-2">
        <button
          className={`font-display text-[10px] font-bold uppercase px-3 py-1.5 border cursor-pointer transition-colors ${testMode === 'sample' ? 'border-charcoal bg-charcoal/30 text-linen' : 'border-charcoal/50 text-stone hover:text-linen'
            }`}
          onClick={() => setTestMode('sample')}
        >
          Testcase mẫu
        </button>
        <button
          className={`font-display text-[10px] font-bold uppercase px-3 py-1.5 border cursor-pointer transition-colors ${testMode === 'custom' ? 'border-charcoal bg-charcoal/30 text-linen' : 'border-charcoal/50 text-stone hover:text-linen'
            }`}
          onClick={() => setTestMode('custom')}
        >
          Tùy biến Input
        </button>
      </div>

      {testMode === 'sample' ? (
        <>
          <div className="flex gap-2 flex-wrap">
            {sampleTestCases.map((_, idx) => (
              <button
                key={idx}
                className={`font-display text-[10px] font-bold px-2.5 py-1 border cursor-pointer transition-colors ${activeSampleIdx === idx ? 'border-charcoal bg-charcoal/30 text-linen' : 'border-charcoal/50 text-stone hover:text-linen'
                  }`}
                onClick={() => setActiveSampleIdx(idx)}
              >
                Case {idx + 1}
              </button>
            ))}
            {sampleTestCases.length === 0 && (
              <span className="font-body text-[11px] text-stone">Không có testcase mẫu</span>
            )}
          </div>

          {sampleTestCases[activeSampleIdx] && (
            <div className="flex flex-col gap-3">
              <div>
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-stone block mb-1.5">Input</span>
                <pre className="bg-ink border border-charcoal p-3 font-mono text-xs text-linen whitespace-pre-wrap">
                  {sampleTestCases[activeSampleIdx].input || 'Empty input'}
                </pre>
              </div>
              <div>
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-stone block mb-1.5">Expected Output</span>
                <pre className="bg-ink border border-charcoal p-3 font-mono text-xs text-linen whitespace-pre-wrap">
                  {sampleTestCases[activeSampleIdx].output || 'Empty output'}
                </pre>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-stone">Testcase tự thêm</span>
            <button type="button" disabled={customTestcases.length >= 10} onClick={() => setCustomTestcases([...customTestcases, { input: '', expectedOutput: '' }])} className="border border-charcoal px-2 py-1 text-xs text-linen disabled:opacity-40">+ Thêm testcase</button>
          </div>
          {customTestcases.map((testcase, index) => (
            <div key={index} className="grid gap-2 border border-charcoal p-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wider text-stone">Input {index + 1}
                <textarea maxLength={20_000} className="h-24 resize-y border border-charcoal bg-ink p-2 font-mono text-xs normal-case text-linen outline-none focus:border-vermilion" value={testcase.input} onChange={(event) => setCustomTestcases(customTestcases.map((item, itemIndex) => itemIndex === index ? { ...item, input: event.target.value } : item))} />
              </label>
              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wider text-stone">Expected output (optional)
                <textarea maxLength={20_000} className="h-24 resize-y border border-charcoal bg-ink p-2 font-mono text-xs normal-case text-linen outline-none focus:border-vermilion" value={testcase.expectedOutput} onChange={(event) => setCustomTestcases(customTestcases.map((item, itemIndex) => itemIndex === index ? { ...item, expectedOutput: event.target.value } : item))} />
              </label>
              {customTestcases.length > 1 && <button type="button" onClick={() => setCustomTestcases(customTestcases.filter((_, itemIndex) => itemIndex !== index))} className="justify-self-start text-xs text-rose-400">Xóa testcase</button>}
            </div>
          ))}
          <p className="m-0 text-[10px] text-stone">Tối đa 10 testcase; mỗi input/output tối đa 20 KB.</p>
        </div>
      )}
    </div>
  );
};
