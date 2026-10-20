import { createChunkedStorage } from '~/lib/chunked-storage'

// Simula únicamente el almacén cifrado para provocar interrupciones sin tocar credenciales reales.
function memoryStorage() {
  const data = new Map<string, string>()
  const backend = {
    getItem: jest.fn(async (key: string) => data.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      data.set(key, value)
    }),
    removeItem: jest.fn(async (key: string) => {
      data.delete(key)
    })
  }
  return { data, backend, storage: createChunkedStorage(backend) }
}

describe('Persistencia de sesiones', () => {
  it('conserva valores largos y cada fragmento cabe por bytes UTF-8', async () => {
    const { data, storage } = memoryStorage()
    const value = 'Lectura 📚 con acentos áéíóú'.repeat(300)
    await storage.setItem('session', value)
    expect(await storage.getItem('session')).toBe(value)
    for (const [key, part] of data) {
      if (key !== 'session')
        expect(Buffer.byteLength(part, 'utf8')).toBeLessThanOrEqual(1800)
    }
  })
  it('recupera el formato anterior y limpia sus fragmentos después de publicar el nuevo', async () => {
    const { data, storage } = memoryStorage()
    data.set('session', 'chunks:2')
    data.set('session.0', 'primera')
    data.set('session.1', 'segunda')
    expect(await storage.getItem('session')).toBe('primerasegunda')
    await storage.setItem('session', 'nueva')
    expect([...data.keys()]).toEqual(['session'])
    expect(await storage.getItem('session')).toBe('nueva')
  })
  it('mantiene la sesión anterior si falla un fragmento de la renovación', async () => {
    const { data, backend, storage } = memoryStorage()
    await storage.setItem('session', 'vigente')
    backend.setItem.mockImplementation(async (key, value) => {
      if (key.endsWith('.1')) throw new Error('Interrupción de escritura')
      data.set(key, value)
    })
    await expect(storage.setItem('session', 'x'.repeat(5000))).rejects.toThrow(
      'Interrupción'
    )
    expect(await storage.getItem('session')).toBe('vigente')
    expect([...data.keys()]).toEqual(['session'])
  })
  it('no publica fragmentos si falla el manifiesto final', async () => {
    const { data, backend, storage } = memoryStorage()
    await storage.setItem('session', 'vigente')
    backend.setItem.mockImplementation(async (key, value) => {
      if (key === 'session') throw new Error('No se pudo publicar')
      data.set(key, value)
    })
    await expect(storage.setItem('session', 'n'.repeat(4000))).rejects.toThrow()
    expect(await storage.getItem('session')).toBe('vigente')
    expect([...data.keys()]).toEqual(['session'])
  })
  it('serializa escrituras concurrentes y elimina toda referencia al cerrar sesión', async () => {
    const { data, storage } = memoryStorage()
    await Promise.all([
      storage.setItem('session', 'a'.repeat(3000)),
      storage.setItem('session', 'b'.repeat(4000))
    ])
    expect(await storage.getItem('session')).toBe('b'.repeat(4000))
    await storage.removeItem('session')
    expect(await storage.getItem('session')).toBeNull()
    expect(data.size).toBe(0)
  })
  it('señala una sesión incompleta en vez de aceptar una parte del token', async () => {
    const { data, storage } = memoryStorage()
    data.set('session', 'chunks:2')
    data.set('session.0', 'incompleta')
    await expect(storage.getItem('session')).rejects.toThrow('recuperar')
  })
})
