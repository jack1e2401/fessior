// MySQL TEXT holds at most 65,535 encoded bytes; leave headroom for charset storage.
export const ARCHIVE_LIMITS = {
  compressedBytes: 25 * 1024 * 1024,
  totalUncompressedBytes: 100 * 1024 * 1024,
  fileBytes: 60 * 1024,
  entries: 500,
  cases: 200,
  pathDepth: 3,
  compressionRatio: 100,
} as const;
