import path from 'node:path'
import { transformFile } from '@swc/core'
import { writeFile } from 'node:fs/promises'

import { store } from '#/utils/store.js'

async function build(item: string) {
  const { dir, base, name } = path.parse(
    item
      .split(store.config.entrypoint.path)
      .slice(-1)
      .join()
      .replace(/^(?:\/\/?)/, '')
  )

  const { code } = await transformFile(
    path.join(store.config.baseURL, store.config.entrypoint.path, dir, base),
    store.config.swc
  )

  await writeFile(path.join(store.config.baseURL, 'dist', dir, `${name}.js`), code)
}

export const swc = {
  build
}

export default swc
