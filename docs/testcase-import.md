# Testcase Import

The target flow is an admin-only ZIP import at `POST /admin/problems/:problemId/testcase-sets/import`. The archive will contain `manifest.json` and paired `cases/*.in` / `cases/*.out` files. Validation, version pinning, atomic activation, and cleanup requirements are in [AGENTS.md](../AGENTS.md).

**Current status:** the versioned ZIP import is not implemented yet. The API currently manages individual testcases through `apps/api/src/modules/testcases/`, mounted under the problem routes. Prisma currently stores cases directly under a problem. Do not treat this document as a claim that ZIP ingestion is available.
