import React, { useEffect, useState } from 'react';
import { Play, Eye, FileCode, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import type { ISubmission, IProblem } from '@ocj/contracts';
import { AdminCard, AdminHeader, AdminSelect, AdminTextarea, AdminFormGroup, AdminButton, AdminListRow, AdminBadge } from './ui/AdminUI';

export const AdminSubmissionsTab: React.FC = () => {
  const [submissions, setSubmissions] = useState<ISubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSub, setSelectedSub] = useState<ISubmission | null>(null);
  
  // Custom Run Code Simulator state
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [problems, setProblems] = useState<IProblem[]>([]);
  const [testCode, setTestCode] = useState('');
  const [testLanguage, setTestLanguage] = useState<'cpp' | 'java' | 'python'>('cpp');
  const [customInput, setCustomInput] = useState('');
  const [runResult, setRunResult] = useState<any>(null);
  const [runLoading, setRunLoading] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.getSubmissions();
      if (res.success && res.data) {
        setSubmissions(res.data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblems = async () => {
    try {
      const res = await api.getProblems();
      const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setProblems(items);
      if (items.length > 0) setSelectedProblemId(items[0].id || items[0]._id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchProblems();
  }, []);

  const handleInspect = async (subId: string) => {
    try {
      const res = await api.getSubmissionDetail(subId);
      if (res.success) {
        setSelectedSub(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lấy thông tin chi tiết');
    }
  };

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunLoading(true);
    setRunResult(null);
    try {
      const res = await api.runCode({
        problemId: selectedProblemId,
        language: testLanguage,
        code: testCode,
      });
      if (res.success) {
        setRunResult(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi biên dịch / thực thi');
    } finally {
      setRunLoading(false);
    }
  };

  const getStatusColor = (status: string): any => {
    switch (status) {
      case 'ACCEPTED': return 'green';
      case 'WRONG_ANSWER': return 'red';
      case 'COMPILE_ERROR': return 'yellow';
      case 'SYSTEM_ERROR': return 'gray';
      case 'PENDING': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left side: Submissions List */}
      <AdminCard>
        <AdminHeader>Danh Sách Lượt Nộp Bài</AdminHeader>
        <div className="flex flex-col gap-3 max-h-[680px] overflow-y-auto pr-1">
          {loading ? (
            <p className="text-stone text-sm">Đang tải danh sách bài nộp...</p>
          ) : submissions.length === 0 ? (
            <p className="text-stone text-sm">Chưa có lượt nộp bài nào trên hệ thống.</p>
          ) : (
            submissions.map((sub, idx) => {
              const subId = sub.id;
              return (
                <AdminListRow key={subId || idx}>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-sm text-linen font-body">
                      ID: {subId?.slice(-8)} (Bài: {typeof sub.problemId === 'string' ? sub.problemId.slice(-6) : 'Đang tải'})
                    </span>
                    <div className="flex items-center gap-2">
                      <AdminBadge color={getStatusColor(sub.status)}>
                        {sub.status}
                      </AdminBadge>
                      <AdminBadge>{sub.language?.toUpperCase()}</AdminBadge>
                      <AdminBadge>
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleTimeString() : ''}
                      </AdminBadge>
                    </div>
                  </div>

                  <AdminButton variant="icon-edit" onClick={() => handleInspect(subId!)} title="Xem chi tiết & Code">
                    <Eye size={14} />
                  </AdminButton>
                </AdminListRow>
              );
            })
          )}
        </div>
      </AdminCard>

      {/* Right side: Detailed View or Runner Tool */}
      <div className="flex flex-col gap-6">
        {selectedSub && (
          <AdminCard>
            <AdminHeader 
              rightNode={
                <AdminButton variant="icon-delete" onClick={() => setSelectedSub(null)}>
                  <AlertTriangle size={14} />
                </AdminButton>
              }
            >
              Lượt Nộp: {selectedSub.id?.slice(-8)}
            </AdminHeader>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2">
                <strong className="text-stone font-display uppercase text-xs">Trạng thái:</strong> 
                <AdminBadge color={getStatusColor(selectedSub.status)}>{selectedSub.status}</AdminBadge>
              </div>
              <div className="flex items-center gap-2">
                <strong className="text-stone font-display uppercase text-xs">Ngôn ngữ:</strong> 
                <span className="text-linen">{selectedSub.language}</span>
              </div>
              <div className="flex items-center gap-2">
                <strong className="text-stone font-display uppercase text-xs">Testcases:</strong> 
                <span className="text-linen">{selectedSub.testCasesPassed} / {selectedSub.testCasesTotal}</span>
              </div>
              
              <AdminFormGroup label={<><FileCode size={14} /> Mã nguồn đã nộp</>}>
                <AdminTextarea
                  value={selectedSub.code}
                  readOnly
                  className="font-mono text-xs bg-black"
                  rows={8}
                />
              </AdminFormGroup>

              {selectedSub.errorMessage && (
                <AdminFormGroup label="Thông báo lỗi (Compilation/Runtime Error)">
                  <pre className="bg-red-500/10 text-red-400 p-3 rounded-xl text-xs whitespace-pre-wrap font-mono">
                    {selectedSub.errorMessage}
                  </pre>
                </AdminFormGroup>
              )}
            </div>
          </AdminCard>
        )}

        {/* Custom run code simulator panel */}
        <AdminCard>
          <AdminHeader>Trình Thử Nghiệm Chấm Bài (Sandbox)</AdminHeader>
          <form onSubmit={handleRunTest} className="flex flex-col gap-4">
            <AdminFormGroup label="Chọn Bài Tập">
              <AdminSelect
                value={selectedProblemId}
                onChange={e => setSelectedProblemId(e.target.value)}
              >
                {problems.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </AdminSelect>
            </AdminFormGroup>

            <AdminFormGroup label="Ngôn ngữ">
              <AdminSelect
                value={testLanguage}
                onChange={e => setTestLanguage(e.target.value as any)}
              >
                <option value="cpp">C++ (g++)</option>
                <option value="java">Java (JDK)</option>
                <option value="python">Python 3</option>
              </AdminSelect>
            </AdminFormGroup>

            <AdminFormGroup label={<><FileCode size={14} /> Mã nguồn thử nghiệm</>}>
              <AdminTextarea
                placeholder="Nhập code tại đây..."
                value={testCode}
                onChange={e => setTestCode(e.target.value)}
                className="font-mono text-xs"
                rows={6}
                required
              />
            </AdminFormGroup>

            <AdminFormGroup label="Dữ liệu đầu vào tùy chỉnh (Tùy chọn)">
              <AdminTextarea
                placeholder="Dòng 1\nDòng 2"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                className="font-mono text-xs"
                rows={2}
              />
            </AdminFormGroup>

            <AdminButton type="submit" disabled={runLoading} className="mt-2">
              <Play size={14} /> {runLoading ? 'Đang chấm...' : 'Thử Nghiệm Chấm Bài'}
            </AdminButton>
          </form>

          {runResult && (
            <div className="mt-4 border-t border-charcoal pt-4 flex flex-col gap-2">
              <h4 className="text-linen text-sm font-semibold mb-2">Kết quả thử nghiệm:</h4>
              {runResult.map((res: any, index: number) => (
                <div key={index} className="bg-black border border-charcoal/50 rounded-xl p-3 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-semibold ${res.status?.id === 3 ? 'text-emerald-400' : 'text-red-400'}`}>
                      Testcase #{index + 1}: {res.status?.description || 'Done'}
                    </span>
                    <span className="text-stone">
                      {res.time}s | {res.memory} KB
                    </span>
                  </div>
                  {res.error ? (
                    <pre className="text-red-400 m-0 whitespace-pre-wrap">{res.error}</pre>
                  ) : (
                    <>
                      <div><span className="text-stone">Input:</span> <code className="text-surface-300">{res.input}</code></div>
                      <div><span className="text-stone">Output thực tế:</span> <code className="text-blue-400">{res.actualOutput}</code></div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  );
};
