import { fork } from 'node:child_process'
import { readdir, mkdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'

import { time } from './utils/time.js'

import { pids, cli } from './utils/store.js'

import { swc } from './builders/swc.js'

async function* scan(basename: string): AsyncGenerator<string> {
  const entries = await readdir(basename)

  for (const item of entries) {
    if (item.includes('node_modules')) continue
    if (item.includes('dist')) continue

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

export async function builder() {
  console.log(
    `\x1b[36m> \x1b[46m \x1b[37m\x1b[1mSWC \x1b[0m \x1b[36mRunning...\x1b[0m`
  )
  let totalFiles = 0

  const baseURL = process.cwd()
  const extensions = ['.js', '.ts']

  await rm(path.join(baseURL, '.cli'), {
    recursive: true,
    force: true
  })
  await mkdir(path.join(baseURL, '.cli'))

  const start = performance.now()
  for await (const filename of scan(path.join(baseURL, cli.entrypoint[0]))) {
    const extname = path.extname(filename)
    if (extensions.includes(extname)) {
      await swc(filename)
      totalFiles += 1
      continue
    }
  }

  const end = performance.now()
  console.log(
    `Successfully compiled: ${totalFiles} files with swc (${time.ms(end - start)})`
  )

  for (const pid of pids.values()) {
    try {
      process.kill(pid)
    } catch {}

    pids.delete(pid)
  }

  const bootstrap = cli.entrypoint
    .filter((item) => item !== cli.entrypoint[0])
    .map((item) => item.replace('.ts', '.js'))

  const { pid } = fork(path.join(baseURL, '.cli', ...bootstrap), {
    stdio: 'inherit',
    execArgv: ['--enable-source-maps', ...cli.nodeArgs]
  })

  if (pid) {
    pids.add(pid)
  }
}
