import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import { CodeEditorPane } from '../components/editor/CodeEditorPane';
import { ConsolePane } from '../components/editor/ConsolePane';
import { ProblemDescription } from '../components/editor/ProblemDescription';
import { MatchResultModal } from '../components/editor/MatchResultModal';
import { MatchParticipantStatus } from '../components/editor/MatchParticipantStatus';
import type { IMatch, IMatchParticipant } from '@ocj/contracts';

export function PvPWorkspaceView() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeMatch, setActiveMatch] = useState<IMatch | null>(null);
  const [problem, setProblem] = useState<any>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<'cpp' | 'java' | 'python'>('cpp');
  const [showResult, setShowResult] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  
  // Participant state for the two players.
  const [participants, setParticipants] = useState<IMatchParticipant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<string>('');

  // ── Load match + problem ──
  useEffect(() => {
    if (!matchId) return;

    socketService.joinMatch(matchId);

    // Fetch match details when entering or reconnecting by URL.
    api.getMatchDetails(matchId).then(res => {
      if (res.success && res.data) {
        const matchData = res.data;
        setActiveMatch(matchData);
        if (matchData.participants) {
          setParticipants(matchData.participants);
        }
        
        // Fetch problem if not present
        if (!problem && matchData.problem_id) {
          api.getProblemDetail(matchData.problem_id).then(pres => {
             if (pres.success && pres.data) {
               setProblem(pres.data);
               setCode(pres.data.starterCodes?.[0]?.code || '');
               setLanguage(pres.data.starterCodes?.[0]?.language || 'cpp');
             }
          });
        }
      }
    });

    socketService.onMatchEnded((data: any) => {
      if (data.matchId === matchId) {
        setIsSubmitting(false);
        setMatchResult(data);
        setShowResult(true);
        
        // Update participant ELO changes.
        if (data.eloUpdates) {
          setParticipants(prev => prev.map(p => {
            const update = data.eloUpdates[p.user_id];
            if (update) {
              return { 
                ...p, 
                score_change: update.change,
                is_winner: data.winnerId === p.user_id 
              };
            }
            return p;
          }));
        }
      }
    });

    // Realtime submission updates from either player.
    socketService.onRivalSubmission((data: any) => {
      setParticipants(prev => prev.map(p => {
        if (p.user_id === data.userId) {
          const newStatus = data.status === 'ACCEPTED' ? 'ACCEPTED' : 'SUBMITTED_WA';
          return { ...p, status: newStatus };
        }
        return p;
      }));

      if (data.userId === user?.id) {
        setIsSubmitting(false);
        setVerdict(data.status);
        if (data.status !== 'ACCEPTED') {
          toast.error(`Chưa chính xác (${data.status}). Thử lại nhé!`, { theme: 'dark' });
        }
      }
    });

    return () => {
      socketService.leaveMatch(matchId);
    };
  }, [matchId]); // Removed problem dependency to avoid infinite loops


  const [submissionId, setSubmissionId] = useState<string>('');

  const handleSubmit = async () => {
    if (!problem || !activeMatch?.id) return;
    
    setIsSubmitting(true);
    setVerdict('');
    try {
      const res = await api.submitCode({
        problemId: problem.id || problem._id || problem.slug,
        code,
        language,
        matchId: activeMatch.id,
      });

      if (res.success && res.data) {
        setSubmissionId(res.data.id || res.data._id);
        toast.success('Đã nộp bài thành công! Đang chờ chấm điểm...', { theme: 'dark' });
      } else {
        toast.error((res as any).message || 'Lỗi khi nộp bài', { theme: 'dark' });
        setIsSubmitting(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi hệ thống khi nộp bài', { theme: 'dark' });
      setIsSubmitting(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    navigate('/match');
  };

  if (!matchId) return null;

  return (
    <div className="flex flex-col h-full gap-4 p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
      <MatchParticipantStatus participants={participants} currentUserId={user?.id || ''} />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 min-h-0">
        {/* Left Side: Problem Statement */}
        <div className="bg-washi border border-charcoal flex flex-col min-h-0 shadow-lg rounded-xl overflow-hidden">
          <ProblemDescription problem={problem} />
        </div>

        {/* Right Side: Code Editor & Console */}
        <div className="flex flex-col gap-4 lg:gap-6 min-h-0">
          <div className="flex-1 bg-ink border border-charcoal shadow-lg min-h-0 rounded-xl overflow-hidden">
            <CodeEditorPane
              code={code}
              onCodeChange={setCode}
              language={language}
              onLanguageChange={setLanguage as any}
            />
          </div>
          <div className="h-[280px] bg-washi border border-charcoal shadow-lg shrink-0 rounded-xl overflow-hidden">
            <ConsolePane
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              verdict={verdict}
              verdictDetails={{ submissionId }}
              problem={problem}
              code={code}
              language={language}
            />
          </div>
        </div>
      </div>

      {/* ── Match Result Modal ── */}
      {showResult && matchResult && (
        <MatchResultModal
          result={matchResult}
          currentUserId={user?.id ?? ''}
          onClose={handleCloseResult}
        />
      )}
    </div>
  );
}
