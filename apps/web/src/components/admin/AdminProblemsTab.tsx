import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, FileText, Code, CheckSquare, Trash2, Tag, Watch, HardDrive } from 'lucide-react';
import { api } from '../../services/api';
import type { IProblem, ProblemDifficulty } from '@ocj/contracts';
import { AdminCard, AdminHeader, AdminInput, AdminTextarea, AdminSelect, AdminButton, AdminBadge, AdminListRow, AdminFormGroup } from './ui/AdminUI';

interface AdminProblemsTabProps {
  probTitle: string;
  setProbTitle: (val: string) => void;
  probDesc: string;
  setProbDesc: (val: string) => void;
  probDiff: ProblemDifficulty;
  setProbDiff: (val: ProblemDifficulty) => void;
  onSubmit: (e: React.FormEvent) => void;
  problems: IProblem[];
  onDelete: (id: string) => void;
}

export const AdminProblemsTab: React.FC<AdminProblemsTabProps> = ({
  probTitle,
  setProbTitle,
  probDesc,
  setProbDesc,
  probDiff,
  setProbDiff,
  onSubmit,
  problems,
  onDelete,
}) => {
  // Tags state
  const [tags, setTags] = useState<any[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [tagError, setTagError] = useState('');

  // Editing Problem state
  const [editingProblem, setEditingProblem] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<'info' | 'code' | 'testcases'>('info');

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDiff, setEditDiff] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
  const [editTimeLimit, setEditTimeLimit] = useState(2000);
  const [editMemoryLimit, setEditMemoryLimit] = useState(256);
  const [editCppCode, setEditCppCode] = useState('');
  const [editJavaCode, setEditJavaCode] = useState('');
  const [editPythonCode, setEditPythonCode] = useState('');
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([]);
  
  // Testcases management state
  const [testcases, setTestcases] = useState<any[]>([]);
  const [tcLoading, setTcLoading] = useState(false);
  const [newTcInput, setNewTcInput] = useState('');
  const [newTcOutput, setNewTcOutput] = useState('');
  const [newTcIsExample, setNewTcIsExample] = useState(false);
  const [tcError, setTcError] = useState('');
  const [tcSuccess, setTcSuccess] = useState('');

  const fetchTags = async () => {
    try {
      const res = await api.getProblemTags();
      if (res.success && res.data) {
        setTags(res.data);
      }
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setTagError('');
    if (!newTagName.trim()) return;

    try {
      const res = await api.createTag({ name: newTagName.trim() });
      if (res.success) {
        setNewTagName('');
        fetchTags();
      }
    } catch (err: any) {
      setTagError(err.message || 'Lỗi khi tạo tag.');
    }
  };

  const openEditModal = async (problem: any) => {
    setEditingProblem(problem);
    setModalTab('info');
    setEditTitle(problem.title || '');
    setEditDesc(problem.description || '');
    setEditDiff(problem.difficulty || 'EASY');
    setEditTimeLimit(problem.timeLimit || 2000);
    setEditMemoryLimit(problem.memoryLimit || 256);
    
    const codes = problem.starterCodes || {};
    setEditCppCode(codes.cpp || '');
    setEditJavaCode(codes.java || '');
    setEditPythonCode(codes.python || '');

    const selectedIds = problem.tags ? problem.tags.map((t: any) => t.id || t._id || t) : [];
    setEditSelectedTags(selectedIds);
    setTestcases([]);
    setTcError('');
    setTcSuccess('');

    // Fetch testcases for this problem
    const probId = problem.id || problem.mongo_problem_id || problem._id;
    if (probId) {
      setTcLoading(true);
      try {
        const tcRes = await api.getTestcases(probId);
        if (tcRes.success && tcRes.data) {
          setTestcases(tcRes.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải testcases:', err);
      } finally {
        setTcLoading(false);
      }
    }
  };

  const handleSaveProblemEdit = async () => {
    if (!editingProblem) return;
    const probId = editingProblem.id || editingProblem.mongo_problem_id || editingProblem._id;
    if (!probId) return;

    try {
      const res = await api.updateProblem(probId, {
        title: editTitle,
        description: editDesc,
        difficulty: editDiff,
        timeLimit: Number(editTimeLimit),
        memoryLimit: Number(editMemoryLimit),
        starterCodes: {
          cpp: editCppCode,
          java: editJavaCode,
          python: editPythonCode,
        },
        tags: editSelectedTags,
      });

      if (res.success) {
        alert('Cập nhật bài tập thành công!');
        setEditingProblem(null);
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu thông tin bài tập');
    }
  };

  const handleAddTestcase = async (e: React.FormEvent) => {
    e.preventDefault();
    setTcError('');
    setTcSuccess('');
    const probId = editingProblem?.id || editingProblem?.mongo_problem_id || editingProblem?._id;
    if (!probId) return;

    try {
      const res = await api.addTestcase(probId, {
        input: newTcInput,
        output: newTcOutput,
        isExample: newTcIsExample,
      });
      if (res.success) {
        setNewTcInput('');
        setNewTcOutput('');
        setNewTcIsExample(false);
        setTcSuccess('Đã thêm testcase mới!');
        
        // Reload testcases list
        const tcRes = await api.getTestcases(probId);
        if (tcRes.success && tcRes.data) {
          setTestcases(tcRes.data);
        }
      }
    } catch (err: any) {
      setTcError(err.message || 'Lỗi thêm testcase.');
    }
  };

  const handleDeleteTestcase = async (tcId: string) => {
    if (!window.confirm('Xóa testcase này?')) return;
    setTcError('');
    setTcSuccess('');
    try {
      const res = await api.deleteTestcase(editingProblem?.id || editingProblem?._id, tcId);
      if (res.success) {
        setTestcases(prev => prev.filter(t => t.id !== tcId && t._id !== tcId));
        setTcSuccess('Đã xóa testcase thành công.');
      }
    } catch (err: any) {
      setTcError(err.message || 'Lỗi xóa testcase.');
    }
  };

  const handleToggleTagSelection = (tagId: string) => {
    setEditSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start">
        {/* Left Side: Create Problem & Tags Management */}
        <div className="flex flex-col gap-6">
          <form onSubmit={onSubmit}>
            <AdminCard>
              <AdminHeader>Tạo Đề Bài Mới</AdminHeader>
              <div className="flex flex-col gap-4 mt-2">
                <AdminInput
                  type="text"
                  placeholder="Tên bài tập..."
                  value={probTitle}
                  onChange={(e) => setProbTitle(e.target.value)}
                  required
                />
                <AdminTextarea
                  placeholder="Mô tả đề bài..."
                  value={probDesc}
                  onChange={(e) => setProbDesc(e.target.value)}
                  required
                  rows={5}
                />
                <AdminSelect
                  value={probDiff}
                  onChange={(e: any) => setProbDiff(e.target.value)}
                >
                  <option value="EASY">Dễ (Easy)</option>
                  <option value="MEDIUM">Trung bình (Medium)</option>
                  <option value="HARD">Khó (Hard)</option>
                </AdminSelect>
                <AdminButton type="submit" className="mt-2">
                  <Plus size={16} /> Tạo bài tập
                </AdminButton>
              </div>
            </AdminCard>
          </form>

          {/* Tags management */}
          <AdminCard>
            <AdminHeader>Quản Lý Thẻ Nhãn (Tags)</AdminHeader>
            <div className="flex flex-wrap gap-2 my-2">
              {tags.map((t) => (
                <span key={t.id || t.slug} className="text-xs font-semibold px-3 py-1 rounded-full bg-ink border text-stone inline-flex items-center gap-1.5" style={{ borderColor: t.color || '#2E2E2E' }}>
                  {t.name}
                </span>
              ))}
            </div>

            <form onSubmit={handleCreateTag} className="flex gap-3">
              <AdminInput
                type="text"
                placeholder="Nhập tên tag mới..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
              <AdminButton type="submit" className="whitespace-nowrap">
                Thêm Tag
              </AdminButton>
            </form>
            {tagError && <p className="text-red-400 text-xs">{tagError}</p>}
          </AdminCard>
        </div>

        {/* Right Side: List Problems */}
        <AdminCard>
          <AdminHeader>Danh Sách Đề Bài</AdminHeader>
          <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
            {problems.map((p) => {
              const probId = p.id || p.mongo_problem_id || (p as any)._id;
              return (
                <AdminListRow key={probId}>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-sm text-linen font-body">{p.title}</span>
                    <div className="flex items-center gap-2">
                      <AdminBadge color={p.difficulty === 'HARD' ? 'red' : p.difficulty === 'MEDIUM' ? 'yellow' : 'green'}>
                        {p.difficulty}
                      </AdminBadge>
                      {p.timeLimit && (
                        <AdminBadge>{p.timeLimit} ms</AdminBadge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <AdminButton
                      variant="icon-edit"
                      onClick={() => openEditModal(p)}
                      title="Chỉnh sửa bài tập & Testcases"
                    >
                      <Edit size={14} />
                    </AdminButton>
                    <AdminButton
                      variant="icon-delete"
                      onClick={() => onDelete(probId || '')}
                      title="Xóa bài tập"
                    >
                      <Trash2 size={14} />
                    </AdminButton>
                  </div>
                </AdminListRow>
              );
            })}
          </div>
        </AdminCard>
      </div>

      {/* Edit Problem Overlay Modal */}
      {editingProblem && (
        <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-5">
          <div className="bg-washi border border-charcoal rounded-xl w-full max-w-[850px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-charcoal">
              <h3 className="text-xl font-bold text-linen font-display m-0">Chỉnh Sửa Bài Tập: {editingProblem.title}</h3>
              <button onClick={() => setEditingProblem(null)} className="bg-transparent border-none text-stone cursor-pointer transition-colors duration-200 flex items-center justify-center hover:text-linen">
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex bg-ink/50 p-1.5 border-b border-charcoal">
              <button
                className={`flex-1 bg-transparent border-none p-3 rounded-xl cursor-pointer font-semibold text-sm transition-colors duration-200 flex items-center justify-center gap-2 ${modalTab === 'info' ? 'text-vermilion bg-vermilion/10' : 'text-stone hover:text-linen hover:bg-charcoal/30'}`}
                onClick={() => setModalTab('info')}
              >
                <FileText size={16} /> Đề bài & Cấu hình
              </button>
              <button
                className={`flex-1 bg-transparent border-none p-3 rounded-xl cursor-pointer font-semibold text-sm transition-colors duration-200 flex items-center justify-center gap-2 ${modalTab === 'code' ? 'text-vermilion bg-vermilion/10' : 'text-stone hover:text-linen hover:bg-charcoal/30'}`}
                onClick={() => setModalTab('code')}
              >
                <Code size={16} /> starterCodes
              </button>
              <button
                className={`flex-1 bg-transparent border-none p-3 rounded-xl cursor-pointer font-semibold text-sm transition-colors duration-200 flex items-center justify-center gap-2 ${modalTab === 'testcases' ? 'text-vermilion bg-vermilion/10' : 'text-stone hover:text-linen hover:bg-charcoal/30'}`}
                onClick={() => setModalTab('testcases')}
              >
                <CheckSquare size={16} /> Testcases ({testcases.length})
              </button>
            </div>

            {/* Modal Content Area */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
              {modalTab === 'info' && (
                <div className="flex flex-col gap-5">
                  <AdminFormGroup label="Tên bài tập">
                    <AdminInput
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </AdminFormGroup>

                  <AdminFormGroup label="Mô tả bài tập (HTML / Markdown)">
                    <AdminTextarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={6}
                      required
                    />
                  </AdminFormGroup>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <AdminFormGroup label="Độ khó">
                      <AdminSelect
                        value={editDiff}
                        onChange={(e: any) => setEditDiff(e.target.value)}
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </AdminSelect>
                    </AdminFormGroup>

                    <AdminFormGroup label={<><Watch size={14} /> Giới hạn thời gian (ms)</>}>
                      <AdminInput
                        type="number"
                        value={editTimeLimit}
                        onChange={(e) => setEditTimeLimit(Number(e.target.value))}
                      />
                    </AdminFormGroup>

                    <AdminFormGroup label={<><HardDrive size={14} /> Giới hạn bộ nhớ (MB)</>}>
                      <AdminInput
                        type="number"
                        value={editMemoryLimit}
                        onChange={(e) => setEditMemoryLimit(Number(e.target.value))}
                      />
                    </AdminFormGroup>
                  </div>

                  {/* Assign tags */}
                  <AdminFormGroup label={<><Tag size={14} /> Gán Thẻ Nhãn (Tags)</>}>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
                      {tags.map((t) => {
                        const isChecked = editSelectedTags.includes(t.id || t._id);
                        return (
                          <label key={t.id || t.slug} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border cursor-pointer text-xs transition-colors duration-200 select-none ${isChecked ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-ink/40 border-charcoal text-stone hover:bg-charcoal/20'}`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleTagSelection(t.id || t._id)}
                              style={{ display: 'none' }}
                            />
                            {t.name}
                          </label>
                        );
                      })}
                    </div>
                  </AdminFormGroup>
                </div>
              )}

              {modalTab === 'code' && (
                <div className="flex flex-col gap-5">
                  <AdminFormGroup label="Mã nguồn C++ mẫu">
                    <AdminTextarea
                      value={editCppCode}
                      onChange={(e) => setEditCppCode(e.target.value)}
                      className="font-mono text-sm"
                      rows={5}
                      placeholder="// C++ Starter code"
                    />
                  </AdminFormGroup>

                  <AdminFormGroup label="Mã nguồn Java mẫu">
                    <AdminTextarea
                      value={editJavaCode}
                      onChange={(e) => setEditJavaCode(e.target.value)}
                      className="font-mono text-sm"
                      rows={5}
                      placeholder="// Java Starter code"
                    />
                  </AdminFormGroup>

                  <AdminFormGroup label="Mã nguồn Python mẫu">
                    <AdminTextarea
                      value={editPythonCode}
                      onChange={(e) => setEditPythonCode(e.target.value)}
                      className="font-mono text-sm"
                      rows={5}
                      placeholder="# Python Starter code"
                    />
                  </AdminFormGroup>
                </div>
              )}

              {modalTab === 'testcases' && (
                <div className="flex flex-col gap-5">
                  {/* Create Testcase Form */}
                  <form onSubmit={handleAddTestcase} className="bg-ink/40 border border-charcoal rounded-xl p-4 flex flex-col gap-4">
                    <h4 className="m-0 text-sm text-linen font-semibold font-display">Thêm Testcase Mới</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <AdminFormGroup label="Dữ liệu đầu vào (Input)">
                        <AdminTextarea
                          placeholder="Ví dụ: 2 7 11 15\n9"
                          value={newTcInput}
                          onChange={(e) => setNewTcInput(e.target.value)}
                          className="font-mono text-xs"
                          rows={3}
                          required
                        />
                      </AdminFormGroup>
                      <AdminFormGroup label="Kết quả mong muốn (Output)">
                        <AdminTextarea
                          placeholder="Ví dụ: 0 1"
                          value={newTcOutput}
                          onChange={(e) => setNewTcOutput(e.target.value)}
                          className="font-mono text-xs"
                          rows={3}
                          required
                        />
                      </AdminFormGroup>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <label className="flex items-center gap-2 text-sm text-stone cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTcIsExample}
                          onChange={(e) => setNewTcIsExample(e.target.checked)}
                          className="cursor-pointer"
                        />
                        Dùng làm Testcase mẫu (Hiển thị cho học sinh)
                      </label>
                      <AdminButton type="submit" className="py-2 px-4">
                        <Plus size={14} /> Thêm Testcase
                      </AdminButton>
                    </div>
                  </form>

                  {tcError && <div className="text-red-400 text-sm">{tcError}</div>}
                  {tcSuccess && <div className="text-emerald-400 text-sm">{tcSuccess}</div>}

                  {/* Testcases list */}
                  <div>
                    <h4 className="text-sm text-linen font-semibold mt-2 mb-3 font-display">Danh Sách Testcases Đang Có</h4>
                    {tcLoading ? (
                      <p className="text-stone text-sm">Đang tải testcases...</p>
                    ) : testcases.length === 0 ? (
                      <p className="text-stone text-sm">Chưa có testcase nào cho bài tập này.</p>
                    ) : (
                      <div className="flex flex-col gap-2.5 max-h-[280px] overflow-y-auto">
                        {testcases.map((tc, index) => {
                          const tcId = tc.id || tc._id;
                          return (
                            <div key={tcId || index} className="bg-ink/30 border border-charcoal rounded-xl p-3 flex items-start justify-between">
                              <div className="flex flex-col gap-2 flex-1">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-xl w-fit font-display tracking-wider ${tc.isExample ? 'bg-green-500/15 text-green-500' : 'bg-yellow-500/15 text-yellow-500'}`}>
                                  {tc.isExample ? 'TESTCASE MẪU' : 'TESTCASE ẨN'}
                                </span>
                                <div className="grid grid-cols-2 gap-3 font-mono text-[11px] text-stone">
                                  <div>
                                    <span>Input:</span>
                                    <div className="bg-ink border border-charcoal rounded-xl p-2 whitespace-pre-wrap max-h-[60px] overflow-y-auto text-linen">{tc.input}</div>
                                  </div>
                                  <div>
                                    <span>Output:</span>
                                    <div className="bg-ink border border-charcoal rounded-xl p-2 whitespace-pre-wrap max-h-[60px] overflow-y-auto text-linen">{tc.output}</div>
                                  </div>
                                </div>
                              </div>
                              
                              <AdminButton
                                variant="icon-delete"
                                onClick={() => handleDeleteTestcase(tcId)}
                                className="ml-3"
                                title="Xóa testcase này"
                              >
                                <Trash2 size={14} />
                              </AdminButton>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-charcoal flex justify-end gap-3 bg-ink/30">
              <AdminButton variant="secondary" onClick={() => setEditingProblem(null)}>
                Hủy
              </AdminButton>
              <AdminButton variant="primary" onClick={handleSaveProblemEdit}>
                Lưu Thay Đổi
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
