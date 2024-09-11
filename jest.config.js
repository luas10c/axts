/** @type{import('jest').Config} */
const config = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          baseUrl: './',
          parser: {
            syntax: 'typescript',
            decorators: false
          },
          target: 'es2022',
          keepClassNames: false,

          paths: {
            '#/*': ['./src/*']
          }
        },
        module: {
          type: 'es6',
          strict: true,
          noInterop: false
        }
      }
    ]
  }
}

export default config
