const pids = new Set<number>(null)

const config = Object.seal({
  baseURL: '',
  entrypoint: {
    filename: '',
    extension: ''
  },
  swc: {
    jsc: {
      parser: {
        syntax: 'typescript',
        decorators: false,
        tsx: false
      },
      target: 'es2021'
    },
    module: {
      strict: true,
      type: 'es6'
    }
  }
})

export const store = {
  pids,
  config
}

export default store
