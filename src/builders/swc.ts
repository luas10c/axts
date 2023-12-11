import path from 'node:path'
import { transformFile } from '@swc/core'
import { readFile, writeFile } from 'node:fs/promises'

import { store } from '#/store.js'

async function build(filename: string) {
  const { code } = await transformFile(
    path.join(store.baseURL, store.entrypoint.at(0) as string, filename),
    store.swc
  )
  await writeFile(path.join(store.baseURL, 'dist', filename.replace('.ts', '.js')), code)
}

async function config() {
  try {
    const { compilerOptions } = await readFile(
      path.join(store.baseURL, 'tsconfig.json'),
      'utf-8'
    ).then((data) => JSON.parse(data))

    if (compilerOptions?.paths) {
      store.swc.jsc!.paths = compilerOptions.paths
    }
  } catch {}

  if (store.cli.commonjs) {
    store.swc.module!.type = 'commonjs'
  }
}

export const swc = {
  build,
  config
}

export default swc
