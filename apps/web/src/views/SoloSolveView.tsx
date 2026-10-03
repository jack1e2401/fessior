import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { CodeEditorPane } from '../components/editor/CodeEditorPane';
import { ConsolePane } from '../components/editor/ConsolePane';
import { ProblemDescription } from '../components/editor/ProblemDescription';

export function SoloSolveView() {
  const { problemSlug } = useParams<{ problemSlug: string }>();
  const [problem, setProblem] = useState<any>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<'cpp' | 'java' | 'python'>('cpp');

  useEffect(() => {
    if (!problemSlug) return;
    const fetchProblem = async () => {
      try {
        const res = await api.getProblemDetail(problemSlug);
        if (res.success && res.data) {
          setProblem(res.data);
          setCode(res.data.starterCodes?.[language] ?? '');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProblem();
  }, [problemSlug, language]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<string>('');
  const [submissionId, setSubmissionId] = useState<string>('');
  const [verdictDetails, setVerdictDetails] = useState<any>({});

  const handleSubmit = async () => {
    if (!problem) return;
    setIsSubmitting(true);
    setVerdict('');
    setVerdictDetails({});
    try {
      const res = await api.submitCode({
        problemId: problem.id || problem._id || problem.slug,
        code,
        language,
      });
      if (res.success && res.data) {
        const subId = res.data.id || res.data._id;
        setSubmissionId(subId);
        setVerdict('PENDING');
        setIsSubmitting(false);

        // Poll for verdict every 2s until it's no longer PENDING/PROCESSING
        const poll = setInterval(async () => {
          try {
            const detail = await api.getSubmissionDetail(subId);
            if (detail.success && detail.data) {
              const s = detail.data.status;
              if (s && s !== 'PENDING' && s !== 'PROCESSING') {
                setVerdict(s);
                setVerdictDetails({
                  submissionId: subId,
                  testCasesPassed: detail.data.testCasesPassed ?? 0,
                  testCasesTotal: detail.data.testCasesTotal ?? 0,
                  error: detail.data.errorMessage ?? '',
                });
                clearInterval(poll);
              } else {
                // Still pending/processing — update label only
                setVerdict(s || 'PENDING');
              }
            }
          } catch {
            clearInterval(poll);
          }
        }, 2000);

        // Safety: stop polling after 60s
        setTimeout(() => clearInterval(poll), 60000);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };


  if (!problem) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-body text-sm text-stone">Đang tải bài toán...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
      {/* Left: Problem Description */}
      <div className="overflow-y-auto bg-washi border border-charcoal shadow-lg rounded-xl flex flex-col min-h-0">
        <ProblemDescription problem={problem} />
      </div>

      {/* Right: Editor + Console */}
      <div className="flex flex-col gap-4 lg:gap-6 min-h-0">
        <div className="flex-1 bg-ink border border-charcoal shadow-lg min-h-0 rounded-xl overflow-hidden">
          <CodeEditorPane
            code={code}
          language={language}
          onCodeChange={setCode}
          onLanguageChange={(lang) => setLanguage(lang as any)}
        />
        </div>
        <div className="h-[280px] bg-washi border border-charcoal shadow-lg shrink-0 rounded-xl overflow-hidden">
        <ConsolePane
          problem={problem}
          code={code}
          language={language}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          verdict={verdict}
          verdictDetails={verdictDetails.submissionId ? verdictDetails : { submissionId }}
        />
        </div>
      </div>
    </div>
  );
}
