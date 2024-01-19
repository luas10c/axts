#!/usr/bin/env node

import { program } from 'commander'

import { store } from './store.js'
import { runtime } from './runtime.js'
import { swc } from './builders/swc.js'

interface Args {
  watch: boolean
  extensions: string | string[]
}

program.name('axts').description('Transpile and run very fast Typescript & ESM')

program
  .option('-w, --watch', 'Watch mode', false)
  .option('--extensions <string>', 'Watch extensions', ['ts', 'json'])
  .option('--commonjs', 'Habilita commonjs', false)

async function handler(args: Args) {
  for (const [k, v] of Object.entries(args)) {
    if (k === 'extensions' && typeof v === 'string') {
      store.cli.extensions = v.split(',')
      continue
    }

    store.cli[k as keyof typeof store.cli] = v
  }

  store.cli.extensions = store.cli.extensions.map((extension) => {
    if (!extension.startsWith('.')) {
      return `.${extension}`
    }

    return extension
  })

  const { entrypoint, nodeArgs } = program.args.reduce(
    (obj, item) => {
      if (item.match(/.+\.js|ts/)) {
        obj.entrypoint = item
      } else {
        obj.nodeArgs = [...obj.nodeArgs, item]
      }

      return obj
    },
    { entrypoint: '', nodeArgs: [] as string[] }
  )

  store.cli.nodeArgs = nodeArgs

  if (!entrypoint) {
    throw new Error('You did not provide an entrypoint.')
  }

  const entry = entrypoint.replaceAll(/\\/g, '/').split(/\/\/?/)
  store.entrypoint = entry

  if (entry.length === 1) {
    store.entrypoint = ['.', ...entry]
  }

  await swc.config()

  await runtime.build()

  if (!store.cli.watch) {
    return
  }

  await runtime.watch()
}

program.action(handler)
program.parse(process.argv)
