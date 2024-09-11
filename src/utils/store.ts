type Store = {
  watch: boolean
  ignores: RegExp[]
  entry: string[]
  nodeArgs: string[]
}

type Keys = keyof Store

const data = new Map<Keys, any>()

function get<K extends Keys>(key: K): Store[K] | undefined {
  const found = data.has(key)
  if (!found) return

  return data.get(key)
}

function set<K extends Keys, V>(key: K, value: V) {
  data.set(key, value)
}

function remove<K extends Keys>(key: K) {
  const found = data.has(key)
  if (!found) return

  data.delete(key)
}

export const baseURL = process.cwd()

export const pids = new Set<number>([])

export const store = {
  get,
  set,
  remove
}
