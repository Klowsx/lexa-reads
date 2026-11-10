import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useColors } from '~/theme/colors'
import { formatRelativeTime } from '~/lib/utils'
import type { ChatMessage } from '../chat.queries'

type Props = {
  message: ChatMessage
  isOwn: boolean
  showSender?: boolean // en clubes: mostrar el nombre del autor
  onActions: (message: ChatMessage) => void
}

// Conserva la presentación del mensaje y expone sus acciones a teclado, lector y pulsación larga.
export function MessageBubble({
  message,
  isOwn,
  showSender,
  onActions
}: Props) {
  const c = useColors()
  const { t } = useTranslation()
  const isDeleted = !!message.deleted_at
  const isTemporary = message.id.startsWith('temp-')

  // No ofrece borrar o citar un identificador temporal que todavía no existe en el servidor.
  function showActions() {
    if (!isDeleted && !isTemporary) onActions(message)
  }

  return (
    <View className={`px-4 py-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
      <Pressable
        onLongPress={showActions}
        onPress={showActions}
        delayLongPress={250}
        accessibilityRole={isDeleted || isTemporary ? 'text' : 'button'}
        accessibilityLabel={isDeleted ? t('chatStates.deleted') : message.body}
        accessibilityHint={
          isDeleted || isTemporary ? undefined : t('chatStates.messageOptions')
        }
        className={`max-w-[78%] rounded-2xl px-3 py-2 ${
          isOwn ? 'bg-accent' : 'bg-surface border border-border'
        }`}
      >
        {showSender && !isOwn && message.sender && (
          <Text
            className="text-[11px] font-body-sb mb-0.5"
            style={{ color: c.accent }}
          >
            {message.sender.display_name ?? message.sender.username}
          </Text>
        )}

        {message.reply_to && !isDeleted && (
          <View
            className="mb-1 pl-2 py-0.5 rounded"
            style={{
              borderLeftWidth: 2,
              borderLeftColor: isOwn ? '#ffffff99' : c.t3
            }}
          >
            <Text
              numberOfLines={1}
              className="text-[11px] font-body"
              style={{ color: isOwn ? '#ffffffcc' : c.t2 }}
            >
              {message.reply_to.body}
            </Text>
          </View>
        )}

        {isDeleted ? (
          <Text
            className="text-xs font-body italic"
            style={{ color: isOwn ? '#ffffffcc' : c.t3 }}
          >
            {t('chatStates.deleted')}
          </Text>
        ) : (
          <Text
            className="text-sm font-body leading-[20px]"
            style={{ color: isOwn ? '#fff' : c.text }}
          >
            {message.body}
          </Text>
        )}

        <Text
          className="text-[10px] font-body mt-0.5 self-end"
          style={{ color: isOwn ? '#ffffffaa' : c.t3 }}
        >
          {isTemporary
            ? t('chatStates.sending')
            : formatRelativeTime(message.created_at)}
          {message.edited_at ? ' · editado' : ''}
        </Text>
      </Pressable>
    </View>
  )
}
