#!/usr/bin/env node

import path from 'node:path'
import chokidar from 'chokidar'
import { fork } from 'node:child_process'
import { cp, mkdir, rm } from 'node:fs/promises'
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

async function handler(args: Args) {
  const entry = program.args.splice(0).join()
  if (!entry) {
    throw new Error('Entrypoint not found')
  }

  const entrypoint = entry.split('/').at(-1)!.replace(/\..+$/, '')
  const working = entry.split('/').slice(0, -1).join('/')

  try {
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

    if (!args.watch) {
      return
    }

    const watcher = chokidar.watch(path.join(store.config.baseURL, working), {
      ignored: /node_modules|dist/,
      persistent: true
    })

    watcher.on('addDir', async function (pathname) {
      const dirname = pathname.split(store.config.entrypoint.path).join('dist')
      if (path.resolve(store.config.baseURL, 'dist') === dirname) {
        return
      }

      await mkdir(dirname)
    })

    const start = performance.now()

    watcher.on('add', async function (pathname) {
      try {
        if (!path.extname(pathname).match(/(js|ts)/)) {
          // Watch assets
          await cp(pathname, pathname.split(store.config.entrypoint.path).join('dist'))
          return
        }

        await swc.build(pathname)
      } catch (error) {
        console.log(`\x1b[31m${emoji.get('close')} Failed to compile\x1b[0m`)
        console.log(error)
      }
    })

    watcher.on('unlinkDir', async function (pathname) {
      const dirname = pathname.split(store.config.entrypoint.path).join('dist')
      await rm(dirname, {
        force: true,
        recursive: true
      })
    })

    watcher.on('unlink', async function (pathname) {
      const dirname = pathname
        .split(store.config.entrypoint.path)
        .join('dist')
        .replace('ts', 'js')
      await rm(dirname)
    })

    watcher.on('change', async function (pathname) {
      terminal.clear()

      const start = performance.now()

      try {
        if (!path.extname(pathname).match(/(js|ts)/)) {
          // Watch assets
          await cp(pathname, pathname.split(store.config.entrypoint.path).join('dist'))
          return
        }

        await swc.build(pathname)
      } catch (error) {
        console.log(`\x1b[31m${emoji.get('close')} Failed to compile\x1b[0m`)
        console.log(error)
      }

      const end = performance.now()

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

      console.log(`\x1b[32m${emoji.get('check')} Compiled sucessfully!\x1b[0m`)
      console.log(`  \x1b[32mReady ${(end - start).toFixed(2)}ms\x1b[0m`)
    })

    watcher.on('error', (error) => {
      console.log(`\x1b[31m${emoji.get('close')} Failed to compile\x1b[0m`)
      console.log(error)
    })

    watcher.on('ready', function () {
      const end = performance.now()

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

      console.log(`\x1b[32m${emoji.get('check')} Compiled sucessfully!\x1b[0m`)
      console.log(`  \x1b[32mReady ${(end - start).toFixed(2)}ms\x1b[0m`)
    })
  } catch (error) {
    console.log(error)
  }
}

program.action(handler)

program.parse(process.argv)
