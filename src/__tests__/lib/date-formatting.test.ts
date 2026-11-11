import i18n from '~/lib/i18n'
import { formatDate, formatRelativeTime } from '~/lib/utils'

jest.mock('~/lib/i18n', () => ({
  __esModule: true,
  default: { resolvedLanguage: 'es', language: 'es' }
}))

describe('Fechas según el idioma de la aplicación', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-10T12:00:00Z'))
    i18n.resolvedLanguage = 'es'
  })
  afterEach(() => jest.useRealTimers())

  it('cambia la fecha y el tiempo relativo a inglés', () => {
    const date = new Date(2026, 10, 10, 12)
    expect(formatDate(date)).toContain('noviembre')
    expect(formatRelativeTime('2026-11-10T10:00:00Z')).toContain('hace')
    i18n.resolvedLanguage = 'en'
    expect(formatDate(date)).toContain('November')
    expect(formatRelativeTime('2026-11-10T10:00:00Z')).toContain('ago')
    expect(formatRelativeTime('2026-11-10T14:00:00Z')).toContain('in ')
  })

  it('omite fechas inválidas y acepta el inicio del epoch', () => {
    expect(formatDate('incorrecta')).toBe('')
    expect(formatRelativeTime('incorrecta')).toBe('')
    expect(formatRelativeTime(null)).toBe('')
    expect(formatDate(0)).not.toBe('')
  })
})
