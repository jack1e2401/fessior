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
