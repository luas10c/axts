import chokidar from 'chokidar'
import path from 'node:path'
import { readdir, stat, rm, mkdir, cp } from 'node:fs/promises'
import { fork } from 'node:child_process'

import { store } from './store.js'
import { time } from './utils/time.js'
import { terminal } from './utils/terminal.js'

import { swc } from './builders/swc.js'

async function* scan(): AsyncGenerator<string> {
  const items = await readdir(
    path.join(store.baseURL, store.entrypoint.at(0) as string),
    { recursive: true }
  )
  for (const filename of items) {
    const matched = store.cli.ignore
      .map((item) => {
        if (typeof item === 'string') {
          return
        }

        return item.test(filename)
      })
      .includes(true)
    if (matched) {
      continue
    }

    yield filename
  }
}

async function build() {
  try {
    await rm(path.join(store.baseURL, 'dist'), {
      recursive: true,
      force: true
    })

    await mkdir(path.join(store.baseURL, 'dist'))

    const start = performance.now()
    let totalFiles = 0
    for await (const filename of scan()) {
      const sts = await stat(
        path.join(store.baseURL, store.entrypoint.at(0) as string, filename)
      )
      if (sts.isDirectory()) {
        await mkdir(path.join(store.baseURL, 'dist', filename))
        continue
      }

      const extension = path.extname(filename)
      if (extension === '.ts') {
        await swc.build(filename)
        totalFiles += 1
        continue
      }

      await cp(
        path.join(store.baseURL, store.entrypoint.at(0) as string, filename),
        path.join(store.baseURL, 'dist', filename)
      )
    }

    const end = performance.now()
    console.log(
      `\x1b[36m > \x1b[46m \x1b[37m\x1b[1mSWC \x1b[0m \x1b[36mRunning...\x1b[0m`
    )
    console.log(
      `Successfully compiled: ${totalFiles} files with swc (${time.ms(end - start)})`
    )

    if (store.cli.watch) {
      console.log('Watching for file changes.')
    }

    for (const item of store.pids.values()) {
      try {
        process.kill(item)
      } catch {}

      store.pids.delete(item)
    }

    const { pid } = fork(
      path
        .join(store.baseURL, 'dist', ...store.entrypoint.slice(1))
        .replace('.ts', '.js'),
      {
        stdio: 'inherit',
        execArgv: ['--enable-source-maps']
      }
    )
    store.pids.add(pid as number)
  } catch (error) {
    console.log(error)
  }
}

async function watch() {
  const watcher = chokidar.watch(path.join(process.cwd(), 'src'), {
    ignored: store.cli.ignore,
    ignoreInitial: true,
    persistent: true
  })

  watcher.on('change', async (pathname) => {
    try {
      const filename = pathname.replace(
        path.join(store.baseURL, store.entrypoint.at(0) as string),
        ''
      )
      const start = performance.now()
      const extension = path.extname(filename)

      if (!store.cli.extensions.includes(extension.replace('.', ''))) {
        return
      }

      terminal.clear()

      if (extension === '.ts') {
        await swc.build(filename)
      } else {
        await cp(
          path.join(store.baseURL, store.entrypoint.at(0) as string, filename),
          path.join(store.baseURL, 'dist', filename)
        )
      }
      const end = performance.now()
      console.log(
        `Successfully compiled ${path.join(
          store.entrypoint.at(0) as string,
          filename
        )} with swc (${time.ms(end - start)})`
      )

      for (const item of store.pids.values()) {
        try {
          process.kill(item)
        } catch {}

        store.pids.delete(item)
      }

      const { pid } = fork(
        path
          .join(store.baseURL, 'dist', ...store.entrypoint.slice(1))
          .replace('.ts', '.js'),
        {
          stdio: 'inherit',
          execArgv: ['--enable-source-maps']
        }
      )
      store.pids.add(pid as number)
    } catch (error) {
      console.log(error)
    }
  })

  watcher.on('add', async (arg) => {
    try {
      const filename = arg.replace(
        path.join(store.baseURL, store.entrypoint.at(0) as string),
        ''
      )

      const extension = path.extname(filename)
      if (extension === '.ts') {
        await swc.build(filename)
        return
      }

      await cp(arg, path.join(store.baseURL, 'dist', filename.replace('.ts', '.js')), {
        force: true
      })
    } catch (error) {
      console.log(error)
    }
  })

  watcher.on('unlink', async (arg) => {
    try {
      const filename = arg
        .replace(path.join(store.baseURL, store.entrypoint.at(0) as string), '')
        .replace('.ts', '.js')

      await rm(path.join(store.baseURL, 'dist', filename), {
        force: true
      })
    } catch (error) {
      console.log(error)
    }
  })
}

export const runtime = {
  watch,
  build
}
