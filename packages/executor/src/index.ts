import axios from 'axios';

// Judge0 Language IDs
export const LANGUAGE_IDS = {
  cpp: 54, // C++ (GCC 9.2.0)
  java: 62, // Java (JDK 13.0.1)
  python: 71, // Python (3.8.1)
};

export type LanguageKey = 'cpp' | 'java' | 'python';

export const getLanguageId = (lang: LanguageKey): number => {
  return LANGUAGE_IDS[lang] || 71;
};

export interface ExecutionResult {
  status: 'ACCEPTED' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE';
  time: number;
  memory: number;
  error: string | null;
  actualOutput: string;
}

export interface Judge0Config {
  judge0Url: string;
}

const decodeBase64 = (value?: string | null) => {
  return value ? Buffer.from(value, 'base64').toString('utf-8') : '';
};

export const mapJudge0Status = (statusId: number | undefined, details: string): ExecutionResult['status'] => {
  if (statusId === 3) return 'ACCEPTED';
  if (statusId === 4) return 'WA';
  if (statusId === 5) return 'TLE';
  if (statusId === 6) return 'CE';
  if (statusId !== undefined && statusId >= 7 && statusId <= 12) {
    if (/std::bad_alloc|memoryerror|outofmemoryerror|cannot allocate memory|memory limit exceeded/i.test(details)) return 'MLE';
    return 'RE';
  }

  throw new Error(`Unsupported Judge0 status id: ${statusId ?? 'unknown'}`);
};

export const buildJudge0Limits = (timeLimitMs: number, memoryLimitMb: number) => {
  if (!Number.isInteger(timeLimitMs) || timeLimitMs < 100 || timeLimitMs > 10000) {
    throw new Error('Problem time limit must be 100-10000 ms');
  }
  if (!Number.isInteger(memoryLimitMb) || memoryLimitMb < 16 || memoryLimitMb > 1024) {
    throw new Error('Problem memory limit must be 16-1024 MiB');
  }
  const cpuSeconds = timeLimitMs / 1000;
  return {
    cpu_time_limit: cpuSeconds,
    wall_time_limit: cpuSeconds * 3,
    memory_limit: memoryLimitMb * 1024,
    max_processes_and_or_threads: 16,
    max_file_size: 64,
    enable_network: false,
    enable_per_process_and_thread_time_limit: true,
    enable_per_process_and_thread_memory_limit: true,
  };
};

// Execute through a configured Judge0-compatible sandbox only.
export const executeTestCase = async (
  code: string,
  languageId: number,
  stdin: string,
  expectedOutput: string | null,
  timeLimitMs: number,
  memoryLimitMb: number,
  config: Judge0Config
): Promise<ExecutionResult> => {
  const judge0Url = config.judge0Url?.trim();

  if (!judge0Url) {
    throw new Error('JUDGE0_URL is required. Refusing to execute untrusted code without a sandbox.');
  }

  if (judge0Url.includes('rapidapi.com')) {
    throw new Error('Hosted Judge0 endpoints are disabled. Use the self-hosted Judge0 Docker sandbox.');
  }

  try {
    const response = await axios.post(
      `${judge0Url}/submissions?base64_encoded=true&wait=true`,
      {
        source_code: Buffer.from(code).toString('base64'),
        language_id: languageId,
        stdin: Buffer.from(stdin).toString('base64'),
        ...(expectedOutput === null ? {} : { expected_output: Buffer.from(expectedOutput).toString('base64') }),
        ...buildJudge0Limits(timeLimitMs, memoryLimitMb),
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: timeLimitMs * 3 + 10_000,
        maxContentLength: 128 * 1024,
      }
    );

    const result = response.data;
    const statusId = result.status?.id;
    const compileOutput = decodeBase64(result.compile_output);
    const stderrOutput = decodeBase64(result.stderr);
    const judge0Message = decodeBase64(result.message);

    if (statusId === 13) {
      throw new Error(
        `Judge0 sandbox failure: ${compileOutput || stderrOutput || judge0Message || result.status?.description || 'Unknown error'}`
      );
    }

    const status = mapJudge0Status(statusId, `${stderrOutput}\n${judge0Message}`);
    const actualOutput = decodeBase64(result.stdout);

    return {
      status,
      time: result.time ? Math.round(parseFloat(result.time) * 1000) : 0,
      memory: result.memory || 0,
      error: compileOutput || stderrOutput || null,
      actualOutput,
    };
  } catch (err: any) {
    if (err?.response?.data) {
      throw new Error(`Judge0 request failed: ${JSON.stringify(err.response.data)}`);
    }

    throw new Error(`Judge0 request failed: ${err?.message || 'Unknown error'}`);
  }
};
