import { BookReadingSheet } from './BookReadingSheet'
import type { Tables } from '~/types'

// Reutiliza el registro completo sin perder el contexto de búsqueda.
export function QuickPeekSheet(props: {
  book: Tables<'books'>
  onClose: () => void
}) {
  return <BookReadingSheet {...props} showSynopsis={false} />
}
