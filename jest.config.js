/** @type{import('jest').Config} */
const config = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  setupFilesAfterEnv: []
}

export default config
