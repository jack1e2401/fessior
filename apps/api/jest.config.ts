export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  setupFilesAfterEnv: ['./src/tests/setup.ts'],
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/tests/mocks/uuid.mock.ts',
    '^@ocj/contracts$': '<rootDir>/../../packages/contracts/index.ts',
    '^@ocj/executor$': '<rootDir>/../../packages/executor/src/index.ts',
  },
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
