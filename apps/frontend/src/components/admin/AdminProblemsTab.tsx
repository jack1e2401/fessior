import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowLeft, ChevronLeft, ChevronRight, FileArchive, Plus, Search, Upload } from 'lucide-react';
import type { CreateProblemRequest, IProblem, ProblemDifficulty, ProblemListItem, TestcaseImportFailure, TestcaseImportResult, TestcaseSetSummary } from '@ocj/contracts';
import { problemRepository } from '../../app/api/client';
import { ApiError, ApiNetworkError } from '../../lib/api/types';
import { normalizeStatementForEditing } from '../../lib/statementMarkdown';
import { ProblemStatementEditor } from './ProblemStatementEditor';

const PAGE_SIZE = 8;

type ProblemForm = {
  title: string;
  description: string;
  difficulty: ProblemDifficulty;
  timeLimit: number;
  memoryLimit: number;
  starterCodes: { cpp: string; java: string; python: string };
};

const emptyForm: ProblemForm = {
  title: '',
  description: '',
  difficulty: 'EASY',
  timeLimit: 2000,
  memoryLimit: 256,
  starterCodes: { cpp: '', java: '', python: '' },
};

const fieldClass = 'w-full rounded-md border border-charcoal bg-ink px-3 py-2.5 text-sm text-linen outline-none placeholder:text-stone/70 focus:border-vermilion focus:ring-1 focus:ring-vermilion';
const labelClass = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone';
const validationChecks = [
  ['archive_structure', 'Archive structure'],
  ['safe_paths', 'Safe archive paths'],
  ['safe_entries', 'No symlinks or duplicate entries'],
  ['manifest', 'Manifest schema'],
  ['testcase_pairs', 'Input/output pairs'],
  ['resource_limits', 'Resource limits'],
] as const;

type ImportState =
  | { status: 'idle' }
  | { status: 'uploading' | 'processing'; percent: number }
  | { status: 'success'; result: TestcaseImportResult; fileName: string; fileSize: number; refreshError?: boolean }
  | { status: 'rejected'; failure: TestcaseImportFailure; message: string; fileName: string }
  | { status: 'request-rejected'; message: string; fileName: string }
  | { status: 'unknown'; fileName: string; uploaded: boolean; refreshed?: boolean };

function problemToForm(problem: IProblem): ProblemForm {
  return {
    title: problem.title,
    description: normalizeStatementForEditing(problem.description),
    difficulty: problem.difficulty,
    timeLimit: problem.timeLimit ?? 2000,
    memoryLimit: problem.memoryLimit ?? 256,
    starterCodes: {
      cpp: problem.starterCodes?.cpp ?? '',
      java: problem.starterCodes?.java ?? '',
      python: problem.starterCodes?.python ?? '',
    },
  };
}

function readableError(error: unknown) {
  return error instanceof ApiError ? error.message : 'Không thể tải dữ liệu. Thử lại sau.';
}

function shortChecksum(checksum: string | null) {
  return checksum ? `${checksum.slice(0, 12)}…` : 'Tạo từ chỉnh sửa thủ công';
}

function importFailure(error: unknown): TestcaseImportFailure | null {
  if (!(error instanceof ApiError) || !error.payload || typeof error.payload !== 'object') return null;
  const details = (error.payload as { error?: unknown }).error;
  if (!details || typeof details !== 'object') return null;
  const failure = details as TestcaseImportFailure;
  if (!failure.stage || !failure.code || !['UNCHANGED', 'UNKNOWN'].includes(failure.databaseState)) return null;
  return failure;
}

function checkForFailure(failure: TestcaseImportFailure) {
  if (failure.stage === 'manifest') return 'manifest';
  if (failure.stage === 'testcase_pairs') return 'testcase_pairs';
  if (failure.stage === 'resource_limits') return 'resource_limits';
  if (failure.stage === 'activation') return 'activation';
  if (failure.code === 'PATH_TRAVERSAL') return 'safe_paths';
  if (failure.code === 'SYMLINK' || failure.code === 'DUPLICATE_ENTRY' || failure.code === 'UNSUPPORTED_ENTRY') return 'safe_entries';
  return 'archive_structure';
}

