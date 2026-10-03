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
  customInput: string;
  setCustomInput: (input: string) => void;
}

export const TestCaseSelector: React.FC<TestCaseSelectorProps> = ({
  testMode,
  setTestMode,
  sampleTestCases,
  activeSampleIdx,
  setActiveSampleIdx,
  customInput,
  setCustomInput,
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
        <div className="flex flex-col gap-1.5">
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-stone">Dữ liệu đầu vào (stdin)</span>
          <textarea
            className="bg-ink border border-charcoal p-3 font-mono text-xs text-linen placeholder-stone w-full h-32 resize-none outline-none focus:border-vermilion transition-colors"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Nhập stdin cho chương trình của bạn..."
            spellCheck="false"
          />
        </div>
      )}
    </div>
  );
};
