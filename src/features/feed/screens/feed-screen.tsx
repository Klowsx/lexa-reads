import { useRouter } from 'expo-router'
import { Users } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { FeedCard } from '~/features/feed/components/FeedCard'
import { FeedSkeleton } from '~/features/feed/components/FeedSkeleton'
import { useFeed } from '~/features/feed/hooks/useFeed'
import { UserCard } from '~/features/user/components/UserCard'
import { useSearchUsers } from '~/features/user/hooks/useSearchUsers'
import { QueryBoundary } from '~/components/ui/QueryBoundary'
import { useColors } from '~/theme/colors'
import { AppHeader } from '~/components/AppHeader'

// ─── Screen ───────────────────────────────────────────────────

// Presenta actividad reciente y propone lectores si todavía no hay contenido que mostrar.
export default function FeedScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const c = useColors()
  const { t } = useTranslation()

  const feedQuery = useFeed()
  const { isFetchingNextPage, hasNextPage, fetchNextPage } = feedQuery
  const feedItems = feedQuery.data?.pages.flatMap((page) => page.items) ?? []
  const suggestions = useSearchUsers(
    '',
    feedQuery.isSuccess && feedItems.length === 0
  )

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <AppHeader />

      <QueryBoundary query={feedQuery} skeleton={<FeedSkeleton />}>
        {(data) => {
          const items = data.pages.flatMap((p) => p.items)

          if (items.length === 0) {
            return (
              <View className="flex-1 justify-center gap-4 px-8 py-6">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: c.sr }}
                >
                  <Users size={28} color={c.accent} strokeWidth={1.6} />
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
                  className="mt-2 min-h-12 items-center justify-center px-6 py-3 rounded-full bg-accent"
                >
                  <Text className="font-body-sb text-sm text-on-accent">
                    {t('feed.findPeople')}
                  </Text>
                </Pressable>
                {suggestions.data?.length ? (
                  <View className="mt-2 gap-1 rounded-card border border-border bg-surface p-4">
                    <Text className="font-body-sb text-xs text-text">
                      {t('feed.suggestedReaders')}
                    </Text>
                    <View className="mt-2">
                      {suggestions.data.slice(0, 3).map((user) => (
                        <UserCard key={user.id} user={user} />
                      ))}
                    </View>
                  </View>
                ) : null}
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
              ListHeaderComponent={
                <View className="px-4 pt-6 pb-5 gap-2">
                  <Text className="font-display text-2xl text-text">
                    {t('stitch.social.feedTitle')}
                  </Text>
                  <Text className="font-body-sb text-sm text-t2">
                    {t('stitch.social.following')}
                  </Text>
                </View>
              }
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
