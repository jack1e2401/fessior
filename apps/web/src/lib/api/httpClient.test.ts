import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from './httpClient';
import { ProblemRepository } from './repositories/problemRepository';
import { ApiError } from './types';

describe('problem testcase ZIP upload', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends an authenticated multipart request and returns import metadata', async () => {
    const file = new File(['zip bytes'], 'cases.zip', { type: 'application/zip' });
    const result = {
      testcaseSetId: 'set-v3', version: 3, checksum: 'sha256',
      testcaseCount: 5, exampleCount: 2, active: true,
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'Success', data: result }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const repository = new ProblemRepository(new HttpClient({
      baseUrl: 'http://localhost:6868/api/v1',
      getAccessToken: () => 'access-token',
    }));
    const response = await repository.importTestcaseSet('problem-id', file);

    expect(response).toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:6868/api/v1/problems/problem-id/testcase-sets/import',
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
    );
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(options.headers).toMatchObject({ Authorization: 'Bearer access-token' });
    expect(options.headers).not.toHaveProperty('Content-Type');
    expect(options.body).toBeInstanceOf(FormData);
    expect((options.body as FormData).get('archive')).toBe(file);
  });

  it('preserves API validation errors for an unsuccessful archive import', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 'Error', message: 'Unsafe ZIP structure',
    }), { status: 422, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const repository = new ProblemRepository(new HttpClient({ baseUrl: 'http://localhost/api/v1' }));
    const file = new File(['bad archive'], 'bad.zip', { type: 'application/zip' });

    await expect(repository.importTestcaseSet('problem-id', file)).rejects.toMatchObject({
      constructor: ApiError,
      message: 'Unsafe ZIP structure',
      statusCode: 422,
    });
  });
});
