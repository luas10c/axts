import { fork } from 'node:child_process'
import path from 'node:path'

import { store, baseURL, pids } from './utils/store.js'

export function launch() {
  for (const pid of pids.values()) {
    try {
      process.kill(pid)
    } catch {
      //
    }

    pids.delete(pid)
  }

  process.removeAllListeners()

  // Enable graceful stop
  process.on('SIGINT', () => process.kill(1))
  process.on('SIGTERM', () => process.kill(1))

  const entry = store.get('entry')
  const nodeArgs = store.get('nodeArgs')

  const bootstrap = entry!
    .filter((item) => item !== entry![0])
    .map((item) => item.replace('.ts', '.js'))

  const { pid } = fork(path.join(baseURL, 'dist', ...bootstrap), {
    stdio: 'inherit',
    execArgv: ['--enable-source-maps', ...nodeArgs!]
  })

  if (pid) {
    pids.add(pid)
  }
}
