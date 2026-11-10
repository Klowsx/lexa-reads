import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StitchFeedback } from '~/components/ui/StitchFeedback'
import { ReportSheet } from '~/features/user/components/ReportSheet'
import { useAuthStore } from '~/stores/auth.store'
import { useColors } from '~/theme/colors'
import { type ChatMessage } from '../chat.queries'
import { useMessages } from '../hooks/useMessages'
import { useSendMessage } from '../hooks/useSendMessage'
import { useRealtimeMessages } from '../hooks/useRealtimeMessages'
import { useMarkConversationRead } from '../hooks/useMarkConversationRead'
import { MessageBubble } from './MessageBubble'
import { MessageComposer } from './MessageComposer'
import { MessageActionsSheet } from './MessageActionsSheet'

type Props = {
  conversationId: string
  header: ReactNode
  showSender?: boolean
  /** false → solo lectura (p. ej. solicitud no aceptada o no eres miembro). */
  canSend?: boolean
  disabledHint?: string
}

// Gestiona los estados del hilo sin borrar el borrador hasta que el envío se confirme.
export function ChatThread({
  conversationId,
  header,
  showSender,
  canSend = true,
  disabledHint
}: Props) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { t } = useTranslation()
  const sending = useRef(false)

  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [reportMsg, setReportMsg] = useState<ChatMessage | null>(null)
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null)

  const query = useMessages(conversationId)
  const {
    data,
    isPending: isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  } = query
  const sendMutation = useSendMessage(conversationId)
  useRealtimeMessages(conversationId)

  const messages = data?.pages.flatMap((p) => p.items) ?? []
  const currentReply = replyTo
    ? (messages.find((message) => message.id === replyTo.id) ?? replyTo)
    : null
  const currentActionMessage = actionMessage
    ? (messages.find((message) => message.id === actionMessage.id) ??
      actionMessage)
    : null
  useMarkConversationRead(conversationId, messages.length)

  // Bloquea pulsaciones repetidas y conserva texto y cita si el servidor falla.
  function send() {
    const body = text.trim()
    if (
      !body ||
      body.length > 4000 ||
      sending.current ||
      !canSend ||
      isLoading ||
      (query.isError && !data)
    )
      return
    sending.current = true
    sendMutation.mutate(
      {
        body,
        replyTo:
          currentReply && !currentReply.deleted_at
            ? {
                id: currentReply.id,
                body: currentReply.body,
                sender_id: currentReply.sender_id
              }
            : null
      },
      {
        onSuccess: () => {
          setText('')
          setReplyTo(null)
        },
        onSettled: () => {
          sending.current = false
        }
      }
    )
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ paddingTop: insets.top }}
    >
      {header}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accent} />
        </View>
      ) : query.isError && !data ? (
        <View className="flex-1 justify-center">
          <StitchFeedback
            kind="error"
            title={t('chatStates.loadError')}
            message={t('chatStates.loadErrorHint')}
            action={{
              label: t('common.retry'),
              onPress: () => {
                void query.refetch()
              }
            }}
            busy={query.isFetching}
          />
        </View>
      ) : (
        // FlatList invertida: el patrón estándar de chat (FlashList v2 ya no
        // soporta `inverted`). Los datos vienen newest-first → invertida los
        // muestra con el más nuevo abajo; onEndReached (arriba) carga los viejos.
        <FlatList
          data={messages}
          inverted
          keyExtractor={(m) => m.id}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          contentContainerStyle={{ paddingVertical: 8 }}
          ListEmptyComponent={
            <View style={{ transform: [{ scaleY: -1 }] }}>
              <StitchFeedback
                title={t('chatStates.emptyTitle')}
                message={t(
                  canSend ? 'chatStates.emptyHint' : 'chatStates.waitingHint'
                )}
              />
            </View>
          }
          ListFooterComponent={
            query.isFetchNextPageError ? (
              <StitchFeedback
                kind="error"
                title={t('chatStates.olderError')}
                message={t('chatStates.olderErrorHint')}
                action={{
                  label: t('common.retry'),
                  onPress: () => {
                    void fetchNextPage()
                  }
                }}
                busy={isFetchingNextPage}
              />
            ) : isFetchingNextPage ? (
              <ActivityIndicator color={c.accent} />
            ) : null
          }
          onEndReached={() =>
            hasNextPage &&
            !isFetchingNextPage &&
            !query.isFetchNextPageError &&
            fetchNextPage()
          }
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender_id === currentUserId}
              showSender={showSender}
              onActions={setActionMessage}
            />
          )}
        />
      )}

      {sendMutation.isError && (
        <StitchFeedback
          kind="error"
          title={t('chatStates.sendError')}
          message={t('chatStates.sendErrorHint')}
        />
      )}

      <MessageComposer
        value={text}
        onChangeText={setText}
        onSend={send}
        sending={sendMutation.isPending}
        replyTo={currentReply}
        onCancelReply={() => setReplyTo(null)}
        disabled={!canSend || isLoading || (query.isError && !data)}
        disabledHint={canSend ? undefined : disabledHint}
      />

      {currentActionMessage && !currentActionMessage.deleted_at && (
        <MessageActionsSheet
          message={currentActionMessage}
          isOwn={currentActionMessage.sender_id === currentUserId}
          conversationId={conversationId}
          onClose={() => setActionMessage(null)}
          onReply={(message) => {
            if (!sending.current && canSend) setReplyTo(message)
          }}
          canReply={!sendMutation.isPending && canSend}
          onReport={setReportMsg}
        />
      )}

      {reportMsg && (
        <ReportSheet
          targetType="message"
          targetId={reportMsg.id}
          targetName={reportMsg.body.slice(0, 60)}
          onClose={() => setReportMsg(null)}
        />
      )}
    </KeyboardAvoidingView>
  )
}
