import { transformFile } from '@swc/core'
import { rm, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { baseURL } from '#/utils/store.js'

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
      experimental: {
        keepImportAssertions: false,
        emitAssertForImportAttributes: true
      },
      transform: {
        decoratorMetadata: true,
        legacyDecorator: true
      },
      preserveAllComments: false,

      paths: {
        '#/*': ['./src/*']
      }
    },
    module: {
      type: 'es6',
      strict: true,
      importInterop: 'swc',
      // @ts-expect-error @ts-ignore
      resolveFully: true
    },

    minify: false,

    sourceMaps: true,
    inputSourceMap: true,
    inlineSourcesContent: true
  })

  const { dir, name } = path.parse(
    path.join(baseURL, 'dist', filename.slice(path.join(baseURL, 'src').length))
  )

  const pathname = path.join(dir, name)

  await rm(pathname, {
    force: true
  })

  await mkdir(path.dirname(pathname), { recursive: true })

  if (!map) {
    await writeFile(`${pathname}.js`, code)
    return
  }

  await writeFile(path.join(dir, `${name}.js.map`), map)
  await writeFile(
    `${pathname}.js`,
    `${code}\n//# sourceMappingURL=${name}.js.map`
  )
}
