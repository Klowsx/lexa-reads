import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar } from '~/components/ui/Avatar'
import { ChatThread } from '~/features/chat/components/ChatThread'
import { conversationMetaQueryOptions } from '~/features/chat/chat.queries'
import { useRespondMessageRequest } from '~/features/chat/hooks/useRespondMessageRequest'
import { useAuthStore } from '~/stores/auth.store'
import { useColors } from '~/theme/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { StitchFeedback } from '~/components/ui/StitchFeedback'
import { StitchLoading } from '~/components/ui/StitchLoading'

// No habilita el compositor hasta conocer la conversación, su destinatario y los permisos.
export default function DMThreadScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>()
  const convId = conversationId ?? ''
  const userId = useAuthStore((s) => s.user?.id) ?? ''
  const router = useRouter()
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const metaQuery = useQuery(conversationMetaQueryOptions(convId, userId))
  const respond = useRespondMessageRequest()
  const meta = metaQuery.data
  const other = meta?.other
  const isPendingRecipient = meta?.isPendingRecipient ?? false

  // Actualiza la puerta de acceso tras aceptar; un error mantiene visible la solicitud.
  function accept() {
    if (respond.isPending) return
    respond.mutate(
      { conversationId: convId, accept: true },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({
            queryKey: ['conversation-meta', convId, userId]
          })
      }
    )
  }

  // Vuelve a la bandeja únicamente cuando el servidor confirma el rechazo.
  function reject() {
    if (respond.isPending) return
    respond.mutate(
      { conversationId: convId, accept: false },
      { onSuccess: () => router.back() }
    )
  }

  const header = (
    <View>
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2.5">
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        {other && (
          <Pressable
            className="flex-row items-center gap-2.5 flex-1"
            onPress={() => router.push(`/user/${other.username}`)}
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${other.username}`}
          >
            <Avatar
              displayName={other.display_name ?? other.username}
              username={other.username}
              avatarUrl={other.avatar_url ?? undefined}
              size={34}
            />
            <Text
              className="font-display-sb text-lg text-text tracking-tight"
              numberOfLines={1}
            >
              {other.display_name ?? other.username}
            </Text>
          </Pressable>
        )}
        {!other && (
          <Text className="font-display-sb text-lg text-text">
            {t('communityMenu.messages')}
          </Text>
        )}
      </View>

      {isPendingRecipient && (
        <View className="px-4 py-3 border-b border-border bg-surface gap-2">
          <Text className="text-xs font-body text-t2 text-center">
            {other?.display_name ?? other?.username ?? 'Este usuario'} quiere
            enviarte mensajes.
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={reject}
              disabled={respond.isPending}
              className="flex-1 py-2.5 rounded-md items-center border border-border bg-sh"
              accessibilityRole="button"
              accessibilityLabel="Rechazar solicitud"
            >
              <Text className="text-xs font-body-md text-text">Rechazar</Text>
            </Pressable>
            <Pressable
              onPress={accept}
              disabled={respond.isPending}
              className="flex-1 py-2.5 rounded-md items-center bg-accent"
              accessibilityRole="button"
              accessibilityLabel="Aceptar solicitud"
            >
              <Text className="text-xs font-body-sb text-white">Aceptar</Text>
            </Pressable>
          </View>
          {respond.isError && (
            <StitchFeedback
              kind="error"
              title={t('communityStates.requestError')}
              message={t('communityStates.requestRetryHint')}
            />
          )}
        </View>
      )}
    </View>
  )

  if (metaQuery.isPending || (metaQuery.isError && !meta)) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        {header}
        {metaQuery.isPending ? (
          <StitchLoading />
        ) : (
          <StitchFeedback
            kind="error"
            title={t('communityStates.conversationError')}
            message={t('communityStates.retryHint')}
            action={{
              label: t('common.retry'),
              onPress: () => {
                void metaQuery.refetch()
              }
            }}
            busy={metaQuery.isFetching}
          />
        )}
      </View>
    )
  }

  if (!meta || meta.kind !== 'dm' || !other) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        {header}
        <StitchFeedback
          kind="private"
          title={t('communityStates.unavailableConversation')}
          message={t('communityStates.unavailableHint')}
          action={{ label: t('common.back'), onPress: () => router.back() }}
        />
      </View>
    )
  }

  return (
    <ChatThread
      key={convId}
      conversationId={convId}
      header={header}
      canSend={!isPendingRecipient}
      disabledHint="Acepta la solicitud para responder."
    />
  )
}
