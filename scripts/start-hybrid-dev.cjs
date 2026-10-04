const { spawn } = require('node:child_process');

const composeArgs = [
  'compose', '--env-file', '.env', '-f', 'infra/docker-compose.yml',
  'up', '-d', '--remove-orphans', '--wait', '--wait-timeout', '120',
  'mysql', 'redis', 'judge0-server', 'judge0-workers',
];

function run(command, args) {
  return new Promise((resolve) => {
    let stderr = '';
    const child = spawn(command, args, {
      stdio: ['inherit', 'inherit', 'pipe'],
      shell: process.platform === 'win32' && command === 'npm.cmd',
    });
    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
      stderr = (stderr + chunk.toString()).slice(-8192);
    });
    child.on('error', (error) => {
      console.error(error);
      stderr = `${stderr}\n${error.message}`;
    });
    child.on('close', (code) => resolve({ code: code ?? 1, stderr }));
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startHybridDev({ run: execute = run, sleep: pause = sleep, log = console.error } = {}) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = await execute('docker', composeArgs);
    if (result.code === 0) {
      const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      return (await execute(npmCommand, ['run', 'dev:local'])).code;
    }

    const dockerHubTimeout = /registry-1\.docker\.io/i.test(result.stderr)
      && /TLS handshake timeout|i\/o timeout|context deadline exceeded|connection reset by peer/i.test(result.stderr);
    if (!dockerHubTimeout) return result.code;
    if (attempt === 3) {
      log('Docker Hub image download failed after 3 attempts. Check Docker Desktop network/proxy settings.');
      return result.code;
    }
    const delay = attempt * 2000;
    log(`Docker Hub timed out; retrying Compose in ${delay / 1000}s (${attempt}/3)...`);
    await pause(delay);
  }
  return 1;
}

if (require.main === module) {
  startHybridDev().then((code) => { process.exitCode = code; });
}

module.exports = { startHybridDev };
