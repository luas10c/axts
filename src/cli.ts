#!/usr/bin/env node

import path from 'node:path'
import chokidar from 'chokidar'
import { fork } from 'node:child_process'
import { readdir, mkdir, rm, stat } from 'node:fs/promises'
import { program } from 'commander'

import { emoji } from './utils/emoji.js'
import { store } from './utils/store.js'
import { terminal } from './utils/terminal.js'
import { config } from './utils/config.js'

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
        path: path.join(pathname, item)
      }

      yield* scan(path.join(pathname, item), extension)
    }

    if (!extensions.includes(path.extname(item))) {
      continue
    }

    yield {
      type: 'file',
      path: path.join(pathname, item)
    }
  }
}

async function handler(args: Args) {
  const entry = program.args.splice(0).join()
  if (!entry) {
    throw new Error('Entrypoint not found')
  }

  const entrypoint = entry.split('/').at(-1)!.replace(/\..+$/, '')
  const working = entry.split('/').slice(0, -1).join('/')

  try {
    const start = performance.now()

    process.env['NODE_ENV'] = 'development'

    store.config.baseURL = process.cwd()
    store.config.entrypoint.path = entry.split('/').slice(0, -1).join()
    store.config.entrypoint.filename = entry.split('/').at(-1)!

    await config.load()

    await rm(path.join(store.config.baseURL, 'dist'), {
      recursive: true,
      force: true
    })

    await mkdir(path.join(store.config.baseURL, 'dist'))

    const { dir, ext } = path.parse(path.resolve(store.config.baseURL, entry))
    for await (const item of scan(dir, ext)) {
      if (item.type === 'folder') {
        await mkdir(path.join(store.config.baseURL, 'dist', item.path.replace(dir, '')))
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

    const { pid } = fork(path.join(store.config.baseURL, 'dist', `${entrypoint}.js`), {
      stdio: 'inherit',
      execArgv: ['--enable-source-maps']
    })
    store.pids.add(pid!)

    const end = performance.now()

    console.log(`\x1b[32m${emoji.get('check')} Compiled sucessfully!\x1b[0m`)
    console.log(`  \x1b[32mReady ${(end - start).toFixed(2)}ms\x1b[0m`)
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

      const { pid } = fork(path.join(store.config.baseURL, 'dist', `${entrypoint}.js`), {
        stdio: 'inherit',
        execArgv: ['--enable-source-maps']
      })
      store.pids.add(pid!)

      const end = performance.now()
      console.log(`\x1b[32m${emoji.get('check')} Compiled sucessfully!\x1b[0m`)
      console.log(`  \x1b[32mReady ${(end - start).toFixed(2)}ms\x1b[0m`)
    } catch (error) {
      console.log(`\x1b[31m${emoji.get('close')} Failed to compile\x1b[0m`)
      console.log(error)
    }
  }

  watcher.on('change', update)
}

program.action(handler)

program.parse(process.argv)
