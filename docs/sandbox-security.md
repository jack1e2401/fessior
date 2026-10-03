# Sandbox Security

`packages/executor` sends source code to a configured Judge0 server. The worker calls it from `apps/judge-worker/src/sandbox/submission-judge.service.ts`. Judge0 configuration lives in `infra/judge0/judge0.env.example`; the local Compose stack is `infra/docker-compose.yml`.

**Current status:** the sandbox hardening and security tests in [AGENTS.md](../AGENTS.md) remain open. The current executor sends a CPU time limit, but the full memory, process, file/output, and network limits have not been verified end to end. The Compose configuration currently publishes port 2358 and uses a privileged Judge0 container. Treat it as a local development configuration, not a production security boundary.
