import path from 'node:path'
import type { Options } from '@swc/core'

interface Store {
  pids: Set<number>
  baseURL: string
  outDir: string
  entrypoint: string[]
  cli: {
    watch: boolean
    extensions: string[]
    ignore: (string | RegExp)[]
    nodeArgs: string[]
    commonjs: boolean
  }
  swc: Options
}

const pids = new Set<number>(null)

const baseURL = process.cwd()

const outDir = path.join(baseURL, 'dist')

const entrypoint: string[] = []

const cli = Object.seal({
  watch: false,
  extensions: ['ts', 'json'],
  ignore: [/(?:^|\/)\.\w+$/, /node_modules|dist|coverage/],
  nodeArgs: [],
  commonjs: false
})

const swc = Object.seal<Options>({
  jsc: {
    baseUrl: baseURL,
    parser: {
      syntax: 'typescript'
    },
    target: 'es2021',
    keepClassNames: true,
    loose: true
  },
  module: {
    strict: true,
    type: 'es6'
  },
  sourceMaps: 'inline'
})

export const store = Object.seal<Store>({
  pids,
  baseURL,
  outDir,
  entrypoint,
  cli,
  swc
})

export default store
