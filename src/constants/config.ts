import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import json5 from 'json5'

export const { name, description, version } = JSON.parse(
  await readFile(join(import.meta.dirname, '..', '..', 'package.json'), 'utf-8')
)

export const outDir = join(tmpdir(), name)

export async function loadTsConfigPaths() {
  const data = await readFile(join(process.cwd(), 'tsconfig.json'), 'utf-8')
  const {
    compilerOptions: { paths }
  } = json5.parse(data)

  return paths
}
