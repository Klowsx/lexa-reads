import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Bell, ChevronLeft } from 'lucide-react-native'
import { FlashList } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NotificationRow } from '~/features/notifications/components/NotificationRow'
import { useNotifications } from '~/features/notifications/hooks/useNotifications'
import { useMarkNotificationsRead } from '~/features/notifications/hooks/useMarkNotificationsRead'
import { useNotificationPreferences } from '~/features/user/hooks/useNotificationPreferences'
import { PushOptInSheet } from '~/features/notifications/components/PushOptInSheet'
import { StitchFeedback } from '~/components/ui/StitchFeedback'
import { StitchLoading } from '~/components/ui/StitchLoading'
import { useColors } from '~/theme/colors'
import type { NotificationItem } from '~/features/notifications/notifications.queries'

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`
}

// Presenta los avisos y explica el permiso push únicamente al visitar esta sección.
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const router = useRouter()
  const { t } = useTranslation()
  const canGoBack = router.canGoBack()
  const { mutate: markRead } = useMarkNotificationsRead()
  const { data: prefs } = useNotificationPreferences()
  const pushOptInShown = useRef(false)
  const [showPushOptIn, setShowPushOptIn] = useState(false)

  const query = useNotifications()
  const {
    data,
    isPending: isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = query

  const items: NotificationItem[] = data?.pages.flatMap((p) => p.items) ?? []

  // Marca los avisos como leídos al visitar la bandeja.
  useFocusEffect(
    useCallback(() => {
      if (items.length > 0) markRead()
    }, [items.length, markRead])
  )

  // Cancela el aviso al salir antes de que aparezca; marcarlo al mostrar evita perderlo en StrictMode.
  useFocusEffect(
    useCallback(() => {
      if (
        pushOptInShown.current ||
        !prefs?.consent_given_at ||
        prefs.push_token !== null ||
        !(
          prefs.push_new_follower ||
          prefs.push_activity_like ||
          prefs.push_review_like ||
          prefs.push_comment ||
          prefs.push_recommendation
        )
      )
        return
      const timer = setTimeout(() => {
        pushOptInShown.current = true
        setShowPushOptIn(true)
      }, 1200)
      return () => clearTimeout(timer)
    }, [prefs])
  )

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        {canGoBack && (
          <Pressable
            className="h-12 w-12 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
          </Pressable>
        )}
        <Text className="font-display-sb text-xl text-text tracking-tight">
          Lexa
        </Text>
      </View>

      <View className="px-4 pt-6 pb-5 gap-2">
        <Text className="font-display text-2xl text-text">
          {t('notifications.title')}
        </Text>
        <Text className="font-body text-sm text-t2">
          {t('stitch.social.notificationsHint')}
        </Text>
      </View>
      {isLoading ? (
        <StitchLoading />
      ) : query.isError && (!data || items.length === 0) ? (
        <StitchFeedback
          kind="error"
          title={t('pushPermission.loadError')}
          message={t('pushPermission.loadErrorHint')}
          action={{
            label: t('common.retry'),
            onPress: () => {
              void query.refetch()
            }
          }}
          busy={query.isFetching}
        />
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <View
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: alpha(c.t3, 0.1) }}
          >
            <Bell size={24} color={c.t3} strokeWidth={1.5} />
          </View>
          <Text className="text-sm font-body-sb text-text text-center">
            {t('notifications.emptyTitle')}
          </Text>
          <Text className="text-sm font-body text-t3 text-center leading-[20px]">
            {t('notifications.emptySubtitle')}
          </Text>
        </View>
      ) : (
        <FlashList
          data={items}
          renderItem={({ item }) => <NotificationRow item={item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            query.isRefetchError && !query.isFetchNextPageError ? (
              <StitchFeedback
                kind="error"
                title={t('communityStates.refreshError')}
                message={t('communityStates.cachedHint')}
                action={{
                  label: t('common.retry'),
                  onPress: () => {
                    void query.refetch()
                  }
                }}
                busy={query.isFetching}
              />
            ) : null
          }
          onEndReached={() =>
            hasNextPage &&
            !isFetchingNextPage &&
            !query.isFetchNextPageError &&
            fetchNextPage()
          }
          onEndReachedThreshold={0.4}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListFooterComponent={
            query.isFetchNextPageError ? (
              <StitchFeedback
                kind="error"
                title={t('pushPermission.pageError')}
                message={t('communityStates.cachedHint')}
                action={{
                  label: t('common.retry'),
                  onPress: () => {
                    void fetchNextPage()
                  }
                }}
                busy={isFetchingNextPage}
              />
            ) : isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={c.t3} />
              </View>
            ) : null
          }
        />
      )}
      {showPushOptIn && (
        <PushOptInSheet onClose={() => setShowPushOptIn(false)} />
      )}
    </View>
  )
}
