import chokidar from 'chokidar'
import json5 from 'json5'
import path from 'node:path'
import { readFile } from 'node:fs/promises'

import type { Options as SwcOptions } from '@swc/core'

import { transform } from './utils/transform.js'

type CompilerOptions = {
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

type Config = {
  compilerOptions: CompilerOptions
}

function defineConfig(config: Config): SwcOptions {
  return {
    jsc: {
      baseUrl: path.join(process.cwd(), '.'),
      parser: {
        syntax: 'typescript',
        decorators: transform(
          config?.compilerOptions?.experimentalDecorators
        ).boolean()
      },
      experimental: {
        keepImportAttributes: transform(
          config?.compilerOptions?.resolveJsonModule
        ).boolean(),
        emitAssertForImportAttributes: false
      },
      target: transform(config?.compilerOptions?.target)
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
      preserveAllComments: !transform(
        config?.compilerOptions?.removeComments
      ).boolean(),

      paths: config?.compilerOptions?.paths
    },
    module: {
      type: transform(config?.compilerOptions?.module?.toLowerCase())
        .safes(['commonjs'])
        .defaults('es6'),
      strict: transform(config?.compilerOptions?.strict).boolean()
    },
    sourceMaps: transform(config?.compilerOptions?.sourceMap).boolean()
  }
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
      defineConfig(data)
      //build.config = config
    } catch {
      //
    }
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
    defineConfig(data)
    //build.config = config

    watcher()
  } catch {
    //
  }
}

export async function loadConfigFromCWD() {
  //
}
