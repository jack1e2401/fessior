import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminProblemsTab } from './AdminProblemsTab';
import { ApiNetworkError } from '../../lib/api/types';

const repositories = vi.hoisted(() => ({
  getProblems: vi.fn(),
  getProblem: vi.fn(),
  getTestcaseSets: vi.fn(),
  getTestcases: vi.fn(),
  importTestcaseSet: vi.fn(),
  createTestcase: vi.fn(),
  activateTestcaseSet: vi.fn(),
}));

vi.mock('../../app/api/client', () => ({ problemRepository: repositories }));

describe('AdminProblemsTab testcase sample loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositories.getProblems.mockResolvedValue({ total: 1, page: 1, limit: 8, items: [{ id: 'p1', slug: 'two-sum', title: 'Two Sum', difficulty: 'EASY' }] });
    repositories.getProblem.mockResolvedValue({ id: 'p1', slug: 'two-sum', title: 'Two Sum', description: '<p>Use <code>nums</code>.</p>', difficulty: 'EASY' });
    repositories.getTestcaseSets.mockResolvedValue({ total: 2, page: 1, limit: 20, items: [
      { id: 'set1', version: 2, checksum: 'efgh', testcaseCount: 3, exampleCount: 2, active: true },
      { id: 'set-old', version: 1, checksum: 'abcd', testcaseCount: 2, exampleCount: 1, active: false },
    ] });
    repositories.getTestcases.mockResolvedValue([{ id: 'case1', problemId: 'p1', isExample: true, input: '1 2', output: '3' }]);
    repositories.createTestcase.mockResolvedValue({ id: 'case2', problemId: 'p1', isExample: true, input: '4 5', output: '9' });
    repositories.activateTestcaseSet.mockResolvedValue({ id: 'set1', version: 1 });
  });

  it('waits for the sample disclosure before fetching testcase input and output', async () => {
    render(<AdminProblemsTab />);
    await screen.findByText('Two Sum');
    await screen.findByText('ACTIVE · v2');

    expect(repositories.getTestcases).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Testcase mẫu · version active/));
    await waitFor(() => expect(repositories.getTestcases).toHaveBeenCalledWith('p1', true));
    expect(await screen.findByText('1 2')).toBeInTheDocument();
  });

  it('shows one starter language at a time and lets the admin cycle languages', async () => {
    repositories.getProblem.mockResolvedValue({
      id: 'p1', slug: 'two-sum', title: 'Two Sum', description: 'Find two values.', difficulty: 'EASY',
      starterCodes: { cpp: 'cpp starter', java: 'java starter', python: 'python starter' },
    });
    render(<AdminProblemsTab />);
    await screen.findByText('ACTIVE · v2');
    fireEvent.click(screen.getByText('Starter code'));
    expect(screen.getByLabelText('cpp')).toHaveValue('cpp starter');
    expect(screen.queryByLabelText('java')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ngôn ngữ tiếp theo' }));
    expect(screen.getByLabelText('java')).toHaveValue('java starter');
    expect(screen.queryByLabelText('cpp')).not.toBeInTheDocument();
  });

  it('adds a public sample testcase through the versioned testcase API', async () => {
    render(<AdminProblemsTab />);
    await screen.findByText('ACTIVE · v2');
    fireEvent.click(screen.getByText(/Testcase mẫu · version active/));
    await waitFor(() => expect(repositories.getTestcases).toHaveBeenCalledWith('p1', true));
    fireEvent.change(screen.getByLabelText('Input testcase mẫu'), { target: { value: '4 5' } });
    fireEvent.change(screen.getByLabelText('Expected output testcase mẫu'), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Thêm testcase mẫu' }));

    await waitFor(() => expect(repositories.createTestcase).toHaveBeenCalledWith('p1', {
      input: '4 5', output: '9', isExample: true,
    }));
  });

  it('activates the selected existing testcase version', async () => {
    render(<AdminProblemsTab />);
    await screen.findByText('ACTIVE · v2');
    fireEvent.change(screen.getByLabelText('Chọn version testcase'), { target: { value: 'set-old' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kích hoạt version' }));
    await waitFor(() => expect(repositories.activateTestcaseSet).toHaveBeenCalledWith('p1', 'set-old'));
  });

  it('shows a truthful unknown result after the upload connection is lost and offers refresh', async () => {
    repositories.importTestcaseSet.mockRejectedValueOnce(new ApiNetworkError('connection lost', true));
    render(<AdminProblemsTab />);
    await screen.findByText('ACTIVE · v2');
    const file = new File(['zip bytes'], 'cases-v3.zip', { type: 'application/zip' });
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Import & kích hoạt version' }));

    expect(await screen.findByText('Result unknown')).toBeInTheDocument();
    expect(screen.getByText(/connection was lost before the server confirmed the result/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh testcase versions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import & kích hoạt version' })).toBeDisabled();
  });

  it('does not turn a confirmed import into a failure when refreshing versions fails', async () => {
    repositories.importTestcaseSet.mockResolvedValueOnce({
      testcaseSetId: 'set-v3', version: 3, checksum: 'a'.repeat(64), testcaseCount: 1, exampleCount: 1, active: true,
    });
    render(<AdminProblemsTab />);
    await screen.findByText('ACTIVE · v2');
    repositories.getTestcaseSets.mockRejectedValueOnce(new Error('refresh failed'));
    const file = new File(['zip bytes'], 'cases-v3.zip', { type: 'application/zip' });
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Import & kích hoạt version' }));

    expect(await screen.findByText('IMPORT SUCCESSFUL')).toBeInTheDocument();
    expect(screen.getByText(/Testcase set v3 activated/i)).toBeInTheDocument();
  });
});
