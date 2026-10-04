import assert from 'node:assert/strict';
import { test } from 'node:test';
import { executeTestCase, LANGUAGE_IDS } from './index';

const judge0Url = process.env.JUDGE0_URL;
const run = (code: string, expected: string | null, languageId = LANGUAGE_IDS.python, timeMs = 1000, memoryMb = 128) =>
  executeTestCase(code, languageId, '', expected, timeMs, memoryMb, { judge0Url: judge0Url! });

test('Judge0 sandbox threat fixtures', { skip: !judge0Url }, async (t) => {
  await t.test('accepted and wrong answer', async () => {
    assert.equal((await run('print(42)', '42')).status, 'ACCEPTED');
    assert.equal((await run('print(41)', '42')).status, 'WA');
  });
  await t.test('compile error and runtime crash', async () => {
    assert.equal((await run('int main( {', null, LANGUAGE_IDS.cpp)).status, 'CE');
    assert.equal((await run('raise ValueError("boom")', null)).status, 'RE');
  });
  await t.test('CPU loop and wall sleep cannot run indefinitely', async () => {
    assert.equal((await run('while True: pass', null)).status, 'TLE');
    assert.equal((await run('import time\ntime.sleep(20)', null)).status, 'TLE');
  });
  await t.test('memory allocation over configured limit returns MLE', async () => {
    const code = '#include <vector>\nint main(){std::vector<char> v(64*1024*1024, 1); return v[0];}';
    assert.equal((await run(code, null, LANGUAGE_IDS.cpp, 2000, 32)).status, 'MLE');
  });
  await t.test('network access is denied', async () => {
    const code = 'import socket\ntry:\n socket.create_connection(("127.0.0.1", 2358), timeout=1)\n print("CONNECTED")\nexcept OSError:\n print("DENIED")';
    const result = await run(code, 'DENIED');
    assert.equal(result.status, 'ACCEPTED');
  });
  await t.test('process and thread creation is bounded', async () => {
    const code = 'import threading\ne=threading.Event()\nstarted=[]\nfor i in range(32):\n try:\n  t=threading.Thread(target=e.wait)\n  t.start()\n  started.append(t)\n except RuntimeError:\n  break\nprint("LIMITED" if len(started)<32 else "UNLIMITED")\ne.set()\nfor t in started: t.join()';
    assert.equal((await run(code, 'LIMITED')).status, 'ACCEPTED');
  });
  await t.test('stdout is bounded', async () => {
    assert.notEqual((await run('print("x" * 131072)', null)).status, 'ACCEPTED');
  });
  await t.test('file output is bounded', async () => {
    const code = 'with open("out", "w") as f: f.write("x" * 131072)';
    assert.notEqual((await run(code, null)).status, 'ACCEPTED');
  });
});
