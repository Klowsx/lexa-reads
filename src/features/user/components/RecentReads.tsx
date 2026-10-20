import { useRouter } from 'expo-router'
import { Star } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { BookCover } from '~/components/ui/BookCover'
import type { LibraryRow } from '~/features/library/library.queries'
import { useColors } from '~/theme/colors'
import { ProfileEmptyState, ProfileSectionHeading } from './ProfileSection'

interface Props {
  books: LibraryRow[]
  onViewAll?: () => void
  emptyMessage?: string
}

// Enlaza las lecturas terminadas con su ficha del catálogo para poder editarlas.
export function RecentReads({ books, onViewAll, emptyMessage }: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const c = useColors()
  const availableBooks = books.filter((row) => row.books)

  return (
    <View className="mb-8">
      <View className="px-container">
        <ProfileSectionHeading
          title={t('profile.recentReads')}
          action={availableBooks.length ? t('common.viewAll') : undefined}
          onAction={onViewAll}
        />
      </View>
      {!availableBooks.length ? (
        <View className="px-container">
          <ProfileEmptyState
            message={emptyMessage ?? t('profile.recentEmpty')}
            action={t('profile.viewLibrary')}
            onAction={onViewAll}
          />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 18,
            gap: 16,
            paddingVertical: 2
          }}
        >
          {availableBooks.map((row) => {
            const book = row.books!
            return (
              <Pressable
                key={row.id}
                accessibilityRole="button"
                accessibilityLabel={
                  book.title +
                  (row.rating != null
                    ? ', ' + t('profile.rating', { rating: row.rating })
                    : '')
                }
                onPress={() =>
                  router.push({
                    pathname: '/book/[id]',
                    params: { id: book.google_books_id }
                  })
                }
                className="gap-2 rounded-sm active:opacity-70"
                style={{ width: 108 }}
              >
                <BookCover book={book} width={108} height={162} />
                <Text
                  className="font-body-md text-xs text-text"
                  numberOfLines={2}
                >
                  {book.title}
                </Text>
                {row.rating != null ? (
                  <View className="flex-row gap-1 items-center">
                    <Star
                      size={16}
                      color={c.t2}
                      fill={c.star}
                      strokeWidth={1.4}
                    />
                    <Text className="font-body text-xs text-t2">
                      {row.rating.toString()} / 5
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}
