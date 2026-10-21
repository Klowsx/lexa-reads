import { isIsbn13, normalizeIsbn13 } from '~/features/book/isbn'

describe('ISBN-13', () => {
  it('normaliza los separadores habituales antes de buscar', () => {
    expect(normalizeIsbn13('978-84-376-0494-7')).toBe('9788437604947')
    expect(normalizeIsbn13(' 978 84 376 0494 7 ')).toBe('9788437604947')
  })

  it('solo reconoce ISBN-13 completos para el alta comunitaria', () => {
    expect(isIsbn13('978-84-376-0494-7')).toBe(true)
    expect(isIsbn13('84-376-0494-X')).toBe(false)
    expect(isIsbn13('un título')).toBe(false)
  })
})
