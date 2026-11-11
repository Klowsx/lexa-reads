import { Send, X } from 'lucide-react-native'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '~/theme/colors'
import type { ChatMessage } from '../chat.queries'

const MAX_MESSAGE_LENGTH = 4000

type Props = {
  value: string
  onChangeText: (t: string) => void
  onSend: () => void
  sending: boolean
  replyTo: ChatMessage | null
  onCancelReply: () => void
  disabled?: boolean
  disabledHint?: string
}

// Conserva el borrador mientras se envía e indica el límite de texto y la respuesta citada.
export function MessageComposer({
  value,
  onChangeText,
  onSend,
  sending,
  replyTo,
  onCancelReply,
  disabled,
  disabledHint
}: Props) {
  const c = useColors()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const inputRef = useRef<TextInput>(null)
  const canSend = !!value.trim() && !sending && !disabled

  if (disabled && disabledHint) {
    return (
      <View
        className="border-t border-border bg-surface px-4"
        style={{ paddingBottom: insets.bottom + 12, paddingTop: 12 }}
      >
        <Text className="text-sm font-body text-t3 text-center">
          {disabledHint}
        </Text>
      </View>
    )
  }

  return (
    <View
      className="border-t border-border bg-surface"
      style={{ paddingBottom: insets.bottom + 8 }}
    >
      {replyTo && (
        <View className="flex-row items-center gap-2 mx-3 mt-3 p-3 rounded-xl bg-sr">
          <View className="flex-1 gap-1">
            <Text className="text-xs font-body-sb text-accent">
              {t('chatStates.replying')}
            </Text>
            <Text numberOfLines={1} className="text-sm font-body text-t2">
              {replyTo.deleted_at ? t('chatStates.deleted') : replyTo.body}
            </Text>
          </View>
          <Pressable
            onPress={onCancelReply}
            className="h-12 w-12 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={t('chatStates.cancelReply')}
            disabled={sending}
          >
            <X size={16} color={c.t3} strokeWidth={1.8} />
          </Pressable>
        </View>
      )}

      <View className="flex-row items-center px-3 gap-2 pt-2">
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={t('chatStates.placeholder')}
          accessibilityLabel={t('chatStates.messageInput')}
          editable={!sending && !disabled}
          placeholderTextColor={c.t3}
          maxLength={MAX_MESSAGE_LENGTH}
          multiline
          className="flex-1 text-base font-body text-text rounded-xl px-4 py-3 max-h-[120px] min-h-[48px] bg-sr"
        />
        <Pressable
          onPress={onSend}
          className="h-12 w-12 rounded-full bg-accent items-center justify-center"
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={t('chatStates.send')}
          accessibilityState={{ disabled: !canSend, busy: sending }}
          style={{ opacity: canSend ? 1 : 0.35 }}
        >
          {sending ? (
            <ActivityIndicator size="small" color={c.onAccent} />
          ) : (
            <Send size={22} color={c.onAccent} strokeWidth={1.8} />
          )}
        </Pressable>
      </View>
      <Text
        className="px-4 pt-1 text-xs font-body text-t2"
        accessibilityLabel={t('chatStates.characterCount', {
          count: value.length,
          max: MAX_MESSAGE_LENGTH
        })}
      >
        {value.length} / {MAX_MESSAGE_LENGTH}
      </Text>
    </View>
  )
}
