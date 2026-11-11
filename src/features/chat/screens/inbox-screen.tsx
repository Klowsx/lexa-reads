import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useTranslation } from 'react-i18next'
import { StitchFeedback } from '~/components/ui/StitchFeedback'
import { StitchLoading } from '~/components/ui/StitchLoading'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ConversationRow } from '~/features/chat/components/ConversationRow'
import { useDMInbox } from '~/features/chat/hooks/useDMInbox'
import { useColors } from '~/theme/colors'

type Tab = 'chats' | 'requests'

// Mantiene la bandeja existente y distingue carga, error recuperable y ausencia real de conversaciones.
export default function InboxScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('chats')

  const {
    data,
    isPending: isLoading,
    isError,
    refetch,
    isRefetching
  } = useDMInbox()

  const { chats, requests } = useMemo(() => {
    const all = data ?? []
    return {
      chats: all.filter((i) => i.requestState === 'open' || i.requestedByMe),
      requests: all.filter(
        (i) => i.requestState === 'pending' && !i.requestedByMe
      )
    }
  }, [data])

  const list = tab === 'chats' ? chats : requests

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2 flex-row items-center gap-2">
        <Pressable
          className="h-12 w-12 items-center justify-center rounded-full"
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">
          {t('communityMenu.messages')}
        </Text>
      </View>

      <View className="px-5 pb-5 pt-2 gap-2">
        <Text
          accessibilityRole="header"
          className="font-display text-2xl text-text"
        >
          {t('stitch.social.inboxTitle')}
        </Text>
        <Text className="font-body text-sm text-t2">
          {t('stitch.social.inboxSubtitle')}
        </Text>
      </View>
      {/* Selección de correspondencia */}
      <View className="mx-4 mb-4 flex-row rounded-xl bg-sr p-1">
        {(['chats', 'requests'] as Tab[]).map((tk) => {
          const active = tab === tk
          const label =
            tk === 'chats'
              ? t('communityMenu.messages')
              : `${t('stitch.social.requests')}${requests.length ? ` (${requests.length})` : ''}`
          return (
            <Pressable
              key={tk}
              onPress={() => setTab(tk)}
              className="min-h-12 flex-1 justify-center rounded-lg py-3 items-center"
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={{
                backgroundColor: active ? c.surface : 'transparent'
              }}
            >
              <Text
                className={`text-sm font-body-sb ${active ? 'text-text' : 'text-t3'}`}
              >
                {label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {isLoading ? (
        <StitchLoading />
      ) : isError && !data ? (
        <StitchFeedback
          kind="error"
          title={t('communityStates.inboxError')}
          message={t('communityStates.retryHint')}
          action={{
            label: t('common.retry'),
            onPress: () => {
              void refetch()
            }
          }}
          busy={isRefetching}
        />
      ) : (
        <FlashList
          data={list}
          keyExtractor={(i) => i.conversationId}
          onRefresh={refetch}
          refreshing={isRefetching}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            isError ? (
              <StitchFeedback
                kind="error"
                title={t('communityStates.refreshError')}
                message={t('communityStates.cachedHint')}
                action={{
                  label: t('common.retry'),
                  onPress: () => {
                    void refetch()
                  }
                }}
                busy={isRefetching}
              />
            ) : null
          }
          ListEmptyComponent={
            !isError ? (
              <StitchFeedback
                title={t(
                  tab === 'chats'
                    ? 'communityStates.noConversations'
                    : 'communityStates.noRequests'
                )}
                message={t(
                  tab === 'chats'
                    ? 'communityStates.startConversation'
                    : 'communityStates.requestsHint'
                )}
                action={
                  tab === 'chats'
                    ? {
                        label: t('communityStates.findReaders'),
                        onPress: () => router.push('/(tabs)/search')
                      }
                    : undefined
                }
              />
            ) : null
          }
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              onPress={() => router.push(`/messages/${item.conversationId}`)}
            />
          )}
        />
      )}
    </View>
  )
}
