import chokidar from 'chokidar'
import json5 from 'json5'
import path from 'node:path'
import { writeFile, readFile } from 'node:fs/promises'

import type { Options as SwcOptions } from '@swc/core'

import { store } from './store.js'

import { format } from './format.js'

interface CompilerOptions {
  baseUrl?: string
  target?: 'es3' | 'es5' | 'es6' | 'esnext'
  module?: 'commonjs' | 'amd' | 'esnext' | 'es2015' | 'umd' | 'system' | 'none'
  strict?: boolean
  resolveJsonModule?: boolean
  experimentalDecorators?: boolean
  paths?: Record<string, string[]>
  removeComments?: boolean
  sourceMap?: boolean
}

async function defineConfig(config: {
  compilerOptions: CompilerOptions
}): Promise<SwcOptions> {
  return Promise.resolve({
    jsc: {
      baseUrl: path.join(process.cwd(), '.'),
      parser: {
        syntax: 'typescript',
        decorators: format(
          config?.compilerOptions?.experimentalDecorators
        ).boolean()
      },
      experimental: {
        keepImportAttributes: format(
          config?.compilerOptions?.resolveJsonModule
        ).boolean(),
        emitAssertForImportAttributes: false
      },
      target: format(config?.compilerOptions?.target)
        .string()
        .safes([
          'es2015',
          'es2016',
          'es2017',
          'es2018',
          'es2019',
          'es2020',
          'es2021',
          'es2022'
        ])
        .defaults('es2022'),
      keepClassNames: true,
      loose: false,
      paths: config?.compilerOptions?.paths,
      preserveAllComments: !format(
        config?.compilerOptions?.removeComments
      ).boolean()
    },
    module: {
      type: format(config?.compilerOptions?.module?.toLowerCase())
        .safes(['commonjs'])
        .defaults('es6'),
      strict: format(config?.compilerOptions?.strict).boolean()
    },
    sourceMaps: format(config?.compilerOptions?.sourceMap).boolean()
  })
}

function watcher() {
  const filename = path.join(process.cwd(), 'tsconfig.json')
  const watcher = chokidar.watch(filename, {
    ignorePermissionErrors: true,
    persistent: true
  })

  watcher.on('change', async function handler(filename: string) {
    try {
      const json = await readFile(filename, 'utf-8')
      const data = json5.parse<{ compilerOptions: CompilerOptions }>(json)
      const config = await defineConfig(data)
      //build.config = config
    } catch {}
  })

  // Enable graceful stop
  process.on('SIGINT', () => watcher.removeAllListeners())
  process.on('SIGTERM', () => watcher.removeAllListeners())
}

export async function loadConfig(): Promise<void> {
  try {
    const json = await readFile(
      path.join(process.cwd(), 'tsconfig.json'),
      'utf-8'
    )
    const data = json5.parse<{ compilerOptions: CompilerOptions }>(json)
    const config = await defineConfig(data)
    //build.config = config

    watcher()
  } catch {}
}

export async function loadConfigFromCWD() {
  //
}
