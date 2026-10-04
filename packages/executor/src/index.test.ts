import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildJudge0Limits, mapJudge0Status } from './index';

test('converts problem limits to supported Judge0 units and explicit restrictions', () => {
  assert.deepEqual(buildJudge0Limits(2000, 256), {
    cpu_time_limit: 2,
    wall_time_limit: 6,
    memory_limit: 262144,
    max_processes_and_or_threads: 16,
    max_file_size: 64,
    enable_network: false,
    enable_per_process_and_thread_time_limit: true,
    enable_per_process_and_thread_memory_limit: true,
  });
  assert.throws(() => buildJudge0Limits(0, 256));
  assert.throws(() => buildJudge0Limits(2000, 1025));
});

test('normalizes known Judge0 results and never accepts unknown statuses', () => {
  assert.equal(mapJudge0Status(3, ''), 'ACCEPTED');
  assert.equal(mapJudge0Status(4, ''), 'WA');
  assert.equal(mapJudge0Status(5, ''), 'TLE');
  assert.equal(mapJudge0Status(6, ''), 'CE');
  assert.equal(mapJudge0Status(11, 'std::bad_alloc'), 'MLE');
  assert.equal(mapJudge0Status(11, 'MemoryError'), 'MLE');
  assert.equal(mapJudge0Status(11, 'division by zero'), 'RE');
  assert.throws(() => mapJudge0Status(13, ''), /Unsupported Judge0 status/);
  assert.throws(() => mapJudge0Status(99, ''), /Unsupported Judge0 status/);
});
