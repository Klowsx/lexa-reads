import { BookmarkPlus } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { BookCover } from '~/components/ui/BookCover'
import { SearchIconButton } from '~/features/search/components/SearchControls'
import { useColors } from '~/theme/colors'
import type { Tables } from '~/types/database'

interface Props {
  book: Tables<'books'>
  onPress: () => void
  onQuickPeek: () => void
}

// Presenta el libro como una fila editorial con una acción de biblioteca independiente.
export function BookCard({ book, onPress, onQuickPeek }: Props) {
  const c = useColors()
  const { t } = useTranslation()
  const metadata = [
    book.published_year,
    book.page_count ? t('book.pagesShort', { count: book.page_count }) : null
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <View className="mb-4 flex-row items-center gap-1 rounded-card bg-surface p-3">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('search.openBook', { title: book.title })}
        className="min-w-0 flex-1 flex-row gap-4 rounded-md py-1 hover:bg-surface active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <BookCover book={book} width={80} height={120} />
        <View className="min-w-0 flex-1 gap-1">
          {metadata ? (
            <Text className="font-body text-xs text-t2">{metadata}</Text>
          ) : null}
          <Text
            className="font-display-sb text-base text-text"
            numberOfLines={2}
          >
            {book.title}
          </Text>
          <Text className="font-body text-xs text-t2" numberOfLines={2}>
            {book.authors?.join(', ') || t('book.unknownAuthor')}
          </Text>
          {book.genres?.[0] ? (
            <Text className="mt-3 font-body text-xs text-t2" numberOfLines={1}>
              {book.genres[0]}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <SearchIconButton
        onPress={onQuickPeek}
        label={t('search.manageBook', { title: book.title })}
      >
        <BookmarkPlus size={21} color={c.t2} strokeWidth={1.75} />
      </SearchIconButton>
    </View>
  )
}
