import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { submissionRepository } from '../app/api/client';
import { SubmissionDetailView } from './SubmissionDetailView';

vi.mock('../app/api/client', () => ({
  submissionRepository: { getSubmission: vi.fn() },
}));

const submission = {
  id: 'sub-1842',
  problemId: 'problem-1',
  userId: 'user-1',
  code: 'print("hello")',
  language: 'python' as const,
  status: 'ACCEPTED' as const,
  testcaseSetVersion: 7,
  testCasesPassed: 1,
  testCasesTotal: 2,
  exampleTestcases: [{ position: 1, input: '2 3', output: '5' }],
  caseResults: [{ position: 1, status: 'ACCEPTED' as const, executionTime: 42, memoryUsed: 8 }],
  problem: { id: 'problem-1', title: 'Two Sum', slug: 'two-sum', difficulty: 'EASY' as const },
};

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/submissions/sub-1842']}>
        <Routes><Route path="/submissions/:submissionId" element={<SubmissionDetailView />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SubmissionDetailView', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows pinned testcase version and public testcase data, then copies the source', async () => {
    vi.mocked(submissionRepository.getSubmission).mockResolvedValue(submission);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    renderView();

    expect(await screen.findByText('Testcase version 7')).toBeInTheDocument();
    expect(screen.getByText('2 3')).toBeInTheDocument();
    expect(screen.getByText('5', { selector: 'pre' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy source' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('print("hello")'));
    expect(await screen.findByRole('button', { name: 'Source copied' })).toBeInTheDocument();
  });
});
