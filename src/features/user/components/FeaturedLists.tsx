import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { BookCover } from '~/components/ui/BookCover'
import type { ListRow } from '~/features/lists/list.queries'
import { ProfileSectionHeading } from './ProfileSection'

interface Props {
  lists: ListRow[]
  onPress: (list: ListRow) => void
  onManage?: () => void
}

export function FeaturedLists({ lists, onPress, onManage }: Props) {
  const { t } = useTranslation()
  const featured = lists.filter((list) => list.is_featured)
  if (!featured.length) return null

  return (
    <View className="mb-8">
      <View className="px-container">
        <ProfileSectionHeading
          title={t('profile.featured')}
          action={t('profile.manage')}
          onAction={onManage}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 18,
          gap: 16,
          paddingVertical: 2
        }}
      >
        {featured.map((list) => (
          <Pressable
            key={list.id}
            onPress={() => onPress(list)}
            accessibilityRole="button"
            accessibilityLabel={
              list.name +
              ', ' +
              t('lists.booksCount', { count: list.books_count ?? 0 })
            }
            className="w-56 rounded-card p-4 gap-3 bg-surface active:bg-sr"
          >
            <View className="flex-row gap-2 min-h-[90px] items-end" aria-hidden>
              {list.preview_books
                .filter(Boolean)
                .slice(0, 3)
                .map((book) => (
                  <BookCover key={book.id} book={book} width={56} height={84} />
                ))}
              {!list.preview_books.length ? (
                <Text className="font-body text-xs text-t2">
                  {t('lists.emptyList')}
                </Text>
              ) : null}
            </View>
            <View className="gap-1">
              <Text
                className="font-display-sb text-sm text-text"
                numberOfLines={2}
              >
                {list.name}
              </Text>
              <Text className="font-body text-xs text-t2">
                {t('lists.booksCount', { count: list.books_count ?? 0 })}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}
