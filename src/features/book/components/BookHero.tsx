import { ChevronLeft, Share2 } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { BookCover } from '~/components/ui/BookCover'
import { useColors } from '~/theme/colors'
import type { Tables } from '~/types/database'

interface BookHeroProps {
  book: Tables<'books'>
  onBack: () => void
  onShare?: () => void
}

// Presenta la portada y la edición con una jerarquía tranquila y acciones accesibles.
export function BookHero({ book, onBack, onShare }: BookHeroProps) {
  const c = useColors()
  const { t } = useTranslation()

  return (
    <View className="pb-6">
      <View className="flex-row items-center justify-between px-container py-2">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-12 w-12 items-center justify-center rounded-full bg-surface active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ChevronLeft size={24} color={c.text} strokeWidth={1.8} />
        </Pressable>
        {onShare && (
          <Pressable
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel={t('common.share')}
            className="h-12 w-12 items-center justify-center rounded-full bg-surface active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Share2 size={21} color={c.text} strokeWidth={1.8} />
          </Pressable>
        )}
      </View>
      <View className="items-center px-container pt-2">
        <BookCover book={book} width={132} height={198} />
        <Text
          accessibilityRole="header"
          selectable
          className="mt-6 text-center font-display-sb text-xl text-text"
        >
          {book.title}
        </Text>
        {!!book.authors?.length && (
          <Text
            selectable
            className="mt-2 text-center font-body text-sm text-t2"
          >
            {book.authors.join(', ')}
          </Text>
        )}
        {(!!book.page_count || !!book.published_year) && (
          <Text className="mt-3 text-center font-body text-xs text-t2">
            {[
              book.page_count
                ? t('book.pagesLong', { count: book.page_count })
                : null,
              book.published_year?.toString()
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        )}
      </View>
    </View>
  )
}
