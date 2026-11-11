import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Avatar } from '~/components/ui/Avatar'
import { alpha, useColors } from '~/theme/colors'
import { formatRelativeTime } from '~/lib/utils'
import type { ChatMessage } from '../chat.queries'

type Props = {
  message: ChatMessage
  isOwn: boolean
  showSender?: boolean
  onActions: (message: ChatMessage) => void
}

// Distingue autoría y citas mediante superficies editoriales sin usar color como única señal.
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
  const foreground = isOwn ? c.onAccent : c.text

  // Solo ofrece acciones cuando el mensaje ya existe y no se ha retirado.
  function showActions() {
    if (!isDeleted && !isTemporary) onActions(message)
  }

  return (
    <View className={`px-4 py-2 gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
      {showSender && !isOwn && message.sender && (
        <View className="flex-row items-center gap-2 pb-1">
          <Avatar
            displayName={message.sender.display_name ?? message.sender.username}
            username={message.sender.username}
            avatarUrl={message.sender.avatar_url ?? undefined}
            size={28}
          />
          <Text className="font-body-sb text-sm text-text">
            {message.sender.display_name ?? message.sender.username}
          </Text>
        </View>
      )}
      <Pressable
        onLongPress={showActions}
        onPress={showActions}
        delayLongPress={250}
        accessibilityRole={isDeleted || isTemporary ? 'text' : 'button'}
        accessibilityLabel={isDeleted ? t('chatStates.deleted') : message.body}
        accessibilityHint={
          isDeleted || isTemporary ? undefined : t('chatStates.messageOptions')
        }
        className="min-h-12 max-w-[88%] gap-2 rounded-xl px-4 py-3"
        style={{
          backgroundColor: isOwn ? c.accent : c.surface,
          borderTopRightRadius: isOwn ? 4 : 12,
          borderTopLeftRadius: isOwn ? 12 : 4
        }}
      >
        {message.reply_to && !isDeleted && (
          <View
            className="rounded-lg p-3"
            style={{ backgroundColor: isOwn ? alpha(c.onAccent, 0.12) : c.sr }}
          >
            <Text
              numberOfLines={3}
              className="font-body text-sm italic"
              style={{ color: foreground }}
            >
              {message.reply_to.deleted_at
                ? t('chatStates.deleted')
                : message.reply_to.body}
            </Text>
          </View>
        )}
        <Text
          className={`font-body text-base leading-[24px] ${isDeleted ? 'italic' : ''}`}
          style={{ color: foreground }}
        >
          {isDeleted ? t('chatStates.deleted') : message.body}
        </Text>
      </Pressable>
      <Text className="px-1 font-body text-xs text-t2">
        {isTemporary
          ? t('chatStates.sending')
          : formatRelativeTime(message.created_at)}
        {message.edited_at ? ` · ${t('stitch.social.edited')}` : ''}
      </Text>
    </View>
  )
}
