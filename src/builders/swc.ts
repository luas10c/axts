import { transformFile } from '@swc/core'
import { rm, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { cli, build } from '#/utils/store.js'

import { resolveFullImportPaths } from '#/utils/transform.js'

const baseURL = process.cwd()

export async function swc(filename: string) {
  const { code, map } = await transformFile(filename, build.config)

  const pathname = path
    .join(
      baseURL,
      cli.destination,
      filename.slice(path.join(baseURL, 'src').length)
    )
    .replace('.ts', '.js')

  await rm(pathname, {
    force: true
  })

  await mkdir(path.dirname(pathname), { recursive: true })

  const { name, ext } = path.parse(pathname)

  await writeFile(
    pathname,
    resolveFullImportPaths(
      map ? `${code}\n//# sourceMappingURL=${name}${ext}.map` : code
    )
  )

  if (map) {
    await writeFile(pathname.replace('.js', '.js.map'), map)
  }
}
