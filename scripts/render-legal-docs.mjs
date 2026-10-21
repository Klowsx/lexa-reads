import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'public', 'legal')
const output = path.join(root, 'dist', 'legal')
const documents = [
  'terms.md',
  'eula.md',
  'community-guidelines.md',
  'privacy.md'
]
const info = JSON.parse(
  await readFile(path.join(source, 'release-info.json'), 'utf8')
)
const required = [
  'legalName',
  'supportEmail',
  'privacyEmail',
  'jurisdiction',
  'minimumAge',
  'effectiveDate'
]
const missing = required.filter((key) => !String(info[key] ?? '').trim())

if (missing.length > 0) {
  throw new Error(
    `Faltan datos públicos en release-info.json: ${missing.join(', ')}`
  )
}

await mkdir(output, { recursive: true })

// Sustituye los datos públicos centralizados en cada borrador sin inventar valores.
for (const name of documents) {
  const template = await readFile(path.join(source, name), 'utf8')
  const rendered = template.replace(/{{([a-zA-Z]+)}}/g, (_, key) => {
    if (!required.includes(key))
      throw new Error(`Variable legal desconocida: ${key}`)
    return String(info[key])
  })
  if (rendered.includes('{{'))
    throw new Error(`Variables sin resolver en ${name}`)
  await writeFile(path.join(output, name), rendered)
}

console.log(`Borradores renderizados en ${output}. Revisar antes de publicar.`)
