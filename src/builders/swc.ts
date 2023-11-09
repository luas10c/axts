import path from 'node:path'
import { transformFile } from '@swc/core'
import { writeFile } from 'node:fs/promises'

import { store } from '#/utils/store.js'

async function build(pathname: string) {
  const { dir, name, ext } = path.parse(pathname)

  const { code } = await transformFile(
    path.join(store.config.baseURL, dir, `${name}${ext}`),
    {
      jsc: {
        baseUrl: process.cwd(),
        parser: {
          syntax: 'typescript',
          decorators: true,
          tsx: false
        },
        target: 'es2021',
        paths: {
          '#/*': ['./src/*']
        }
      },
      sourceMaps: false,
      module: {
        strict: true,
        type: 'es6'
      }
    }
  )

  console.log(
    `Compiled file: ${path.join(
      store.config.baseURL,
      'dist',
      dir.split('/').splice(1).join(),
      `${name}${ext}`
    )}`
  )

  await writeFile(
    path.join(
      store.config.baseURL,
      'dist',
      dir.split('/').splice(1).join(),
      `${name}.js`
    ),
    code
  )
}

export const swc = {
  build
}

export default swc
