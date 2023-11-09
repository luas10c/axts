#!/usr/bin/env node

import path from 'node:path'
import chokidar from 'chokidar'
import { fork } from 'node:child_process'
import { readdir, mkdir, rm, stat } from 'node:fs/promises'
import { program } from 'commander'

import { emoji } from './utils/emoji.js'
import { store } from './utils/store.js'
import { terminal } from './utils/terminal.js'

import { swc } from './builders/swc.js'

import type { Args } from './types/cli.js'

program
  .name('ayrts')
  .description('CLI typescript builder')
  .option('-w, --watch', 'Watch directory', false)

async function* scan(
  pathname: string,
  extension: string
): AsyncGenerator<{ type: 'folder' | 'file'; path: string }> {
  const folders = await readdir(pathname)

  const extensions = [extension, '.json']

  for (const item of folders) {
    if (pathname.match(/(?:node_modules|dist|tests|__tests__|^\..+)/)) {
      continue
    }

    const info = await stat(path.join(pathname, item))
    if (info.isDirectory()) {
      yield {
        type: 'folder',
        path: item
      }

      yield* scan(path.join(pathname, item), extension)
    }

    if (!extensions.includes(path.extname(item))) {
      continue
    }

    yield {
      type: 'file',
      path: path.join(pathname, item).replace(path.join(store.config.baseURL, '/'), '')
    }
  }
}

async function handler(args: Args) {
  const entry = program.args.at(0)!
  if (!entry) {
    throw new Error('Entrypoint not found')
  }

  const entrypoint = entry.split('/').at(-1)!.replace(/\..+$/, '')
  const working = entry.split('/').slice(0, -1).join('/')

  try {
    const start = performance.now()

    process.env['NODE_ENV'] = 'development'

    store.config.baseURL = path.resolve(process.cwd())

    await rm(path.join(store.config.baseURL, 'dist'), {
      recursive: true,
      force: true
    })

    await mkdir(path.join(store.config.baseURL, 'dist'))

    const pathname = path.join(store.config.baseURL, working)
    for await (const item of scan(pathname, '.ts')) {
      if (item.type === 'folder') {
        await mkdir(path.join(store.config.baseURL, 'dist', item.path))
        continue
      }

      await swc.build(item.path)
    }

    for (const item of store.pids.values()) {
      try {
        process.kill(item)
      } catch {}

      store.pids.delete(item)
    }

    const { pid } = fork(path.join(store.config.baseURL, 'dist', `${entrypoint}.js`))
    store.pids.add(pid!)

    const end = performance.now()

    console.log(`\x1b[32m${emoji.get('check')} Compiled sucessfully!\x1b[0m`)
    console.log(`  \x1b[32mReady ${Math.round(end - start)}ms\x1b[0m`)
  } catch (error) {
    console.log(`\x1b[31m${emoji.get('close')} Failed to compile\x1b[0m`)
    console.log(error)
  }

  if (!args.watch) {
    return
  }

  const watcher = chokidar.watch(path.join(store.config.baseURL, working), {
    ignored: /node_modules|dist/,
    persistent: true
  })

  async function update(filename: string) {
    try {
      const start = performance.now()
      terminal.clear()

      await swc.build(filename.replace(path.join(store.config.baseURL, '/'), ''))

      for (const item of store.pids.values()) {
        try {
          process.kill(item)
        } catch {}

        store.pids.delete(item)
      }

      const { pid } = fork(path.join(store.config.baseURL, 'dist', `${entrypoint}.js`))
      store.pids.add(pid!)

      const end = performance.now()
      console.log(`\x1b[32m${emoji.get('check')} Compiled sucessfully!\x1b[0m`)
      console.log(`  \x1b[32mReady ${Math.round(end - start)}ms\x1b[0m`)
    } catch (error) {
      console.log(`\x1b[31m${emoji.get('close')} Failed to compile\x1b[0m`)
      console.log(error)
    }
  }

  watcher.on('change', update)
}

program.action(handler)

program.parse(process.argv)
