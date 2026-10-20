import { useRouter } from 'expo-router'
import { Info } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { BookCover } from '~/components/ui/BookCover'
import { BottomSheet } from '~/components/ui/BottomSheet'
import { ReadingRecordControls } from '~/features/library/components/ReadingRecordControls'
import { useColors } from '~/theme/colors'
import type { Tables } from '~/types'

// Mantiene una única ficha de lectura para búsqueda, biblioteca, feed, listas y detalle.
export function BookReadingSheet({
  book,
  onClose,
  showSynopsis = true
}: {
  book: Tables<'books'>
  onClose: () => void
  showSynopsis?: boolean
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const c = useColors()
  const [showPagesInfo, setShowPagesInfo] = useState(false)

  // Cierra la hoja antes de navegar para no dejar una ventana sobre la siguiente pantalla.
  function openBook() {
    onClose()
    router.push({
      pathname: '/book/[id]',
      params: { id: book.google_books_id ?? book.id }
    })
  }

  // Usa el identificador persistido al escribir una reseña desde cualquier entrada.
  function writeReview() {
    onClose()
    router.push(`/review/new?bookId=${book.id}`)
  }

  return (
    <BottomSheet title={t('reading.title')} onClose={onClose}>
      <View className="flex-row items-start gap-4">
        <BookCover book={book} width={72} height={108} />
        <View className="min-w-0 flex-1 gap-2">
          <Text className="font-display-sb text-md text-text">
            {book.title}
          </Text>
          <Text className="font-body text-xs text-t2">
            {book.authors?.join(', ') || t('book.unknownAuthor')}
          </Text>
          {!!book.page_count && (
            <Pressable
              onPress={() => setShowPagesInfo(!showPagesInfo)}
              accessibilityRole="button"
              accessibilityLabel={t('book.pagesInfoTitle')}
              accessibilityState={{ expanded: showPagesInfo }}
              aria-expanded={showPagesInfo}
              className="min-h-12 flex-row flex-wrap items-center gap-2 rounded-md active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Text className="font-body text-xs text-t2">
                {t('book.pagesLong', { count: book.page_count })}
              </Text>
              <Info size={18} color={c.t2} />
            </Pressable>
          )}
        </View>
      </View>
      {showPagesInfo && (
        <View className="gap-2">
          <Text className="font-body-sb text-xs text-text">
            {t('book.pagesInfoTitle')}
          </Text>
          <Text className="font-body text-xs text-t2">
            {t('book.pagesInfoBody1')}
          </Text>
          <Text className="font-body text-xs text-t2">
            {t('book.pagesInfoBody2')}
          </Text>
        </View>
      )}
      <ReadingRecordControls bookId={book.id} />
      {showSynopsis && book.description ? (
        <View className="gap-2 border-t border-border pt-4">
          <Text
            accessibilityRole="header"
            className="font-body-sb text-sm text-text"
          >
            {t('book.synopsis')}
          </Text>
          <Text numberOfLines={5} className="font-body text-xs text-t2">
            {book.description}
          </Text>
        </View>
      ) : null}
      <View className="gap-2 border-t border-border pt-4">
        <Pressable
          onPress={openBook}
          accessibilityRole="button"
          className="min-h-12 items-center justify-center rounded-md bg-sr px-4 py-3 active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Text className="font-body-sb text-xs text-text">
            {t('book.viewFullBook')}
          </Text>
        </Pressable>
        <Pressable
          onPress={writeReview}
          accessibilityRole="button"
          className="min-h-12 items-center justify-center rounded-md px-4 py-3 active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Text className="font-body-sb text-xs text-text">
            {t('book.writeReview')}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  )
}
