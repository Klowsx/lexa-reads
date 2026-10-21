import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { BookCover } from '~/components/ui/BookCover'
import { useSimilarBooks } from '../hooks/useSimilarBooks'
import type { Tables } from '~/types/database'

// Recomienda fichas reales del catálogo que compartan al menos un género.
export function BookSimilarTab({ book }: { book: Tables<'books'> }) {
  const router = useRouter()
  const { t } = useTranslation()
  const similar = useSimilarBooks(book)
  if (similar.isPending)
    return (
      <Text className="px-container py-6 font-body text-xs text-t2">
        {t('common.loading')}
      </Text>
    )
  if (similar.isError)
    return (
      <Pressable
        onPress={() => {
          void similar.refetch()
        }}
        className="min-h-12 justify-center px-container"
      >
        <Text className="font-body-sb text-xs text-accent">
          {t('common.retry')}
        </Text>
      </Pressable>
    )
  if (!similar.data.length)
    return (
      <Text className="px-container py-6 font-body text-xs text-t2">
        {t('book.noSimilar')}
      </Text>
    )
  return (
    <View className="flex-row flex-wrap gap-3 px-container pb-6 pt-4">
      {similar.data?.map((item) => (
        <Pressable
          key={item.id}
          className="w-[30%]"
          onPress={() =>
            router.push({ pathname: '/book/[id]', params: { id: item.id } })
          }
        >
          <BookCover book={item} height={128} />
          <Text
            numberOfLines={2}
            className="mt-2 font-display text-xs text-text"
          >
            {item.title}
          </Text>
          <Text numberOfLines={1} className="font-body text-xs text-t2">
            {item.authors?.[0]}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}
