import chokidar from 'chokidar'
import { cp, rm } from 'node:fs/promises'
import path from 'node:path'

import { terminal } from './utils/terminal.js'
import { time } from './utils/time.js'
import { store, baseURL } from './utils/store.js'

import { swc } from './builders/swc.js'

import { launch } from './launch.js'

export async function watcher(): Promise<void> {
  const watch = store.get('watch')
  const ignores = store.get('ignores')
  const entry = store.get('entry')
  if (!watch) return

  const watcher = chokidar.watch(path.join(baseURL, entry![0]), {
    ignoreInitial: true,
    ignored: ignores,
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
        await cp(filename, filename.replace('src', 'dist'), {
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

    await cp(filename, filename.replace('src', 'dist'), {
      recursive: true,
      force: true
    })
  })
  watcher.on('unlink', async function (filename: string): Promise<void> {
    const pathname = filename.replace('src', 'dist').replace('ts', 'js')

    await rm(pathname, {
      force: true
    })
  })

  process.on('SIGINT', () => watcher.removeAllListeners())
  process.on('SIGTERM', () => watcher.removeAllListeners())
}
