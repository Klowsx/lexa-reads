export interface AsyncStorage {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

const MAX_CHUNK_BYTES = 1800
let generation = 0

// Divide por bytes UTF-8 para respetar el límite nativo incluso con nombres y emojis.
function splitValue(value: string): string[] {
  const chunks: string[] = []
  let chunk = ''
  let bytes = 0
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0
    const size =
      point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4
    if (bytes + size > MAX_CHUNK_BYTES) {
      chunks.push(chunk)
      chunk = ''
      bytes = 0
    }
    chunk += character
    bytes += size
  }
  chunks.push(chunk)
  return chunks
}

// Reconoce las sesiones anteriores y los nuevos fragmentos publicados de forma atómica.
function chunkKeys(key: string, manifest: string | null): string[] {
  const current = manifest?.match(/^chunks:v2:([a-z0-9]+):(\d+)$/)
  const legacy = manifest?.match(/^chunks:(\d+)$/)
  const count = Number(current?.[2] ?? legacy?.[1] ?? 0)
  if (count > 512) throw new Error('El almacenamiento de la sesión es inválido')
  return Array.from({ length: count }, (_, index) =>
    current ? key + '.v2.' + current[1] + '.' + index : key + '.' + index
  )
}

// Publica cada escritura completa antes de retirar la versión previa de la sesión.
export function createChunkedStorage(backend: AsyncStorage): AsyncStorage {
  const writes = new Map<string, Promise<void>>()

  // Serializa los cambios de una clave para evitar mezclar renovaciones simultáneas.
  function enqueue(key: string, operation: () => Promise<void>) {
    const next = (writes.get(key) ?? Promise.resolve())
      .catch(() => {})
      .then(operation)
    writes.set(key, next)
    const finish = () => {
      if (writes.get(key) === next) writes.delete(key)
    }
    void next.then(finish, finish)
    return next
  }

  return {
    // Reconstruye todos los fragmentos o explica el fallo, sin aceptar una sesión incompleta.
    async getItem(key) {
      await writes.get(key)?.catch(() => {})
      const manifest = await backend.getItem(key)
      const keys = chunkKeys(key, manifest)
      if (!keys.length) return manifest
      const parts = await Promise.all(keys.map((part) => backend.getItem(part)))
      if (parts.some((part) => part === null))
        throw new Error('No pudimos recuperar la sesión guardada')
      return parts.join('')
    },
    // Mantiene la sesión anterior si falla la escritura de un fragmento o del manifiesto.
    setItem(key, value) {
      return enqueue(key, async () => {
        const previousKeys = chunkKeys(key, await backend.getItem(key))
        const chunks = splitValue(value)
        const version = Date.now().toString(36) + (++generation).toString(36)
        const nextKeys =
          chunks.length > 1
            ? chunks.map((_, index) => key + '.v2.' + version + '.' + index)
            : []
        try {
          if (nextKeys.length) {
            const results = await Promise.allSettled(
              nextKeys.map((part, index) =>
                backend.setItem(part, chunks[index])
              )
            )
            const failed = results.find(
              (result) => result.status === 'rejected'
            )
            if (failed?.status === 'rejected') throw failed.reason
          }
          await backend.setItem(
            key,
            nextKeys.length
              ? 'chunks:v2:' + version + ':' + chunks.length
              : value
          )
        } catch (error) {
          await Promise.allSettled(
            nextKeys.map((part) => backend.removeItem(part))
          )
          throw error
        }
        await Promise.allSettled(
          previousKeys.map((part) => backend.removeItem(part))
        )
      })
    },
    // Retira primero la referencia pública para que una limpieza parcial no restaure la sesión.
    removeItem(key) {
      return enqueue(key, async () => {
        const keys = chunkKeys(key, await backend.getItem(key))
        await backend.removeItem(key)
        await Promise.all(keys.map((part) => backend.removeItem(part)))
      })
    }
  }
}
