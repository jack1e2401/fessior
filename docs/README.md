# Fessior Technical Documentation

This directory contains the technical documentation for Fessior, organized around its core architecture and four technical stories.

The four stories are implementation targets. Each document distinguishes current behavior from planned hardening; the README and current source remain the reference for what can be demonstrated today.

---

## Documentation Index

| Document | Focus & Content |
| :--- | :--- |
| **[architecture.md](architecture.md)** | System overview, modular vertical feature boundaries, layered dependency rules, MySQL schema ownership, and authentication guards. |
| **[testcase-ingestion.md](testcase-ingestion.md)** | **Story 1**: Secure, versioned testcase ZIP ingestion, path traversal protection, archive integrity invariants, and immutable version pinning. |
| **[judging-pipeline.md](judging-pipeline.md)** | **Story 2**: Persistent, asynchronous, idempotent code judging pipeline using BullMQ, state machine transitions, and retry policies. |
| **[realtime-1v1.md](realtime-1v1.md)** | **Story 4**: Realtime 1v1 matchmaking, Socket.io event & room protocols, pairing algorithm, atomic match conclusion, and ELO transactions. |
| **[sandbox-security.md](sandbox-security.md)** | **Story 3**: Sandboxed untrusted-code execution via Judge0 / isolate, CPU/memory/process/network resource limits, and verdict mappings. |
| **[development.md](development.md)** | Local environment setup, single unified `.env` configuration, typed Zod validation, test execution, and development workflows. |
| **[deployment.md](deployment.md)** | Docker Compose infrastructure topology, container configurations, volume persistence, and production operational notes. |
