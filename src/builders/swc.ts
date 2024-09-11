import { transformFile } from '@swc/core'
import { rm, mkdir, writeFile, readFile } from 'node:fs/promises'
import json5 from 'json5'
import path from 'node:path'

const baseURL = process.cwd()

export async function swc(filename: string) {
  const data = await readFile(path.join(baseURL, 'tsconfig.json'), 'utf-8')
  const config = json5.parse<{
    compilerOptions?: { paths: { [key: string]: string[] } }
  }>(data)

  const { code } = await transformFile(filename, {
    jsc: {
      baseUrl: process.cwd(),
      parser: {
        syntax: path.extname(filename) === '.ts' ? 'typescript' : 'ecmascript',
        decorators: true
      },
      preserveAllComments: true,
      target: 'es2022',
      paths: config?.compilerOptions?.paths ? config.compilerOptions.paths : {}
    },

    module: {
      type: 'es6',
      strict: true,
      noInterop: true
    }
  })

  const pathname = path
    .join(baseURL, '.cli', filename.slice(path.join(baseURL, 'src').length))
    .replace('.ts', '.js')

  await rm(pathname, {
    force: true
  })

  await mkdir(path.dirname(pathname), { recursive: true })

  await writeFile(pathname, code)
}
