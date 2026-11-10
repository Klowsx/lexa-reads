import { useRef, useState } from 'react'
import { Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { StitchButton } from '~/components/ui/StitchButton'
import { StitchSheet } from '~/components/ui/StitchSheet'
import { useStitchTheme } from '~/theme/stitch'
import type { ChatMessage } from '../chat.queries'
import { useDeleteMessage } from '../hooks/useDeleteMessage'

// Ofrece acciones de mensaje también en web y confirma el borrado antes de ejecutarlo.
export function MessageActionsSheet({
  message,
  isOwn,
  conversationId,
  onReply,
  onReport,
  onClose,
  canReply = true
}: {
  message: ChatMessage
  isOwn: boolean
  conversationId: string
  onReply: (message: ChatMessage) => void
  onReport: (message: ChatMessage) => void
  onClose: () => void
  canReply?: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const remove = useDeleteMessage(conversationId)
  const deleting = useRef(false)
  const c = useStitchTheme()
  const { t } = useTranslation()

  // El mensaje sigue disponible y el diálogo abierto si el servidor rechaza la operación.
  function confirmDelete() {
    if (remove.isPending || deleting.current) return
    deleting.current = true
    remove.mutate(message.id, {
      onSuccess: onClose,
      onSettled: () => {
        deleting.current = false
      }
    })
  }

  return (
    <StitchSheet
      title={t(
        confirming ? 'chatStates.deleteTitle' : 'chatStates.messageOptions'
      )}
      onClose={() => {
        if (!deleting.current) onClose()
      }}
      busy={remove.isPending}
    >
      <Text
        numberOfLines={4}
        style={{
          fontFamily: c.body,
          color: c.secondary,
          fontSize: 16,
          lineHeight: 24
        }}
      >
        {message.body}
      </Text>
      {confirming ? (
        <>
          <Text
            style={{
              fontFamily: c.body,
              color: c.text,
              fontSize: 16,
              lineHeight: 24
            }}
          >
            {t('chatStates.deleteHint')}
          </Text>
          {remove.isError && (
            <Text
              accessibilityRole="alert"
              style={{ fontFamily: c.body, fontSize: 16, color: c.error }}
            >
              {t('chatStates.deleteError')}
            </Text>
          )}
          <StitchButton
            label={t('common.delete')}
            onPress={confirmDelete}
            destructive
            loading={remove.isPending}
          />
          <StitchButton
            label={t('common.cancel')}
            onPress={() => {
              if (!deleting.current) setConfirming(false)
            }}
            secondary
            disabled={remove.isPending}
          />
        </>
      ) : (
        <>
          <StitchButton
            label={t('chatStates.reply')}
            onPress={() => {
              onReply(message)
              onClose()
            }}
            secondary
            disabled={!canReply}
          />
          {isOwn ? (
            <StitchButton
              label={t('common.delete')}
              onPress={() => setConfirming(true)}
              destructive
            />
          ) : (
            <StitchButton
              label={t('chatStates.report')}
              onPress={() => {
                onReport(message)
                onClose()
              }}
              secondary
            />
          )}
        </>
      )}
    </StitchSheet>
  )
}
