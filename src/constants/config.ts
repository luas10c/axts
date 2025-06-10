import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const { name, description, version } = JSON.parse(
  await readFile(join(import.meta.dirname, '..', '..', 'package.json'), 'utf-8')
)

export const outDir = join(tmpdir(), name)
