import path from 'node:path'
import { readFile } from 'node:fs/promises'

import { store } from '#/utils/store.js'

import type { SwcOptions } from '#/types/cli.js'

function parse(config: SwcOptions) {
  store.config.swc = {
    ...store.config.swc,
    ...config,
    jsc: {
      ...config.jsc,
      baseUrl: path.join(store.config.baseURL, config.jsc?.baseUrl ?? '.')
    }
  }
}

async function load(): Promise<void> {
  try {
    const raw = await readFile(path.join(store.config.baseURL, '.swcrc'), 'utf-8')
    const config = JSON.parse(raw)

    delete config['$schema']

    parse(config)
  } catch {}
}

export const config = {
  load
}
