import { fork } from 'node:child_process'
import path from 'node:path'

import { cli, pids } from './utils/store.js'

const baseURL = process.cwd()

export function launch() {
  for (const pid of pids.values()) {
    try {
      process.kill(pid)
    } catch {}

    pids.delete(pid)
  }

  process.removeAllListeners()

  // Enable graceful stop
  process.on('SIGINT', () => process.kill(1))
  process.on('SIGTERM', () => process.kill(1))

  const bootstrap = cli.entrypoint
    .filter((item) => item !== cli.entrypoint[0])
    .map((item) => item.replace('.ts', '.js'))

  const { pid } = fork(path.join(baseURL, cli.destination, ...bootstrap), {
    stdio: 'inherit',
    execArgv: ['--enable-source-maps', ...cli.nodeArgs]
  })

  if (pid) {
    pids.add(pid)
  }
}
