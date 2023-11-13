export interface Args {
  watch: boolean
}

export interface SwcOptions {
  jsc: {
    baseUrl?: string
    parser: {
      syntax: 'typescript' | 'ecmascript'
      decorators: boolean
    }
    target: 'es2021'
  }
  module: {
    strict: boolean
    type: 'es6' | 'commonjs'
  }
  sourceMaps: boolean
}

export interface Config {
  baseURL: string
  entrypoint: {
    path: string
    filename: string
  }
  swc: SwcOptions
}
