import {
  isReadingDate,
  localReadingDate,
  projectReadingRecord,
  validateReadingDates
} from '~/features/library/reading-record'

const today = '2026-10-20'
const project = (
  changes: Parameters<typeof projectReadingRecord>[1],
  previous?: Parameters<typeof projectReadingRecord>[0]
) => projectReadingRecord(previous, changes, 'reader', today)

describe('Registro personal de lectura', () => {
  it('usa el día local y reconoce fechas reales, incluidas las bisiestas', () => {
    expect(localReadingDate(new Date(2026, 0, 2, 23, 30))).toBe('2026-01-02')
    expect(isReadingDate('2024-02-29')).toBe(true)
    for (const value of [
      '2026-02-29',
      '2026-04-31',
      '2026-13-01',
      '20/10/2026',
      '2026-1-1',
      '0000-01-01'
    ])
      expect(isReadingDate(value)).toBe(false)
  })
  it('valida inicio opcional, fin obligatorio, orden y futuro', () => {
    expect(
      validateReadingDates(
        'read',
        { started_at: null, finished_at: today },
        today
      )
    ).toBeNull()
    expect(
      validateReadingDates(
        'read',
        { started_at: null, finished_at: null },
        today
      )
    ).toBe('finishRequired')
    expect(
      validateReadingDates(
        'reading',
        { started_at: '2026-02-30', finished_at: null },
        today
      )
    ).toBe('invalidDate')
    expect(
      validateReadingDates(
        'read',
        { started_at: null, finished_at: '2026-10-21' },
        today
      )
    ).toBe('futureDate')
    expect(
      validateReadingDates(
        'read',
        { started_at: today, finished_at: '2026-10-19' },
        today
      )
    ).toBe('dateOrder')
  })
  it('guardar pendiente o puntuar sin estado no lo cuenta como terminado', () => {
    const record = project({ bookId: 'book', rating: 4.5 })
    expect(record.status).toBe('want_to_read')
    expect(record.started_at).toBeNull()
    expect(record.finished_at).toBeNull()
  })
  it('empezar y terminar propone fechas sin perder puntuación ni etiquetas', () => {
    const pending = project({
      bookId: 'book',
      status: 'want_to_read',
      rating: 3,
      tags: ['favorito']
    })
    const reading = project({ bookId: 'book', status: 'reading' }, pending)
    const read = project({ bookId: 'book', status: 'read' }, reading)
    expect(reading.started_at).toBe(today)
    expect(read.finished_at).toBe(today)
    expect(read.rating).toBe(3)
    expect(read.tags).toEqual(['favorito'])
  })
  it('null elimina realmente la nota y el inicio en la proyección optimista', () => {
    const previous = project({
      bookId: 'book',
      status: 'read',
      rating: 3,
      started_at: '2026-01-02'
    })
    const changed = project(
      { bookId: 'book', rating: null, started_at: null },
      previous
    )
    expect(changed.rating).toBeNull()
    expect(changed.started_at).toBeNull()
    expect(changed.finished_at).toBe(today)
  })
  it('editar puntuación o repetir estado conserva el año original', () => {
    const previous = project({
      bookId: 'book',
      status: 'read',
      finished_at: '2025-12-31'
    })
    const changed = project(
      { bookId: 'book', status: 'read', rating: 5 },
      previous
    )
    expect(changed.finished_at).toBe('2025-12-31')
    expect(changed.id).toBe(previous.id)
  })
  it('no inventa la finalización de una lectura histórica al editar su nota', () => {
    const previous = {
      ...project({ bookId: 'book', status: 'read' }),
      finished_at: null
    }
    expect(
      project({ bookId: 'book', rating: 5 }, previous).finished_at
    ).toBeNull()
  })
  it('reanudar, abandonar y volver a pendiente retira la finalización', () => {
    const previous = project({
      bookId: 'book',
      status: 'read',
      started_at: '2025-01-01',
      finished_at: '2025-01-02',
      rating: 4
    })
    const reading = project({ bookId: 'book', status: 'reading' }, previous)
    const abandoned = project({ bookId: 'book', status: 'abandoned' }, reading)
    const pending = project(
      { bookId: 'book', status: 'want_to_read' },
      abandoned
    )
    expect(reading.started_at).toBe(today)
    expect(abandoned.started_at).toBe(today)
    expect(pending.started_at).toBeNull()
    for (const result of [reading, abandoned, pending]) {
      expect(result.finished_at).toBeNull()
      expect(result.rating).toBe(4)
    }
  })
})
