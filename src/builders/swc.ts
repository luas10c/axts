import { transformFile } from '@swc/core'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, parse } from 'node:path'

import { outDir } from '#/constants/config'

export async function transform(
  filename: string,
  sourceRoot: string
): Promise<void> {
  const { code, map } = await transformFile(filename, {
    jsc: {
      baseUrl: join(process.cwd(), '.'),
      parser: {
        syntax: 'typescript',
        decorators: true
      },

      target: 'es2022',
      keepClassNames: true,
      transform: {
        treatConstEnumAsEnum: true,
        decoratorMetadata: true,
        legacyDecorator: true
      },

      experimental: {
        keepImportAssertions: true
      },

      paths: {
        '#/*': ['./src/*']
      }
    },

    module: {
      type: 'es6',
      strict: true,
      resolveFully: true
    },

    sourceMaps: true
  })

  const { dir, name } = parse(
    filename
      .replace(join(process.cwd(), '/'), '')
      .replace(join(sourceRoot, '/'), '')
  )

  await mkdir(join(outDir, dir), { recursive: true })

  await writeFile(
    join(outDir, dir, `${name}.js`),
    `${code}\n//# sourceMappingURL=${join(outDir, dir, `${name}.js.map`)}`
  )

  if (map) {
    await writeFile(join(outDir, dir, `${name}.js.map`), map)
  }
}
