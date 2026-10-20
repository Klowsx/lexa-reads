import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { ReportSheet } from '~/features/user/components/ReportSheet'
import { useAuthStore } from '~/stores/auth.store'
import { useColors } from '~/theme/colors'
import { deleteMessageFn, type ChatMessage } from '../chat.queries'
import { useMessages } from '../hooks/useMessages'
import { useSendMessage } from '../hooks/useSendMessage'
import { useRealtimeMessages } from '../hooks/useRealtimeMessages'
import { useMarkConversationRead } from '../hooks/useMarkConversationRead'
import { MessageBubble } from './MessageBubble'
import { MessageComposer } from './MessageComposer'

type Props = {
  conversationId: string
  header: ReactNode
  showSender?: boolean
  /** false → solo lectura (p. ej. solicitud no aceptada o no eres miembro). */
  canSend?: boolean
  disabledHint?: string
}

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
  const queryClient = useQueryClient()

  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [reportMsg, setReportMsg] = useState<ChatMessage | null>(null)

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useMessages(conversationId)
  const sendMutation = useSendMessage(conversationId)
  useRealtimeMessages(conversationId)

  const messages = data?.pages.flatMap((p) => p.items) ?? []
  useMarkConversationRead(conversationId, messages.length)

  function send() {
    const body = text.trim()
    if (!body) return
    sendMutation.mutate({
      body,
      replyTo: replyTo
        ? { id: replyTo.id, body: replyTo.body, sender_id: replyTo.sender_id }
        : null
    })
    setText('')
    setReplyTo(null)
  }

  function deleteOwn(m: ChatMessage) {
    deleteMessageFn(m.id)
      .then(() =>
        queryClient.invalidateQueries({
          queryKey: ['messages', conversationId]
        })
      )
      .catch(() => {})
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
          onEndReached={() =>
            hasNextPage && !isFetchingNextPage && fetchNextPage()
          }
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender_id === currentUserId}
              showSender={showSender}
              onReply={setReplyTo}
              onDelete={deleteOwn}
              onReport={setReportMsg}
            />
          )}
        />
      )}

      <MessageComposer
        value={text}
        onChangeText={setText}
        onSend={send}
        sending={sendMutation.isPending}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={!canSend}
        disabledHint={canSend ? undefined : disabledHint}
      />

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
