import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Avatar } from '~/components/ui/Avatar'
import { useColors } from '~/theme/colors'
import { formatRelativeTime } from '~/lib/utils'
import type { ConversationListItem } from '../chat.queries'

// Presenta correspondencia real con identidad, extracto y estado no leído en una tarjeta de Stitch.
export function ConversationRow({
  item,
  onPress
}: {
  item: ConversationListItem
  onPress: () => void
}) {
  const { t } = useTranslation()
  const c = useColors()
  return (
    <Pressable
      onPress={onPress}
      className="mx-4 mb-3 flex-row items-start gap-4 rounded-xl bg-surface p-4 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={t('stitch.social.conversationWith', {
        name: item.other.display_name ?? item.other.username
      })}
    >
      <Avatar
        displayName={item.other.display_name ?? item.other.username}
        username={item.other.username}
        avatarUrl={item.other.avatar_url ?? undefined}
        size={48}
      />
      <View className="flex-1 min-w-0 gap-2">
        <View className="flex-row items-start gap-2">
          <Text
            className="flex-1 font-body-sb text-base text-text"
            numberOfLines={2}
          >
            {item.other.display_name ?? item.other.username}
          </Text>
          {item.unread > 0 && (
            <View
              className="min-h-6 min-w-6 items-center justify-center rounded-full px-1.5"
              style={{ backgroundColor: c.accent }}
            >
              <Text
                className="font-body-sb text-xs"
                style={{ color: c.onAccent }}
              >
                {item.unread}
              </Text>
            </View>
          )}
        </View>
        <Text className="font-body text-xs text-t2">
          @{item.other.username}
          {item.lastMessageAt
            ? ` · ${formatRelativeTime(item.lastMessageAt)}`
            : ''}
        </Text>
        <Text
          className={`font-body text-sm leading-[22px] ${item.unread > 0 ? 'text-text' : 'text-t2'}`}
          numberOfLines={2}
        >
          {item.lastMessage ?? t('stitch.social.noMessages')}
        </Text>
      </View>
    </Pressable>
  )
}
