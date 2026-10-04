# Secure Testcase ZIP Ingestion

Phase 3 runs in the **Backend HTTP Service** (`apps/api`). The **Judge Worker** continues to read the `TestcaseSet` pinned on each `Submission`; it never reads a ZIP. The **Web Frontend** can use the HTTP endpoint without new storage services.

## Import request

An authenticated administrator sends exactly one `multipart/form-data` part named `archive` to `POST /api/v1/problems/:problemId/testcase-sets/import`. `problemId` accepts the problem ID or slug. A successful 201 response returns only `testcaseSetId`, `version`, `checksum`, `testcaseCount`, `exampleCount`, and `active` inside `data`. It never includes testcase input/output.

## ZIP format

Only UTF-8 text and this canonical layout are accepted:

```text
manifest.json
cases/001.in
cases/001.out
cases/002.in
cases/002.out
```

`cases/` may appear as an explicit directory entry. The manifest is strict JSON:

```json
{
  "schemaVersion": 1,
  "cases": [
    { "id": "001", "input": "cases/001.in", "output": "cases/001.out", "isExample": true },
    { "id": "002", "input": "cases/002.in", "output": "cases/002.out", "isExample": false }
  ]
}
```

IDs contain only ASCII letters, digits, `_`, and `-`. Every file path must match its ID and extension. Manifest order becomes zero-based testcase `position`. Case IDs and references must be unique; every listed input and output must exist, and no unlisted payload file is allowed. `isExample=false` means a non-public judging case. File text is decoded as strict UTF-8 and persisted unchanged as text, including whitespace and line endings.

## Streaming and security

Busboy streams the single upload to a server-created directory in OS temporary storage. A transform checks compressed bytes and computes SHA-256 during the stream. The directory is removed in `finally` after success, malformed requests, unsafe archives, or database failure. The original filename is never used as a path.

Yauzl processes ZIP entries lazily; no archive entry is extracted to a filesystem destination. Strict filename handling rejects absolute paths, drive paths, backslashes, dot segments, traversal, excessive depth, duplicate paths (case-insensitive), unexpected extensions/files, symlinks and special files, and encrypted entries. Declared sizes and actual decompressed bytes are both checked. The parser checks compression ratio and entry count. Invalid JSON, schema, pair references, or UTF-8 fail before a database transaction opens.

Centralized limits are in `archive-limits.ts`:

| Resource | Limit |
| --- | ---: |
| Compressed ZIP | 25 MiB |
| Total declared uncompressed data | 100 MiB |
| Individual file, including manifest | 60 KiB |
| ZIP entries | 500 |
| Testcase pairs | 200 |
| Path depth | 3 components |
| Compression ratio | 100:1 |

The 60 KiB per-file cap keeps each UTF-8 input/output below MySQL `TEXT`'s 65,535-byte limit. It is deliberately restrictive for this demo scope; large binary datasets are unsupported. The entry and pair caps make the effective total lower than 100 MiB for ordinary archives.

`TestcaseSet.checksum` is the SHA-256 hex digest of the **uploaded compressed ZIP bytes**, for integrity and audit metadata. Re-importing identical bytes creates another version; checksum-based deduplication is not implemented.

## Persistence and secrecy

After full validation, the repository opens a serializable MySQL transaction. It reads the problem and latest set, allocates `MAX(version)+1`, creates the set and all ordered cases, conditionally updates `Problem.active_testcase_set_id`, then commits. The unique `(problem_id, version)` constraint and a bounded three-attempt retry handle concurrent imports or edits; exhausted conflicts return 409. Any failure rolls back the new set and leaves the prior active set in place. Old sets remain immutable, and submissions already pinned to them keep that reference. New submissions pin the newly active set.

`GET /api/v1/problems/:problemId/testcases` returns only example cases to normal users. Administrators may read all active cases; `?example=true` filters their view too. The execution preview reads example cases only. Historical sets are not exposed by a public read endpoint.

Errors: 400 for multipart/manifest shape, 404 for unknown problem, 413 for resource limits, 422 for unsafe ZIP structure, and 409 for unresolved concurrent activation.
