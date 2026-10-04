const assert = require('node:assert/strict');
const test = require('node:test');
const { startHybridDev } = require('./start-hybrid-dev.cjs');

test('retries a Docker Hub TLS timeout, then starts local apps', async () => {
  const calls = [];
  const delays = [];
  const results = [
    { code: 1, stderr: 'Get "https://registry-1.docker.io/v2/library/redis/blobs/sha256:abc": net/http: TLS handshake timeout' },
    { code: 0, stderr: '' },
    { code: 0, stderr: '' },
  ];

  const code = await startHybridDev({
    run: async (command, args) => {
      calls.push([command, args]);
      return results.shift();
    },
    sleep: async (ms) => delays.push(ms),
    log: () => {},
  });

  assert.equal(code, 0);
  assert.deepEqual(calls.map(([command]) => command), [
    'docker', 'docker', process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ]);
  assert.deepEqual(delays, [2000]);
});

test('retries a Docker Hub context deadline exceeded error', async () => {
  let calls = 0;
  const code = await startHybridDev({
    run: async () => {
      calls += 1;
      if (calls === 1) {
        return {
          code: 1,
          stderr: 'Get "https://registry-1.docker.io/v2/library/redis/blobs/sha256:abc": context deadline exceeded',
        };
      }
      return { code: 0, stderr: '' };
    },
    sleep: async () => {},
    log: () => {},
  });

  assert.equal(code, 0);
  assert.equal(calls, 3);
});

test('does not retry a non-network Docker error or start apps', async () => {
  let calls = 0;
  const code = await startHybridDev({
    run: async () => {
      calls += 1;
      return { code: 1, stderr: 'permission denied while trying to connect to the docker API' };
    },
    sleep: async () => assert.fail('should not wait'),
    log: () => {},
  });

  assert.equal(code, 1);
  assert.equal(calls, 1);
});

test('stops after three Docker Hub timeouts', async () => {
  let calls = 0;
  const code = await startHybridDev({
    run: async () => {
      calls += 1;
      return { code: 1, stderr: 'registry-1.docker.io: TLS handshake timeout' };
    },
    sleep: async () => {},
    log: () => {},
  });

  assert.equal(code, 1);
  assert.equal(calls, 3);
});
