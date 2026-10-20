import { fixed } from '~/theme/colors'

export type BookStatus = 'want_to_read' | 'reading' | 'read' | 'abandoned'

// labelKey apunta a la traducción i18n (book.status.*). Los componentes
// resuelven el texto con t(meta.labelKey) — así el catálogo de estados no
// arrastra strings hardcodeados.
export const STATUS_META: Record<
  BookStatus,
  { labelKey: string; color: string }
> = {
  want_to_read: {
    labelKey: 'book.status.want_to_read',
    color: fixed.status.want
  },
  reading: { labelKey: 'book.status.reading', color: fixed.status.reading },
  read: { labelKey: 'book.status.read', color: fixed.status.read },
  abandoned: {
    labelKey: 'book.status.abandoned',
    color: fixed.status.abandoned
  }
}

export const STATUS_ORDER: BookStatus[] = [
  'want_to_read',
  'reading',
  'read',
  'abandoned'
]
