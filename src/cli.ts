#!/usr/bin/env node

import { program } from 'commander'

import { store } from './utils/store'
import { terminal } from './utils/terminal'
import { loadConfigFromCWD } from './config'
import { explorer } from './explorer'
import { watcher } from './watcher'

program
  .name('axts')
  .description('Bring your TypeScript to life with high performance. 🚀')

program.option('--watch', 'Enables watch mode')

type Args = {
  watch: boolean
}

type Props = {
  entry: string
  nodeArgs: string[]
}

function parseArgs(args: string[]): Props {
  function handle(obj: Props, item: string) {
    if (item.match(/.+\.js|ts/)) {
      obj.entry = item
    } else {
      obj.nodeArgs.push(item)
    }

    return obj
  }

  return args.reduce(handle, {
    entry: '',
    nodeArgs: []
  })
}

async function handler(args: Args) {
  const { watch = false } = args

  const { entry, nodeArgs } = parseArgs(program.args)

  store.set('watch', watch)
  store.set('ignores', [
    /^\..+|node_modules|dist|uploads|public|tests|__tests__/i,
    /^.+\.config\.(?:js|ts)$/i,
    /.+\.(?:test|spec)\.(?:js|ts)$/i
  ])
  store.set('entry', entry.split('/'))
  store.set('nodeArgs', nodeArgs)

  try {
    terminal.clear()
    await loadConfigFromCWD()

    await explorer()
    await watcher()
  } catch (error) {
    console.log(error)
  }
}

program.action(handler)
program.parse(process.argv)
