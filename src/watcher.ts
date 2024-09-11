import chokidar from 'chokidar'
import { cp, rm } from 'node:fs/promises'
import path from 'node:path'

import { terminal } from './utils/terminal.js'
import { time } from './utils/time.js'
import { cli } from './utils/store.js'

import { swc } from './builders/swc.js'

import { launch } from './launch.js'

const baseURL = process.cwd()

export async function watcher(): Promise<void> {
  if (!cli.watch) return

  const watcher = chokidar.watch(path.join(baseURL, cli.entrypoint[0]), {
    ignoreInitial: true,
    ignored: cli.ignores,
    ignorePermissionErrors: true
  })

  watcher.on('change', async function (filename: string): Promise<void> {
    terminal.clear()

    try {
      const extension = path.extname(filename)
      const start = performance.now()
      if (extension === '.ts') {
        await swc(filename)
      } else {
        await cp(filename, filename.replace('src', cli.destination), {
          recursive: true,
          force: true
        })
      }

      const end = performance.now()
      console.log(
        `Successfully compiled: 1 files with swc (${time.ms(end - start)})`
      )

      return launch()
    } catch (error) {
      console.log(error)
    }
  })

  watcher.on('add', async function (filename: string): Promise<void> {
    const extension = path.extname(filename)
    if (extension === '.ts') {
      await swc(filename)
      return
    }

    await cp(filename, filename.replace('src', cli.destination), {
      recursive: true,
      force: true
    })
  })
  watcher.on('unlink', async function (filename: string): Promise<void> {
    const pathname = filename
      .replace('src', cli.destination)
      .replace('ts', 'js')

    await rm(pathname, {
      force: true
    })
  })

  process.on('SIGINT', () => watcher.removeAllListeners())
  process.on('SIGTERM', () => watcher.removeAllListeners())
}
