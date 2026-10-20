// Test de integración: verifica la lógica cache-first de google-books.ts
// contra una base de datos Supabase real.
//
// La API de Google Books está MOCKEADA para no depender de quota ni red.
// Las operaciones de DB son REALES (usa adminClient para saltear RLS).
//
// Cómo correr: pnpm jest src/__tests__/lib/google-books.test.ts

import { searchBooks, getBook, getBookByIsbn } from '~/lib/google-books'
import { adminClient } from '~/test-utils/supabase'

// ── Mock del módulo supabase ──────────────────────────────────
// Reemplazamos el cliente global (que requiere auth) con adminClient,
// que usa service_role y bypasa RLS. google-books.ts lo usará sin saberlo.
jest.mock('~/lib/supabase', () => ({
  supabase: require('~/test-utils/supabase').adminClient
}))

// ── Mock de fetch para la API de Google Books ─────────────────
// No llamamos a la red real para evitar problemas de quota (1000 req/día sin key).
// La lógica que testeamos es: cache-first, mapeo de campos, upsert en DB.

const MOCK_BOOK_ID = 'test-hp-gb-001'
const MOCK_ISBN_13 = '9780439708180'

// Datos que simula devolver la API de Google Books
const MOCK_VOLUME = {
  id: MOCK_BOOK_ID,
  volumeInfo: {
    title: "Harry Potter and the Sorcerer's Stone",
    authors: ['J.K. Rowling'],
    description: 'A young wizard discovers his magical heritage.',
    imageLinks: {
      thumbnail: 'http://books.google.com/thumbnail?id=test&edge=curl'
    },
    industryIdentifiers: [
      { type: 'ISBN_13', identifier: MOCK_ISBN_13 },
      { type: 'ISBN_10', identifier: '043970818X' }
    ],
    pageCount: 309,
    categories: ['Fiction', 'Fantasy'],
    language: 'en',
    publishedDate: '1998-09-01',
    publisher: 'Scholastic'
  }
}

const MOCK_SEARCH_RESPONSE = {
  totalItems: 1,
  items: [MOCK_VOLUME]
}

// Guardamos el fetch original para que las llamadas a Supabase pasen normalmente
const originalFetch = global.fetch

beforeAll(() => {
  // Interceptamos fetch: solo mockeamos las llamadas a googleapis.com
  global.fetch = jest.fn((url: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = String(url)
    if (urlStr.includes('googleapis.com/books')) {
      // Simulamos la respuesta de Google Books
      if (urlStr.includes(`/volumes/${MOCK_BOOK_ID}`)) {
        return Promise.resolve(
          new Response(JSON.stringify(MOCK_VOLUME), { status: 200 })
        )
      }
      // Búsqueda por texto o ISBN
      return Promise.resolve(
        new Response(JSON.stringify(MOCK_SEARCH_RESPONSE), { status: 200 })
      )
    }
    // Todo lo demás (Supabase) pasa por el fetch real
    return originalFetch(url, init)
  }) as typeof fetch
})

afterAll(async () => {
  // Restaurar fetch original
  global.fetch = originalFetch

  // Limpiar los libros de prueba para no ensuciar la DB entre corridas
  await adminClient.from('books').delete().eq('google_books_id', MOCK_BOOK_ID)
})

// ── Test 1: getBook ───────────────────────────────────────────

describe('getBook', () => {
  beforeEach(async () => {
    // Partir desde un estado limpio: eliminar el libro de prueba si existe
    await adminClient.from('books').delete().eq('google_books_id', MOCK_BOOK_ID)
  })

  it('trae el libro de la API (mock) y lo guarda en Supabase', async () => {
    // Paso 1: el libro NO está en la DB todavía → debe llamar a la API
    const book = await getBook(MOCK_BOOK_ID)

    // Paso 2: verificar que retornó datos correctos
    expect(book).not.toBeNull()
    expect(book?.google_books_id).toBe(MOCK_BOOK_ID)
    expect(book?.title).toBe("Harry Potter and the Sorcerer's Stone")
    expect(book?.authors).toContain('J.K. Rowling')
    expect(book?.isbn_13).toBe(MOCK_ISBN_13)

    // Paso 3: verificar que limpió la URL de la portada (https, sin edge=curl)
    expect(book?.cover_url).toContain('https://')
    expect(book?.cover_url).not.toContain('edge=curl')
  })

  it('retorna el libro desde la caché (Supabase) en la segunda llamada, sin llamar a la API', async () => {
    // Paso 1: primera llamada → guarda en DB
    await getBook(MOCK_BOOK_ID)

    // Paso 2: resetear el mock para contar desde cero
    ;(global.fetch as jest.Mock).mockClear()

    // Paso 3: segunda llamada → debería leer de la caché local
    const book = await getBook(MOCK_BOOK_ID)

    // Paso 4: verificar que no se llamó a googleapis.com (solo Supabase)
    const apiCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([url]: [string]) => String(url).includes('googleapis.com')
    )
    expect(apiCalls.length).toBe(0)
    expect(book?.google_books_id).toBe(MOCK_BOOK_ID)
  })
})

// ── Test 2: searchBooks ───────────────────────────────────────

describe('searchBooks', () => {
  beforeEach(async () => {
    await adminClient.from('books').delete().eq('google_books_id', MOCK_BOOK_ID)
  })

  it('retorna resultados y los guarda en la DB cuando la caché local está vacía', async () => {
    const results = await searchBooks('Harry Potter', { maxResults: 5 })

    // Paso 1: debe haber al menos 1 resultado (el que retornó el mock de la API)
    expect(results.length).toBeGreaterThan(0)

    // Paso 2: los resultados tienen los campos básicos
    for (const book of results) {
      expect(book.title).toBeTruthy()
      expect(book.google_books_id).toBeTruthy()
    }

    // Paso 3: verificar que se guardó en la DB
    const { data } = await adminClient
      .from('books')
      .select('google_books_id')
      .eq('google_books_id', MOCK_BOOK_ID)
    expect(data?.length).toBeGreaterThan(0)
  })
})

// ── Test 3: getBookByIsbn ─────────────────────────────────────

describe('getBookByIsbn', () => {
  beforeEach(async () => {
    await adminClient.from('books').delete().eq('google_books_id', MOCK_BOOK_ID)
  })

  it('busca por ISBN-13 y guarda el libro en la DB', async () => {
    const book = await getBookByIsbn(MOCK_ISBN_13)

    expect(book).not.toBeNull()
    expect(book?.isbn_13).toBe(MOCK_ISBN_13)
    expect(book?.title).toBeTruthy()
  })
})
