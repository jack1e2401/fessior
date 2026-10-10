import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from './httpClient';
import { ProblemRepository } from './repositories/problemRepository';
import { ApiError } from './types';

describe('problem testcase ZIP upload', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubXhr(status: number, response: unknown) {
    class MockXhr {
      static last: MockXhr;
      upload = { onprogress: null as ((event: ProgressEvent) => void) | null, onload: null as (() => void) | null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      status = 0;
      responseText = '';
      headers: Record<string, string> = {};
      constructor() { MockXhr.last = this; }
      open() {}
      setRequestHeader(name: string, value: string) { this.headers[name] = value; }
      send() {
        this.upload.onload?.();
        this.status = status;
        this.responseText = JSON.stringify(response);
        this.onload?.();
      }
    }
    vi.stubGlobal('XMLHttpRequest', MockXhr);
    return MockXhr;
  }

  it('sends an authenticated multipart request and returns import metadata', async () => {
    const file = new File(['zip bytes'], 'cases.zip', { type: 'application/zip' });
    const result = {
      testcaseSetId: 'set-v3', version: 3, checksum: 'sha256',
      testcaseCount: 5, exampleCount: 2, active: true,
    };
    const Xhr = stubXhr(201, { status: 'Success', data: result });

    const repository = new ProblemRepository(new HttpClient({
      baseUrl: 'http://localhost:6868/api/v1',
      getAccessToken: () => 'access-token',
    }));
    const response = await repository.importTestcaseSet('problem-id', file);

    expect(response).toEqual(result);
    expect(Xhr.last.headers).toMatchObject({ Authorization: 'Bearer access-token' });
    expect(Xhr.last.headers).not.toHaveProperty('Content-Type');
  });

  it('preserves API validation errors for an unsuccessful archive import', async () => {
    stubXhr(422, {
      status: 'Error', message: 'Unsafe ZIP structure', error: {
        stage: 'archive_structure', code: 'PATH_TRAVERSAL', entry: 'cases/../secret.txt', databaseState: 'UNCHANGED',
      },
    });
    const repository = new ProblemRepository(new HttpClient({ baseUrl: 'http://localhost/api/v1' }));
    const file = new File(['bad archive'], 'bad.zip', { type: 'application/zip' });

    await expect(repository.importTestcaseSet('problem-id', file)).rejects.toMatchObject({
      constructor: ApiError,
      message: 'Unsafe ZIP structure',
      statusCode: 422,
      payload: expect.objectContaining({ error: expect.objectContaining({ code: 'PATH_TRAVERSAL' }) }),
    });
  });

  it('reports actual upload progress and treats a lost response as an unknown outcome', async () => {
    class LostResponseXhr {
      upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      status = 0;
      responseText = '';
      headers: Record<string, string> = {};
      open() {}
      setRequestHeader(name: string, value: string) { this.headers[name] = value; }
      send() {
        this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 } as ProgressEvent);
        this.onerror?.();
      }
    }
    vi.stubGlobal('XMLHttpRequest', LostResponseXhr);
    const client = new HttpClient({ baseUrl: 'http://localhost/api/v1', getAccessToken: () => 'token' });
    const progress = vi.fn();

    await expect(client.requestWithUploadProgress('POST', '/upload', {
      body: new FormData(), onProgress: progress,
    })).rejects.toMatchObject({ name: 'ApiNetworkError' });
    expect(progress).toHaveBeenCalledWith(50);
  });
});
