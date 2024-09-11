type Transform<P> = {
  safes<T, V extends P>(this: T, values: V[]): Pick<Result<V>, 'defaults'>
  string<T>(this: T): Pick<Result<string>, 'safes'>
  boolean<T>(this: T): boolean
  defaults<T, V extends P>(this: T, value: V): P
}

type Result<K> = {
  safes<T, V extends K>(this: T, values: V[]): Pick<Result<V>, 'defaults'>
  defaults<T, V>(this: T, value: V): V | K
}

function defaults<T, V>(this: T, value: V): V {
  if (this === undefined) return value

  return this as V
}

function safes<T, V>(this: T, values: V[]): Pick<Result<V>, 'defaults'> {
  const value = values.find((value) => value === (this as T | V))

  return {
    defaults: defaults.bind(value)
  }
}

function boolean<T>(this: T): boolean {
  if (this === 'null') return Boolean(null)
  if (this === 'undefined') return Boolean(undefined)

  return Boolean(this)
}

function string<T>(this: T): Pick<Result<string>, 'safes'> {
  const value =
    typeof this === 'boolean' || typeof this === 'number' ? Number(this) : this

  return {
    safes: safes.bind(value)
  }
}

export function transform<T>(value: T): Transform<T> {
  return {
    safes: safes.bind(value),
    string: string.bind(value),
    boolean: boolean.bind(value),
    defaults: defaults.bind(value)
  }
}
