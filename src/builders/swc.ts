import { transformFile } from '@swc/core'
import { rm, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { baseURL, store } from '#/utils/store.js'

export async function swc(filename: string) {
  const { code, map } = await transformFile(filename, {
    jsc: {
      baseUrl: baseURL,
      parser: {
        syntax: 'typescript',
        decorators: true
      },
      target: 'es2022',
      keepClassNames: true,
      loose: false,
      transform: {
        decoratorMetadata: true,
        legacyDecorator: true
      },
      experimental: {
        keepImportAssertions: false,

        emitAssertForImportAttributes: true
      },
      preserveAllComments: true,
      paths: {}
    },
    module: {
      type: 'es6',
      strict: true,
      importInterop: 'swc',
      // @ts-ignore
      resolveFully: true
    },
    sourceMaps: true
  })

  const pathname = path
    .join(baseURL, 'dist', filename.slice(path.join(baseURL, 'src').length))
    .replace('.ts', '.js')

  await rm(pathname, {
    force: true
  })

  await mkdir(path.dirname(pathname), { recursive: true })

  const { name, ext } = path.parse(pathname)

  await writeFile(
    pathname,
    map ? `${code}\n//# sourceMappingURL=${name}${ext}.map` : code
  )

  if (map) {
    await writeFile(pathname.replace('.js', '.js.map'), map)
  }
}
