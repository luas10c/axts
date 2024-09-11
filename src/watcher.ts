import chokidar from 'chokidar'
import { fork } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { pids, cli } from './utils/store.js'

import { time } from './utils/time.js'
import { terminal } from './utils/terminal.js'

import { swc } from './builders/swc.js'

const baseURL = process.cwd()

function execute(start: number) {
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

  const end = performance.now()
  console.log(
    `Successfully compiled: 1 files with swc (${time.ms(end - start)})`
  )
}

export async function watcher() {
  if (!cli.watch) return

  const extensions = ['.ts', '.js']

  const watcher = chokidar.watch(path.join(baseURL, cli.entrypoint[0]), {
    ignoreInitial: true,
    ignored: [/^(?:\..+)\/?(?:.+)?/i, /node_modules|dist/i],
    ignorePermissionErrors: true
  })

  watcher.on('change', async function (filename: string) {
    const extension = path.extname(filename)
    if (!extensions.includes(extension)) return

    terminal.clear()

    const start = performance.now()

    await swc(filename)
    execute(start)
  })

  watcher.on('add', function (filename: string) {
    console.log('add', filename.replace(baseURL, ''))
  })

  watcher.on('unlink', function (filename: string) {
    console.log('unlink', filename.replace(baseURL, ''))
  })
}
