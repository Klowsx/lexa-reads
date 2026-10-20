import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft, Lock } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ErrorState } from '~/components/ui/ErrorState'
import { Skeleton } from '~/components/ui/Skeleton'
import { useAuthStore } from '~/stores/auth.store'
import { useColors } from '~/theme/colors'
import { cn } from '~/lib/utils'
import { UserCard } from '../components/UserCard'
import { useFollowers } from '../hooks/useFollowers'
import { useFollowing } from '../hooks/useFollowing'
import { useProfile } from '../hooks/useProfile'

// Pagina la comunidad visible y reutiliza el seguimiento real de cada lector, incluida la cuenta propia.
export default function FollowersScreen() {
  const { username = '', tab } = useLocalSearchParams<{
    username: string
    tab?: string
  }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const { t } = useTranslation()
  const viewer = useAuthStore((s) => s.user?.id)
  const [active, setActive] = useState<'followers' | 'following'>(
    tab === 'following' ? 'following' : 'followers'
  )
  const profile = useProfile(username)
  const visible =
    !!profile.data &&
    (!profile.data.is_private ||
      profile.data.id === viewer ||
      (profile.data.follow_status === 'accepted' &&
        !profile.isFetching &&
        !profile.isError))
  const userId = visible ? (profile.data?.id ?? '') : ''
  const followers = useFollowers(active === 'followers' ? userId : '')
  const following = useFollowing(active === 'following' ? userId : '')
  const query = active === 'followers' ? followers : following
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  // Requiere un reintento explícito si falla una página y evita peticiones simultáneas.
  function loadMore() {
    if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError)
      void query.fetchNextPage()
  }
  // Mantiene una salida útil al abrir la comunidad desde un enlace externo.
  function back() {
    if (router.canGoBack()) router.back()
    else router.replace({ pathname: '/user/[username]', params: { username } })
  }
  return (
    <View
      className="flex-1 bg-bg"
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }}
    >
      <View className="w-full max-w-[720px] flex-1 self-center">
        <View className="px-container py-2 flex-row items-center gap-2">
          <Pressable
            onPress={back}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            className="h-12 w-12 items-center justify-center rounded-md hover:bg-surface focus-visible:outline focus-visible:outline-accent"
          >
            <ChevronLeft size={24} color={c.text} />
          </Pressable>
          <View className="min-w-0 flex-1">
            <Text className="font-display-sb text-lg text-text">
              {t('social.community')}
            </Text>
            <Text className="font-body text-xs text-t2" numberOfLines={1}>
              @{username}
            </Text>
          </View>
        </View>
        <View className="mx-container flex-row border-b border-border mb-4">
          {(['followers', 'following'] as const).map((value) => (
            <Pressable
              key={value}
              onPress={() => setActive(value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active === value }}
              className={cn(
                'flex-1 min-h-12 py-3 items-center border-b-2 focus-visible:outline focus-visible:outline-accent',
                active === value ? 'border-accent' : 'border-transparent'
              )}
            >
              <Text
                className={cn(
                  'text-xs text-text',
                  active === value ? 'font-body-sb' : 'font-body'
                )}
              >
                {t(`social.${value}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        {profile.isPending ? (
          <View className="px-container gap-4">
            <Skeleton height={72} />
            <Skeleton height={72} />
          </View>
        ) : profile.isError ? (
          <ErrorState onRetry={() => void profile.refetch()} />
        ) : !profile.data ? (
          <View className="px-container py-10">
            <Text className="font-body text-sm text-text">
              {t('social.unavailable')}
            </Text>
          </View>
        ) : !visible ? (
          <View className="px-container py-10 items-center gap-3">
            <Lock size={28} color={c.t2} />
            <Text className="font-display-sb text-lg text-text">
              {t('social.privateAccount')}
            </Text>
            <Text className="font-body text-sm text-t2 text-center">
              {t('social.privateHint')}
            </Text>
          </View>
        ) : query.isPending ? (
          <View className="px-container gap-4">
            <Skeleton height={72} />
            <Skeleton height={72} />
          </View>
        ) : query.isError && !query.data ? (
          <ErrorState onRetry={() => void query.refetch()} />
        ) : (
          <FlashList
            key={active}
            data={items}
            keyExtractor={(item) => item.follow_id}
            renderItem={({ item }) => <UserCard user={item.user} />}
            contentContainerStyle={{
              paddingHorizontal: 18,
              paddingBottom: Math.max(insets.bottom, 24)
            }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.35}
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
            ListEmptyComponent={
              <View className="py-10 gap-3">
                <Text className="font-display-sb text-lg text-text text-center">
                  {t(`social.empty.${active}`)}
                </Text>
                <Text className="font-body text-sm text-t2 text-center">
                  {t('social.communityHint')}
                </Text>
              </View>
            }
            ListFooterComponent={
              <View className="items-center py-4 gap-2">
                {query.isFetchingNextPage ? (
                  <ActivityIndicator color={c.text} />
                ) : query.isFetchNextPageError ? (
                  <>
                    <Text
                      accessibilityRole="alert"
                      className="font-body text-xs text-t2"
                    >
                      {t('social.pageError')}
                    </Text>
                    <Pressable
                      onPress={() => void query.fetchNextPage()}
                      accessibilityRole="button"
                      className="min-h-12 justify-center rounded-md bg-sr px-4"
                    >
                      <Text className="font-body-sb text-xs text-text">
                        {t('common.retry')}
                      </Text>
                    </Pressable>
                  </>
                ) : query.hasNextPage ? (
                  <Pressable
                    onPress={loadMore}
                    accessibilityRole="button"
                    className="min-h-12 justify-center rounded-md bg-sr px-4"
                  >
                    <Text className="font-body-sb text-xs text-text">
                      {t('social.loadMore')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            }
          />
        )}
      </View>
    </View>
  )
}
