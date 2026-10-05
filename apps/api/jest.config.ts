export default {
  forceExit: true,
  testTimeout: 15000,
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/src/modules/**/__tests__/**/*.test.ts', '**/src/docs/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
      },
      moduleNameMapper: {
        '^uuid$': '<rootDir>/src/tests/mocks/uuid.mock.ts',
        '^@ocj/contracts$': '<rootDir>/../../packages/contracts/index.ts',
        '^@ocj/executor$': '<rootDir>/../../packages/executor/src/index.ts',
      },
      verbose: true,
      clearMocks: true,
      resetMocks: false,
      restoreMocks: true,
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/src/tests/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
      },
      setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
      moduleNameMapper: {
        '^uuid$': '<rootDir>/src/tests/mocks/uuid.mock.ts',
        '^@ocj/contracts$': '<rootDir>/../../packages/contracts/index.ts',
        '^@ocj/executor$': '<rootDir>/../../packages/executor/src/index.ts',
      },
      verbose: true,
      clearMocks: true,
      resetMocks: true,
      restoreMocks: true,
    },
  ],
};
