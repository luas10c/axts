import { readdir, mkdir, rm, stat, cp } from 'node:fs/promises'
import path from 'node:path'

import { time } from './utils/time.js'

import { store } from './utils/store.js'

import { swc } from './builders/swc.js'

import { launch } from './launch.js'

async function* scan(basename: string): AsyncGenerator<string> {
  const entries = await readdir(basename)

  const ignores = store.get('ignores')

  for (const item of entries) {
    const matched = ignores!.some((value) => item.match(value))
    if (matched) continue

    const pathname = path.join(basename, item)
    const stats = await stat(pathname)
    const isDirectory = stats.isDirectory()
    if (isDirectory) {
      yield* scan(pathname)
      continue
    }

    yield pathname
  }
}

export async function explorer(): Promise<void> {
  console.log(
    `\x1b[36m> \x1b[46m \x1b[37m\x1b[1mSWC \x1b[0m \x1b[36mRunning...\x1b[0m`
  )
  let totalFiles = 0

  const baseURL = process.cwd()

  await rm(path.join(baseURL, 'dist'), {
    recursive: true,
    force: true
  })
  await mkdir(path.join(baseURL, 'dist'))

  const start = performance.now()
  for await (const filename of scan(baseURL)) {
    const extname = path.extname(filename)
    if (extname === '.ts') {
      await swc(filename)
      totalFiles += 1
      continue
    }

    if (!filename.match(/\/src\//)) continue

    await cp(filename, filename.replace('src', 'dist'))
  }

  const end = performance.now()
  console.log(
    `Successfully compiled: ${totalFiles} files with swc (${time.ms(end - start)})`
  )

  return launch()
}
