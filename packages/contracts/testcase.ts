export interface TestcaseSetSummary {
  id: string;
  version: number;
  checksum: string | null;
  testcaseCount: number;
  exampleCount: number;
  createdAt: string | Date;
  active: boolean;
}

export interface TestcaseImportResult {
  testcaseSetId: string;
  version: number;
  checksum: string;
  testcaseCount: number;
  exampleCount: number;
  active: true;
}

export type TestcaseImportStage =
  | 'upload'
  | 'archive_structure'
  | 'manifest'
  | 'testcase_pairs'
  | 'resource_limits'
  | 'activation';

export type TestcaseImportCheck =
  | 'archive_structure'
  | 'safe_paths'
  | 'safe_entries'
  | 'manifest'
  | 'testcase_pairs'
  | 'resource_limits';

export type TestcaseImportFailureCode =
  | 'PATH_TRAVERSAL'
  | 'SYMLINK'
  | 'DUPLICATE_ENTRY'
  | 'UNSUPPORTED_ENTRY'
  | 'INVALID_ZIP'
  | 'MISSING_MANIFEST'
  | 'INVALID_MANIFEST'
  | 'INVALID_CASE_TEXT'
  | 'MISSING_INPUT'
  | 'MISSING_OUTPUT'
  | 'UNREFERENCED_ENTRY'
  | 'ARCHIVE_TOO_LARGE'
  | 'ENTRY_TOO_LARGE'
  | 'TOO_MANY_ENTRIES'
  | 'TOTAL_SIZE_EXCEEDED'
  | 'COMPRESSION_RATIO_EXCEEDED'
  | 'ACTIVATION_CONFLICT'
  | 'ACTIVATION_RESULT_UNKNOWN'
  | 'UPLOAD_INVALID'
  | 'PROBLEM_NOT_FOUND';

export interface TestcaseImportFailure {
  stage: TestcaseImportStage;
  code: TestcaseImportFailureCode;
  entry?: string;
  databaseState: 'UNCHANGED' | 'UNKNOWN';
  completedSteps?: TestcaseImportCheck[];
}

export interface TestcaseActivationResult {
  testcaseSetId: string;
  version: number;
  active: true;
}

export interface ITestcase {
  id: string;
  problemId: string;
  isExample: boolean;
  input: string;
  output: string;
}
