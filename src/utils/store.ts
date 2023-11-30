import type { Config } from '#/types/cli.js'

const pids = new Set<number>(null)

const config = Object.seal<Config>({
  baseURL: '',
  entrypoint: {
    path: '',
    filename: ''
  },
  swc: {
    jsc: {
      baseUrl: process.cwd(),
      parser: {
        syntax: 'typescript',
        decorators: false
      },
      target: 'es2021'
    },
    module: {
      strict: true,
      type: 'es6'
    },
    sourceMaps: 'inline'
  }
})

export const store = {
  pids,
  config
}

export default store
