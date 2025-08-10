#!/usr/bin/env node

import { program } from 'commander'
import { join } from 'node:path'
import { readdir, stat, rm, mkdir, cp, symlink } from 'node:fs/promises'
import { fork } from 'node:child_process'
import { watch } from 'chokidar'
import { EventEmitter } from 'node:events'

import { name, description, version, outDir } from './constants/config'

import { transform } from './builders/swc'

program
  .name(name)
  .description(description)
  .version(version, '-v, --version', 'Output the current version')
  .option('--source-root <string>', 'Source Root', 'src')
  .option('--watch', 'Enables watch mode', false)
  .option('--include-assets', 'Include static files in the build', false)
  .argument('<string>', 'Entrypoint file')
  .argument(
    '[args...]',
    'Specify the Node.js command and any additional arguments'
  )
  .showSuggestionAfterError()

type Args = {
  watch?: boolean
  includeAssets?: boolean
  sourceRoot: string
}

const events = new EventEmitter()

const pids = new Set<number>()
let starts: number = 0

export async function* discover(path: string): AsyncGenerator<string> {
  const entries = await readdir(path)

  for (const entry of entries) {
    const stats = await stat(join(path, entry))
    if (stats.isDirectory()) {
      yield* discover(join(path, entry))
      continue
    }

    yield join(path, entry)
  }
}

async function handler(): Promise<void> {
  const options = program.opts<Args>()

  const [entry, nodeArgs] = program.processedArgs as [string, string[]]

  try {
    await rm(outDir, {
      force: true,
      recursive: true
    })
    await mkdir(outDir)

    await symlink(
      join(process.cwd(), 'node_modules'),
      join(outDir, 'node_modules')
    )

    starts = performance.now()
    //console.log('options.sourceRoot', options.sourceRoot)

    for await (const filename of discover(options.sourceRoot)) {
      if (filename.endsWith('.ts')) {
        await transform(join(process.cwd(), filename), options.sourceRoot)
        continue
      }

      if (options.includeAssets) {
        //console.log(join(process.cwd(), filename))
        await cp(
          join(process.cwd(), filename),
          join(
            outDir,
            join(filename.replace(`${join(options.sourceRoot)}/`, ''))
          )
        )
      }
    }

    const entrypoint = entry
      .replace(join(options.sourceRoot, '/'), '')
      .replace(/(.+).ts$/, '$1.js')
    const { pid } = fork(join(outDir, entrypoint), {
      execArgv: ['--enable-source-maps', ...nodeArgs],
      stdio: 'inherit'
    })

    pids.add(pid as number)

    const ends = performance.now()

    console.log(`Compiled successfully! ${(ends - starts).toFixed(2)}ms`)
  } catch (err) {
    console.error(err)
  }

  if (options.watch) {
    const watcher = watch(join(process.cwd(), options.sourceRoot), {
      atomic: true,
      ignoreInitial: true,
      ignored: [/.+\.(?:test|spec)\.ts$/i]
    })

    watcher.on('change', async function (path) {
      process.stdout.write('\x1Bc')
      starts = performance.now()
      try {
        if (!path.endsWith('.ts') && options.includeAssets) {
          await cp(
            path,
            join(
              outDir,
              path.replace(join(process.cwd(), options.sourceRoot, '/'), '')
            ),
            { recursive: true }
          )
          return
        }

        await transform(path, options.sourceRoot)
        events.emit('ready')
      } catch (err) {
        console.error(err)
      }
    })

    watcher.on('add', async function (path) {
      process.stdout.write('\x1Bc')
      starts = performance.now()
      try {
        if (!path.endsWith('.ts') && options.includeAssets) {
          await cp(
            path,
            join(
              outDir,
              path.replace(join(process.cwd(), options.sourceRoot, '/'), '')
            ),
            { recursive: true }
          )
          return
        }

        await transform(path, options.sourceRoot)
        events.emit('ready')
      } catch (err) {
        console.error(err)
      }
    })

    watcher.on('addDir', async function (path) {
      console.log('path', path)
    })

    watcher.on('unlink', async function (path) {
      process.stdout.write('\x1Bc')
      starts = performance.now()
      try {
        await rm(
          join(
            outDir,
            path.replace(join(process.cwd(), options.sourceRoot, '/'), '')
          ),
          {
            force: true
          }
        )

        events.emit('ready')
      } catch (err) {
        console.error(err)
      }
    })

    watcher.on('unlinkDir', async function (path) {
      console.log('path', path)
    })

    events.on('ready', async function () {
      try {
        for (const pid of pids.values()) {
          try {
            process.kill(pid)
            pids.delete(pid)
          } catch {
            pids.delete(pid)
          }
        }

        const entrypoint = entry
          .replace(join(options.sourceRoot, '/'), '')
          .replace(/(.+).ts$/, '$1.js')
        const { pid } = fork(join(outDir, entrypoint), {
          execArgv: ['--enable-source-maps', ...nodeArgs],
          stdio: 'inherit'
        })

        pids.add(pid as number)

        const ends = performance.now()
        console.log(`Compiled successfully! ${(ends - starts).toFixed(2)}ms`)
      } catch (err) {
        console.error(err)
      }
    })
  }
}

program.action(handler)
program.parse(process.argv)
