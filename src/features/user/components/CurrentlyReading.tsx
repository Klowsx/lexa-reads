import { useRouter } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { BookCover } from '~/components/ui/BookCover'
import type { LibraryRow } from '~/features/library/library.queries'
import { useColors } from '~/theme/colors'
import { ProfileEmptyState, ProfileSectionHeading } from './ProfileSection'

interface Props {
  books: LibraryRow[]
  onDiscover?: () => void
}

// Abre la ficha con el identificador del catálogo que espera la ruta de libros.
export function CurrentlyReading({ books, onDiscover }: Props) {
  const c = useColors()
  const router = useRouter()
  const { t } = useTranslation()
  const availableBooks = books.filter((row) => row.books)
  if (!availableBooks.length && !onDiscover) return null

  return (
    <View className="px-container mb-8">
      <ProfileSectionHeading title={t('profile.currentlyReading')} />
      {!availableBooks.length ? (
        <ProfileEmptyState
          message={t('profile.readingEmpty')}
          action={t('profile.findBook')}
          onAction={onDiscover}
        />
      ) : (
        <View className="overflow-hidden rounded-card bg-surface">
          {availableBooks.map((row, index) => {
            const book = row.books!
            const pages = book.page_count
            const current = Math.max(0, row.current_page ?? 0)
            const pct = pages && pages > 0 ? Math.min(current / pages, 1) : null
            const progress =
              pct !== null
                ? t('profile.pageProgress', {
                    current,
                    total: pages,
                    pct: Math.round(pct * 100)
                  })
                : t('profile.noProgress')
            return (
              <Pressable
                key={row.id}
                onPress={() =>
                  router.push({
                    pathname: '/book/[id]',
                    params: { id: book.id }
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={
                  book.title +
                  '. ' +
                  (book.authors?.join(', ') ?? '') +
                  '. ' +
                  progress
                }
                className={
                  index > 0
                    ? 'flex-row gap-4 border-t border-border p-4 active:bg-sr'
                    : 'flex-row gap-4 p-4 active:bg-sr'
                }
              >
                <BookCover book={book} width={80} height={120} />
                <View className="flex-1 min-w-0 justify-center gap-2">
                  <View className="flex-row items-center gap-2">
                    <Text
                      className="flex-1 font-display-sb text-sm text-text"
                      numberOfLines={2}
                    >
                      {book.title}
                    </Text>
                    <ChevronRight size={18} color={c.t2} strokeWidth={1.6} />
                  </View>
                  {book.authors?.length ? (
                    <Text
                      className="font-body text-xs text-t2"
                      numberOfLines={1}
                    >
                      {book.authors.join(', ')}
                    </Text>
                  ) : null}
                  {pct !== null ? (
                    <View className="h-1.5 rounded-full bg-sh overflow-hidden">
                      <View
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.round(pct * 100)}%` }}
                      />
                    </View>
                  ) : null}
                  <Text className="font-body text-xs text-t2">{progress}</Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      )}
    </View>
  )
}
