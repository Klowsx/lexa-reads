export type BookStatus = 'want_to_read' | 'reading' | 'read' | 'abandoned'

// labelKey apunta a la traducción i18n (book.status.*). Los componentes
// resuelven el texto con t(meta.labelKey) — así el catálogo de estados no
// arrastra strings hardcodeados. colorRole se resuelve con el tema activo en cada consumidor.
export const STATUS_META: Record<
  BookStatus,
  { labelKey: string; colorRole: 'want' | 'reading' | 'read' | 'abandoned' }
> = {
  want_to_read: {
    labelKey: 'book.status.want_to_read',
    colorRole: 'want'
  },
  reading: { labelKey: 'book.status.reading', colorRole: 'reading' },
  read: { labelKey: 'book.status.read', colorRole: 'read' },
  abandoned: {
    labelKey: 'book.status.abandoned',
    colorRole: 'abandoned'
  }
}

export const STATUS_ORDER: BookStatus[] = [
  'want_to_read',
  'reading',
  'read',
  'abandoned'
]
