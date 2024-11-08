#!/usr/bin/env node

import { program } from 'commander'

import { cli, build } from './utils/store.js'
import { terminal } from './utils/terminal.js'
import { loadConfig } from './utils/config.js'
import { explorer } from './explorer.js'
import { watcher } from './watcher.js'

program
  .name('axts')
  .description('Bring your TypeScript to life with high performance. 🚀')

program.option('--watch', 'Enables watch mode')

type Args = {
  watch: boolean
}

type Props = {
  entrypoint: string
  nodeArgs: string[]
}

function parseArgs(args: string[]): Props {
  function handle(obj: Props, item: string) {
    if (item.match(/.+\.js|ts/)) {
      obj.entrypoint = item
    } else {
      obj.nodeArgs.push(item)
    }

    return obj
  }

  return args.reduce(handle, {
    entrypoint: '',
    nodeArgs: []
  })
}

async function handler(args: Args) {
  const { watch = false } = args

  terminal.clear()

  const { entrypoint, nodeArgs } = parseArgs(program.args)

  cli.watch = watch
  cli.entrypoint = entrypoint.split('/')
  cli.nodeArgs = nodeArgs

  try {
    await loadConfig()

    await explorer()
    await watcher()
  } catch (error) {
    console.log(error)
  }
}

program.action(handler)
program.parse(process.argv)
