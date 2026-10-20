import { useRouter } from 'expo-router'
import { Bell, MessageCircle, Users } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { FeedCard } from '~/features/feed/components/FeedCard'
import { FeedSkeleton } from '~/features/feed/components/FeedSkeleton'
import { useFeed } from '~/features/feed/hooks/useFeed'
import { QueryBoundary } from '~/components/ui/QueryBoundary'
import { fixed, useColors } from '~/theme/colors'

// ─── Screen ───────────────────────────────────────────────────

export default function FeedScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const c = useColors()
  const { t } = useTranslation()

  const feedQuery = useFeed()
  const { isFetchingNextPage, hasNextPage, fetchNextPage } = feedQuery

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center justify-between">
        <Text className="font-display-sb text-xl text-text tracking-tight">
          {t('feed.title')}
        </Text>
        <View className="flex-row items-center gap-4">
          <Pressable
            hitSlop={8}
            onPress={() => router.push('/clubs' as any)}
            accessibilityRole="button"
            accessibilityLabel="Clubes de lectura"
          >
            <Users size={20} color={c.t3} strokeWidth={1.6} />
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() => router.push('/messages' as any)}
            accessibilityRole="button"
            accessibilityLabel="Mensajes"
          >
            <MessageCircle size={20} color={c.t3} strokeWidth={1.6} />
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() => router.push('/notifications' as any)}
            accessibilityRole="button"
            accessibilityLabel={t('feed.notifications')}
          >
            <Bell size={20} color={c.t3} strokeWidth={1.6} />
          </Pressable>
        </View>
      </View>

      <QueryBoundary query={feedQuery} skeleton={<FeedSkeleton />}>
        {(data) => {
          const items = data.pages.flatMap((p) => p.items)

          if (items.length === 0) {
            return (
              <View className="flex-1 items-center justify-center px-8 gap-4">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${fixed.accent}1A` }}
                >
                  <Users size={28} color={fixed.accent} strokeWidth={1.6} />
                </View>
                <Text className="font-display-sb text-lg text-text text-center tracking-tight">
                  {t('feed.emptyTitle')}
                </Text>
                <Text className="font-body text-sm text-t3 text-center leading-[20px]">
                  {t('feed.emptySubtitle')}
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/search' as any)}
                  accessibilityRole="button"
                  accessibilityLabel={t('feed.findPeople')}
                  className="mt-2 px-6 py-3 rounded-full bg-accent"
                >
                  <Text className="font-body-sb text-sm text-white">
                    {t('feed.findPeople')}
                  </Text>
                </Pressable>
              </View>
            )
          }

          return (
            <FlashList
              data={items}
              renderItem={({ item }) => <FeedCard item={item} />}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 72 }}
              showsVerticalScrollIndicator={false}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) fetchNextPage()
              }}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View className="py-4 items-center">
                    <ActivityIndicator color={c.accent} size="small" />
                  </View>
                ) : null
              }
            />
          )
        }}
      </QueryBoundary>
    </View>
  )
}
