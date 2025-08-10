/** @type{import('jest').Config} */
const config = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testEnvironment: '<rootDir>/tests/environment.ts',
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  }
}

export default config