export function AdminProblemsTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [problemTotal, setProblemTotal] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [selectedProblem, setSelectedProblem] = useState<IProblem | null>(null);
  const [versions, setVersions] = useState<TestcaseSetSummary[]>([]);
  const [activeExamples, setActiveExamples] = useState<Awaited<ReturnType<typeof problemRepository.getTestcases>>>([]);
  const [examplesLoadedFor, setExamplesLoadedFor] = useState('');
  const [loadingExamples, setLoadingExamples] = useState(false);
  const [examplesError, setExamplesError] = useState('');
  const [activeExampleIndex, setActiveExampleIndex] = useState(0);
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [activatingVersion, setActivatingVersion] = useState(false);
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [addingSample, setAddingSample] = useState(false);
  const [starterLanguageIndex, setStarterLanguageIndex] = useState(0);
  const [form, setForm] = useState<ProblemForm>(emptyForm);
  const [creating, setCreating] = useState(false);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [savingProblem, setSavingProblem] = useState(false);
  const [importState, setImportState] = useState<ImportState>({ status: 'idle' });
  const [uploadPercent, setUploadPercent] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [problemError, setProblemError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [notice, setNotice] = useState('');
  const examplesRequest = useRef(0);
  const samplesDisclosureOpen = useRef(false);

  const pageCount = Math.max(1, Math.ceil(problemTotal / PAGE_SIZE));
  const activeVersion = useMemo(() => versions.find((version) => version.active) ?? null, [versions]);

  const loadProblems = useCallback(async (requestedPage = page, requestedSearch = search) => {
    setLoadingProblems(true);
    setProblemError('');
    try {
      const result = await problemRepository.getProblems({ page: requestedPage, limit: PAGE_SIZE, search: requestedSearch });
      setProblems(result.items);
      setProblemTotal(result.total);
      setSelectedId((currentId) => result.items.some((item) => (item.id ?? item.slug) === currentId)
        ? currentId
        : result.items[0]?.id ?? result.items[0]?.slug ?? '');
    } catch (error) {
      setProblemError(readableError(error));
    } finally {
      setLoadingProblems(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProblems(page, search), 180);
    return () => window.clearTimeout(timer);
  }, [loadProblems]);

  useEffect(() => {
    if (!selectedId || creating) {
      examplesRequest.current += 1;
      setSelectedProblem(null);
      setVersions([]);
      setSelectedVersionId('');
      setActiveExamples([]);
      setExamplesLoadedFor('');
      setActiveExampleIndex(0);
      return;
    }

    let cancelled = false;
    examplesRequest.current += 1;
    setActiveExamples([]);
    setExamplesLoadedFor('');
    setLoadingExamples(false);
    setExamplesError('');
    setActiveExampleIndex(0);
    setLoadingDetails(true);
    setDetailError('');
    Promise.all([
      problemRepository.getProblem(selectedId),
      problemRepository.getTestcaseSets(selectedId, { page: 1, limit: 20 }),
    ]).then(([problem, versionPage]) => {
      if (cancelled) return;
      setSelectedProblem(problem);
      setForm(problemToForm(problem));
      setVersions(versionPage.items);
      setSelectedVersionId(versionPage.items.find((version) => version.active)?.id ?? '');
    }).catch((error: unknown) => {
      if (!cancelled) setDetailError(readableError(error));
    }).finally(() => {
      if (!cancelled) setLoadingDetails(false);
    });
    return () => { cancelled = true; };
  }, [selectedId, creating]);

  async function loadActiveExamples(problemId: string, force = false) {
    if (!force && (examplesLoadedFor === problemId || loadingExamples)) return;
    const requestId = ++examplesRequest.current;
    setLoadingExamples(true);
    setExamplesError('');
    try {
      const examples = await problemRepository.getTestcases(problemId, true);
      if (requestId !== examplesRequest.current) return;
      setActiveExamples(examples);
      setExamplesLoadedFor(problemId);
      setActiveExampleIndex(0);
    } catch (error) {
      if (requestId === examplesRequest.current) setExamplesError(readableError(error));
    } finally {
      if (requestId === examplesRequest.current) setLoadingExamples(false);
    }
  }

  async function activateSelectedVersion() {
    if (!selectedProblem || !selectedVersionId) return;
    setActivatingVersion(true);
    setDetailError('');
    setNotice('');
    try {
      const problemId = selectedProblem.id ?? selectedId;
      await problemRepository.activateTestcaseSet(problemId, selectedVersionId);
      const refreshedVersions = await problemRepository.getTestcaseSets(problemId, { page: 1, limit: 20 });
      setVersions(refreshedVersions.items);
      setSelectedVersionId(selectedVersionId);
      setActiveExamples([]);
      setExamplesLoadedFor('');
      setActiveExampleIndex(0);
      if (samplesDisclosureOpen.current) await loadActiveExamples(problemId, true);
      const active = refreshedVersions.items.find((version) => version.active);
      setNotice(active ? `Đã kích hoạt testcase version ${active.version}.` : 'Đã cập nhật testcase version.');
    } catch (error) {
      setDetailError(readableError(error));
    } finally {
      setActivatingVersion(false);
    }
  }

  async function addSampleTestcase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProblem) return;
    setAddingSample(true);
    setDetailError('');
    setNotice('');
    try {
      const problemId = selectedProblem.id ?? selectedId;
      await problemRepository.createTestcase(problemId, {
        input: sampleInput,
        output: sampleOutput,
        isExample: true,
      });
      const refreshedVersions = await problemRepository.getTestcaseSets(problemId, { page: 1, limit: 20 });
      setVersions(refreshedVersions.items);
      setSelectedVersionId(refreshedVersions.items.find((version) => version.active)?.id ?? '');
      setActiveExamples([]);
      setExamplesLoadedFor('');
      setActiveExampleIndex(0);
      setSampleInput('');
      setSampleOutput('');
      await loadActiveExamples(problemId, true);
      setNotice(`Đã thêm testcase mẫu và tạo version ${refreshedVersions.items.find((version) => version.active)?.version ?? ''}.`);
    } catch (error) {
      setDetailError(readableError(error));
    } finally {
      setAddingSample(false);
    }
  }

  function beginCreate() {
    examplesRequest.current += 1;
    samplesDisclosureOpen.current = false;
    setCreating(true);
    setSelectedId('');
    setSelectedFile(null);
    setImportState({ status: 'idle' });
    setForm(emptyForm);
    setNotice('');
  }

  function selectProblem(problemId: string) {
    examplesRequest.current += 1;
    samplesDisclosureOpen.current = false;
    setCreating(false);
    setSelectedFile(null);
    setImportState({ status: 'idle' });
    setSelectedId(problemId);
    setNotice('');
  }

  async function saveProblem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProblem(true);
    setDetailError('');
    try {
      const payload: CreateProblemRequest = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
      };
      const saved = creating
        ? await problemRepository.createProblem(payload)
        : await problemRepository.updateProblem(selectedId, payload);
      setCreating(false);
      setSelectedId(saved.id ?? '');
      setSelectedProblem(saved);
      setForm(problemToForm(saved));
      setNotice(creating ? 'Đã tạo bài tập.' : 'Đã lưu thay đổi.');
      await loadProblems(page, search);
    } catch (error) {
      setDetailError(readableError(error));
    } finally {
      setSavingProblem(false);
    }
  }

  function chooseArchive(file?: File) {
    if (importState.status === 'uploading' || importState.status === 'processing') return;
    setImportState({ status: 'idle' });
    setSelectedFile(null);
    setNotice('');
    setDetailError('');
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setDetailError('Chọn file .zip chứa manifest.json và thư mục cases/.');
      return;
    }
    setSelectedFile(file);
  }

  async function importArchive() {
    if (!selectedProblem || !selectedFile) return;
    const problemId = selectedProblem.id ?? selectedId;
    const file = selectedFile;
    setUploadPercent(0);
    setImportState({ status: 'uploading', percent: 0 });
    setDetailError('');
    setNotice('');
    try {
      const imported = await problemRepository.importTestcaseSet(
        problemId,
        file,
        (percent) => setUploadPercent(percent),
        () => setImportState({ status: 'processing', percent: 100 }),
      );
      setImportState({ status: 'success', result: imported, fileName: file.name, fileSize: file.size });
      setSelectedFile(null);
      setExamplesLoadedFor('');
      setActiveExamples([]);
      setActiveExampleIndex(0);
      try {
        const refreshedVersions = await problemRepository.getTestcaseSets(problemId, { page: 1, limit: 20 });
        setVersions(refreshedVersions.items);
        setSelectedVersionId(refreshedVersions.items.find((version) => version.active)?.id ?? '');
      } catch {
        setImportState({ status: 'success', result: imported, fileName: file.name, fileSize: file.size, refreshError: true });
      }
    } catch (error) {
      const failure = importFailure(error);
      if (failure?.databaseState === 'UNCHANGED') {
        setImportState({ status: 'rejected', failure, message: error instanceof ApiError ? error.message : 'Archive rejected', fileName: file.name });
      } else if (error instanceof ApiError && error.statusCode !== undefined && error.statusCode >= 400 && error.statusCode < 500) {
        setImportState({ status: 'request-rejected', message: error.message, fileName: file.name });
      } else if (error instanceof ApiNetworkError || failure?.databaseState === 'UNKNOWN' || error instanceof ApiError) {
        setSelectedFile(null);
        setImportState({ status: 'unknown', fileName: file.name, uploaded: error instanceof ApiNetworkError ? error.uploadCompleted : true });
      } else {
        setSelectedFile(null);
        setImportState({ status: 'unknown', fileName: file.name, uploaded: true });
      }
    } finally {
      setUploadPercent(0);
    }
  }

  async function refreshVersionsAfterUnknownImport() {
    if (!selectedProblem) return;
    try {
      const refreshed = await problemRepository.getTestcaseSets(selectedProblem.id ?? selectedId, { page: 1, limit: 20 });
      setVersions(refreshed.items);
      setSelectedVersionId(refreshed.items.find((version) => version.active)?.id ?? '');
      setImportState((current) => current.status === 'unknown' ? { ...current, refreshed: true } : current);
      setImportState((current) => current.status === 'success' ? { ...current, refreshError: false } : current);
    } catch (error) {
      setDetailError(readableError(error));
    }
  }

  function updateForm<K extends keyof ProblemForm>(key: K, value: ProblemForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="grid gap-7 2xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="flex min-h-[520px] flex-col border border-charcoal bg-washi">
        <div className="border-b border-charcoal p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="m-0 font-display text-sm font-bold text-linen">Bài tập</h2>
              <p className="mb-0 mt-1 text-xs text-stone">{problemTotal} bài trong hệ thống</p>
            </div>
            <button type="button" onClick={beginCreate} className="inline-flex items-center gap-1.5 border border-vermilion px-2.5 py-2 text-xs font-semibold text-vermilion transition-colors hover:bg-vermilion hover:text-ink">
              <Plus size={14} /> Tạo bài
            </button>
          </div>
          <label className="relative block">
            <span className="sr-only">Tìm bài tập</span>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
            <input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Tìm bài tập..." className={`${fieldClass} pl-9`} />
          </label>
        </div>

        <div className="flex-1 divide-y divide-charcoal/70">
          {loadingProblems ? <p className="p-4 text-sm text-stone">Đang tải danh sách...</p> : null}
          {!loadingProblems && problemError ? <div className="p-4 text-sm text-rose-300"><p>{problemError}</p><button type="button" onClick={() => void loadProblems()} className="underline">Thử lại</button></div> : null}
          {!loadingProblems && !problemError && problems.length === 0 ? <p className="p-4 text-sm text-stone">Không tìm thấy bài tập.</p> : null}
          {problems.map((problem) => {
            const problemId = problem.id ?? problem.slug;
            const isSelected = !creating && selectedId === problemId;
            return (
              <button key={problemId} type="button" onClick={() => selectProblem(problemId)} className={`block w-full border-l-2 px-4 py-3 text-left transition-colors hover:bg-ink/60 ${isSelected ? 'border-vermilion bg-ink/50' : 'border-transparent'}`}>
                <span className="block truncate text-sm font-semibold text-linen">{problem.title}</span>
                  <span className="mt-1 flex items-center gap-2 text-[11px] text-stone">
                  <span>{problem.difficulty}</span>{problem.acceptanceRate !== undefined ? <><span aria-hidden="true">·</span><span>{problem.acceptanceRate}% AC</span></> : null}
                </span>
              </button>
            );
          })}
        </div>

        <footer className="flex items-center justify-between border-t border-charcoal px-3 py-2 text-xs text-stone">
          <span>Trang {page} / {pageCount}</span>
          <div className="flex gap-1">
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Trang trước" className="border border-charcoal p-1.5 disabled:opacity-40"><ChevronLeft size={14} /></button>
            <button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)} aria-label="Trang sau" className="border border-charcoal p-1.5 disabled:opacity-40"><ChevronRight size={14} /></button>
          </div>
        </footer>
      </aside>

      <div className="min-w-0 space-y-5">
        <section className="border border-charcoal bg-washi">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal px-5 py-4">
            <div className="flex items-center gap-3">
              {creating ? <button type="button" onClick={() => setCreating(false)} className="border border-charcoal p-2 text-stone hover:text-linen" aria-label="Quay lại danh sách"><ArrowLeft size={15} /></button> : null}
              <div>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-vermilion">01 · Problem</p>
                <h2 className="mb-0 mt-1 font-display text-base font-bold text-linen">{creating ? 'Tạo bài tập' : selectedProblem?.title ?? 'Chọn bài tập'}</h2>
              </div>
            </div>
            {!creating && selectedProblem ? <span className="text-xs text-stone">{selectedProblem.slug}</span> : null}
          </header>

          {loadingDetails && !creating ? <p className="p-5 text-sm text-stone">Đang tải cấu hình bài...</p> : null}
          {!loadingDetails && !creating && !selectedProblem && !detailError ? <p className="p-5 text-sm text-stone">Chọn bài ở danh sách bên trái để chỉnh statement, giới hạn chạy và testcase.</p> : null}
          {detailError ? <div role="alert" className="mx-5 mt-4 border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{detailError}</div> : null}
          {notice ? <div role="status" className="mx-5 mt-4 border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</div> : null}

          {(creating || selectedProblem) && (!loadingDetails || creating) ? (
            <form onSubmit={saveProblem} className="grid gap-x-6 gap-y-6 p-6 lg:grid-cols-2 2xl:p-8">
              <label className="lg:col-span-2"><span className={labelClass}>Tên bài</span><input required maxLength={120} value={form.title} onChange={(event) => updateForm('title', event.target.value)} className={fieldClass} placeholder="Ví dụ: Maximum Pair Sum" /></label>
              <div className="lg:col-span-2"><span className={labelClass}>Problem statement</span><ProblemStatementEditor value={form.description} onChange={(value) => updateForm('description', value)} /></div>
              <label><span className={labelClass}>Độ khó</span><select value={form.difficulty} onChange={(event) => updateForm('difficulty', event.target.value as ProblemDifficulty)} className={fieldClass}><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></label>
              <div className="grid grid-cols-2 gap-3">
                <label><span className={labelClass}>CPU time · ms</span><input type="number" min={100} max={10000} required value={form.timeLimit} onChange={(event) => updateForm('timeLimit', Number(event.target.value))} className={fieldClass} /></label>
                <label><span className={labelClass}>Memory · MiB</span><input type="number" min={16} max={1024} required value={form.memoryLimit} onChange={(event) => updateForm('memoryLimit', Number(event.target.value))} className={fieldClass} /></label>
              </div>
              <details className="lg:col-span-2">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone"><ArrowDown size={14} /> Starter code</summary>
                <div className="mt-4 max-w-6xl">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone">{(['cpp', 'java', 'python'] as const)[starterLanguageIndex]}</span>
                    <div className="flex items-center gap-2 text-xs text-stone"><span>{starterLanguageIndex + 1} / 3</span><button type="button" aria-label="Ngôn ngữ trước" onClick={() => setStarterLanguageIndex((index) => (index + 2) % 3)} className="border border-charcoal p-1.5 hover:text-linen"><ChevronLeft size={15} /></button><button type="button" aria-label="Ngôn ngữ tiếp theo" onClick={() => setStarterLanguageIndex((index) => (index + 1) % 3)} className="border border-charcoal p-1.5 hover:text-linen"><ChevronRight size={15} /></button></div>
                  </div>
                  {(['cpp', 'java', 'python'] as const).map((language, index) => index === starterLanguageIndex ? <label key={language}><span className="sr-only">{language}</span><textarea aria-label={language} rows={9} value={form.starterCodes[language]} onChange={(event) => updateForm('starterCodes', { ...form.starterCodes, [language]: event.target.value })} className={`${fieldClass} font-mono text-xs`} /></label> : null)}
                </div>
              </details>
              <div className="flex justify-end border-t border-charcoal pt-4 lg:col-span-2">
                <button disabled={savingProblem} type="submit" className="inline-flex items-center gap-2 bg-vermilion px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-vermilion-hover disabled:opacity-50">{creating ? <Plus size={15} /> : null}{savingProblem ? 'Đang lưu...' : creating ? 'Tạo bài tập' : 'Lưu cấu hình'}</button>
              </div>
            </form>
          ) : null}
        </section>

        {!creating && selectedProblem ? (
          <section className="border border-charcoal bg-washi">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal px-5 py-4">
              <div>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-vermilion">01 · Versioned tests</p>
                <h2 className="mb-0 mt-1 font-display text-base font-bold text-linen">Testcase sets</h2>
              </div>
              {activeVersion ? <span className="border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-300">ACTIVE · v{activeVersion.version}</span> : <span className="border border-amber-500/30 px-2.5 py-1 text-xs text-amber-200">Chưa có testcase set</span>}
            </header>

            <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <div className="mb-4 grid gap-3 border border-charcoal bg-ink/60 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <label><span className={labelClass}>Chọn version testcase</span><select aria-label="Chọn version testcase" value={selectedVersionId} onChange={(event) => setSelectedVersionId(event.target.value)} className={fieldClass}><option value="" disabled>Chưa có version</option>{versions.map((version) => <option key={version.id} value={version.id}>v{version.version}{version.active ? ' · đang hoạt động' : ''} · {version.testcaseCount} cases</option>)}</select></label>
                  <button type="button" disabled={!selectedVersionId || versions.find((version) => version.id === selectedVersionId)?.active || activatingVersion} onClick={() => void activateSelectedVersion()} className="bg-vermilion px-4 py-2.5 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-40">{activatingVersion ? 'Đang kích hoạt…' : 'Kích hoạt version'}</button>
                </div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="m-0 text-sm font-semibold text-linen">Các phiên bản đã import</h3>
                  <span className="text-xs text-stone">Tối đa 20 version gần nhất</span>
                </div>
                {versions.length ? <div className="divide-y divide-charcoal border-y border-charcoal">
                  {versions.map((version) => <div key={version.id} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="min-w-0"><div className="flex items-center gap-2 text-sm font-semibold text-linen"><span>Version {version.version}</span>{version.active ? <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Active</span> : null}</div><p className="mb-0 mt-1 truncate font-mono text-[10px] text-stone" title={version.checksum ?? undefined}>{shortChecksum(version.checksum)}</p></div>
                    <div className="text-xs text-stone">{version.exampleCount} public · {version.testcaseCount - version.exampleCount} hidden</div>
                  </div>)}
                </div> : <p className="border-y border-charcoal py-4 text-sm text-stone">Import một ZIP hợp lệ để tạo version đầu tiên.</p>}
                <details className="mt-5 border border-charcoal px-4 py-4" onToggle={(event) => {
                  const isOpen = event.currentTarget.open;
                  samplesDisclosureOpen.current = isOpen;
                  const problemId = selectedProblem.id ?? selectedId;
                  if (isOpen && examplesLoadedFor !== problemId) void loadActiveExamples(problemId);
                }}>
                  <summary className="cursor-pointer text-sm font-semibold text-linen">Testcase mẫu · version active v{activeVersion?.version ?? '—'}{examplesLoadedFor === (selectedProblem.id ?? selectedId) ? ` · ${activeExamples.length} cases` : ''}</summary>
                  {loadingExamples ? <p className="mb-0 mt-4 text-sm text-stone">Đang tải testcase mẫu…</p> : null}
                  {examplesError ? <div role="alert" className="mt-4 text-sm text-rose-200"><p>{examplesError}</p><button type="button" onClick={() => void loadActiveExamples(selectedProblem.id ?? selectedId, true)} className="underline">Thử lại</button></div> : null}
                  {!loadingExamples && !examplesError && examplesLoadedFor === (selectedProblem.id ?? selectedId) && activeExamples.length ? <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-stone"><span>Ví dụ {activeExampleIndex + 1} / {activeExamples.length}</span><div className="flex gap-2"><button type="button" disabled={activeExampleIndex === 0} onClick={() => setActiveExampleIndex((index) => index - 1)} aria-label="Testcase trước" className="border border-charcoal px-2 py-1 disabled:opacity-40"><ChevronLeft size={14} /></button><button type="button" disabled={activeExampleIndex >= activeExamples.length - 1} onClick={() => setActiveExampleIndex((index) => index + 1)} aria-label="Testcase tiếp" className="border border-charcoal px-2 py-1 disabled:opacity-40"><ChevronRight size={14} /></button></div></div>
                    <div className="grid gap-4 lg:grid-cols-2"><div><p className="m-0 text-[10px] uppercase tracking-wider text-stone">Input</p><pre className="mt-2 max-h-48 min-h-24 overflow-auto whitespace-pre-wrap border border-charcoal bg-ink p-3 font-mono text-xs text-linen">{activeExamples[activeExampleIndex].input}</pre></div><div><p className="m-0 text-[10px] uppercase tracking-wider text-stone">Expected output</p><pre className="mt-2 max-h-48 min-h-24 overflow-auto whitespace-pre-wrap border border-charcoal bg-ink p-3 font-mono text-xs text-linen">{activeExamples[activeExampleIndex].output}</pre></div></div>
                  </div> : null}
                  {!loadingExamples && !examplesError && examplesLoadedFor === (selectedProblem.id ?? selectedId) && activeExamples.length === 0 ? <p className="mb-0 mt-4 text-sm text-stone">Version active chưa có testcase mẫu.</p> : null}
                  <form onSubmit={addSampleTestcase} className="mt-5 grid gap-3 border-t border-charcoal pt-4">
                    <h3 className="m-0 text-sm font-semibold text-linen">Thêm testcase mẫu</h3>
                    <p className="m-0 text-xs leading-5 text-stone">Testcase mới sẽ tạo version kế tiếp và kích hoạt version đó; các version cũ được giữ nguyên.</p>
                    <div className="grid gap-3 lg:grid-cols-2"><label><span className={labelClass}>Input</span><textarea required aria-label="Input testcase mẫu" value={sampleInput} onChange={(event) => setSampleInput(event.target.value)} rows={4} className={`${fieldClass} font-mono text-xs`} /></label><label><span className={labelClass}>Expected output</span><textarea required aria-label="Expected output testcase mẫu" value={sampleOutput} onChange={(event) => setSampleOutput(event.target.value)} rows={4} className={`${fieldClass} font-mono text-xs`} /></label></div>
                    <div className="flex justify-end"><button type="submit" disabled={addingSample} className="bg-vermilion px-4 py-2 text-sm font-bold text-ink disabled:opacity-50">{addingSample ? 'Đang thêm…' : 'Thêm testcase mẫu'}</button></div>
                  </form>
                </details>
              </div>

              <div className="border border-charcoal bg-ink p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-linen"><FileArchive size={16} className="text-vermilion" /> Import ZIP</div>
                <label className={`mb-3 flex min-h-24 flex-col items-center justify-center border border-dashed border-charcoal px-3 py-4 text-center transition-colors ${importState.status === 'uploading' || importState.status === 'processing' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-vermilion'}`}>
                  <Upload size={17} className="mb-2 text-stone" />
                  <span className="max-w-full truncate text-xs text-linen">{selectedFile?.name ?? 'Chọn testcase ZIP'}</span>
                  <span className="mt-1 text-[10px] text-stone">Tối đa 25 MiB</span>
                  <input type="file" accept=".zip,application/zip" disabled={importState.status === 'uploading' || importState.status === 'processing'} className="sr-only" onChange={(event) => { chooseArchive(event.target.files?.[0]); event.target.value = ''; }} />
                </label>
                <button type="button" disabled={!selectedFile || importState.status === 'uploading' || importState.status === 'processing'} onClick={() => void importArchive()} className="w-full bg-vermilion px-3 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-vermilion-hover disabled:cursor-not-allowed disabled:opacity-40">
                  {importState.status === 'uploading' || importState.status === 'processing' ? 'Đang import…' : 'Import & kích hoạt version'}
                </button>
                {importState.status !== 'idle' ? <section className="mt-4 border border-charcoal bg-washi p-3 text-xs" aria-live="polite">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="m-0 truncate font-semibold text-linen">{importState.status === 'success' || importState.status === 'rejected' || importState.status === 'request-rejected' || importState.status === 'unknown' ? importState.fileName : selectedFile?.name}</p><p className="mb-0 mt-1 text-stone">{importState.status === 'success' ? `${(importState.fileSize / (1024 * 1024)).toFixed(2)} MiB` : selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MiB` : ''}</p></div>
                    {importState.status === 'success' ? <span className="shrink-0 font-bold text-emerald-300">IMPORT SUCCESSFUL</span> : null}
                    {importState.status === 'rejected' ? <span className="shrink-0 font-bold text-rose-300">ARCHIVE REJECTED</span> : null}
                    {importState.status === 'request-rejected' ? <span className="shrink-0 font-bold text-rose-300">REQUEST REJECTED</span> : null}
                    {importState.status === 'unknown' ? <span className="shrink-0 font-bold text-amber-200">Result unknown</span> : null}
                  </div>
                  {importState.status === 'uploading' ? <div>
                    <div className="mb-1 flex justify-between text-stone"><span>Uploading</span><span>{uploadPercent}%</span></div>
                    <div className="h-1.5 overflow-hidden bg-charcoal"><div className="h-full bg-vermilion transition-[width] duration-150" style={{ width: `${uploadPercent}%` }} /></div>
                  </div> : null}
                  {importState.status === 'processing' ? <p className="mb-0 text-stone">✓ Upload completed · Backend validation and activation in progress…</p> : null}
                  {importState.status === 'success' ? <>
                    <p className="mb-0 text-emerald-300">✓ Upload completed</p>
                    <h3 className="mb-1 mt-4 text-[10px] font-bold uppercase tracking-widest text-stone">Validation</h3>
                    <ul className="m-0 list-none space-y-1 p-0">{validationChecks.map(([, label]) => <li key={label} className="text-emerald-300">✓ {label}</li>)}</ul>
                    <h3 className="mb-1 mt-4 text-[10px] font-bold uppercase tracking-widest text-stone">Activation</h3>
                    <ul className="m-0 list-none space-y-1 p-0"><li className="text-emerald-300">✓ Database transaction committed</li><li className="text-emerald-300">✓ Testcase set v{importState.result.version} activated</li></ul>
                    <p className="mb-0 mt-3 text-stone">{importState.result.testcaseCount} testcases · SHA-256 <code className="text-linen">{importState.result.checksum.slice(0, 12)}…</code></p>
                    {importState.refreshError ? <div className="mt-3 text-amber-200"><p className="mb-2">Import succeeded, but testcase versions could not be refreshed.</p><button type="button" onClick={() => void refreshVersionsAfterUnknownImport()} className="border border-charcoal px-3 py-2 font-semibold text-linen hover:border-vermilion">Refresh testcase versions</button></div> : null}
                  </> : null}
                  {importState.status === 'request-rejected' ? <p className="mb-0 mt-3 text-rose-200">Request rejected: {importState.message}</p> : null}
                  {importState.status === 'rejected' ? <>
                    {importState.failure.stage === 'upload' ? <p className="mb-0 mt-3 text-rose-300">✕ Upload request</p> : <p className="mb-0 text-emerald-300">✓ Upload completed</p>}
                    <h3 className="mb-1 mt-4 text-[10px] font-bold uppercase tracking-widest text-stone">Validation</h3>
                    <ul className="m-0 list-none space-y-1 p-0">{validationChecks.map(([id, label]) => {
                      const complete = importState.failure.completedSteps?.includes(id);
                      const failed = checkForFailure(importState.failure) === id;
                      return <li key={id} className={complete ? 'text-emerald-300' : failed ? 'text-rose-300' : 'text-stone'}>{complete ? '✓' : failed ? '✕' : '○'} {label}</li>;
                    })}</ul>
                    <h3 className="mb-1 mt-4 text-[10px] font-bold uppercase tracking-widest text-stone">Activation</h3>
                    <ul className="m-0 list-none space-y-1 p-0"><li className={importState.failure.code === 'ACTIVATION_CONFLICT' ? 'text-rose-300' : 'text-stone'}>{importState.failure.code === 'ACTIVATION_CONFLICT' ? '✕' : '○'} Database transaction</li><li className="text-stone">○ Version activation</li></ul>
                    <p className="mb-0 mt-3 font-mono text-stone">{importState.failure.stage}</p>
                    <p className="mb-0 mt-1 font-mono font-bold text-rose-200">{importState.failure.code}</p>
                    {importState.failure.entry ? <p className="mb-0 mt-1 break-all font-mono text-stone">{importState.failure.entry}</p> : null}
                    <p className="mb-0 mt-3 text-stone">{importState.message}</p>
                    {importState.failure.databaseState === 'UNCHANGED' ? <p className="mb-0 mt-1 text-stone">Database unchanged.</p> : null}
                  </> : null}
                  {importState.status === 'unknown' ? <>
                    {importState.uploaded ? <p className="mb-0 mt-3 text-emerald-300">✓ Upload completed</p> : null}
                    <p className="mb-0 mt-3 leading-5 text-stone">{importState.uploaded
                      ? 'The archive was uploaded, but the connection was lost before the server confirmed the result.'
                      : 'The connection was lost before the server confirmed the import result.'}</p>
                    {importState.refreshed ? <p className="mb-0 mt-2 text-stone">Testcase versions refreshed. Review the active version before importing again.</p> : null}
                    <button type="button" onClick={() => void refreshVersionsAfterUnknownImport()} className="mt-3 border border-charcoal px-3 py-2 font-semibold text-linen hover:border-vermilion">Refresh testcase versions</button>
                  </> : null}
                </section> : null}
                <details className="mt-4 text-xs text-stone">
                  <summary className="cursor-pointer select-none">Định dạng ZIP</summary>
                  <pre className="mt-2 overflow-x-auto border border-charcoal bg-washi p-2 font-mono text-[10px] leading-5 text-linen">manifest.json{`\n`}cases/001.in{`\n`}cases/001.out</pre>
                  <p className="mb-0 mt-2 leading-5">Manifest khai báo từng cặp input/output và đánh dấu testcase mẫu. ZIP mới tạo version mới; submission cũ tiếp tục dùng version đã ghim.</p>
                </details>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
