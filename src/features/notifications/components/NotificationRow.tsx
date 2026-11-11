import { useRouter } from 'expo-router'
import { Bell, Heart, MessageCircle, UserPlus } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { Avatar } from '~/components/ui/Avatar'
import { useColors } from '~/theme/colors'
import { formatRelativeTime } from '~/lib/utils'
import type {
  NotificationItem,
  NotificationType
} from '../notifications.queries'

// El símbolo identifica el evento sin añadir categorías visuales ajenas al diseño.
const TYPE_CONFIG: Record<NotificationType, { IconComp: typeof Bell }> = {
  new_follower: { IconComp: UserPlus },
  review_like: { IconComp: Heart },
  activity_like: { IconComp: Heart },
  comment_received: { IconComp: MessageCircle },
  reading_challenge_completed: { IconComp: Bell },
  recommendation_received: { IconComp: Bell }
}

// Traduce cada evento del MVP a su pantalla relacionada cuando esa navegación está disponible.
function notificationTarget(
  type: NotificationType,
  referenceId: string | null,
  referenceType: string | null,
  actorUsername?: string
): string | null {
  if (type === 'new_follower' && actorUsername) return `/user/${actorUsername}`
  if (type === 'recommendation_received' && actorUsername)
    return `/user/${actorUsername}`
  if (type === 'review_like') {
    if (referenceId) return `/comments/${referenceId}?type=review`
    if (actorUsername) return `/user/${actorUsername}`
  }
  if (
    (type === 'activity_like' || type === 'comment_received') &&
    referenceId
  ) {
    return `/comments/${referenceId}?type=${referenceType ?? 'activity'}`
  }
  return null
}

interface NotificationRowProps {
  item: NotificationItem
}

// Muestra el actor y el estado real del aviso con acceso a su contexto.
export function NotificationRow({ item }: NotificationRowProps) {
  const c = useColors()
  const router = useRouter()
  const { t } = useTranslation()
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.new_follower
  const actorName =
    item.actor?.display_name ?? item.actor?.username ?? t('notif.someone')
  const actorUsername = item.actor?.username
  const label = t(`notif.${item.type}`, { actor: actorName })
  const isUnread = item.read_at === null
  const target = notificationTarget(
    item.type,
    item.reference_id,
    item.reference_type,
    actorUsername
  )

  // Comparte el contenido entre una fila navegable y un aviso informativo sin acción.
  const content = (
    <>
      {item.actor ? (
        <View className="relative">
          <Avatar
            displayName={item.actor.display_name ?? item.actor.username}
            username={item.actor.username}
            avatarUrl={item.actor.avatar_url ?? undefined}
            size={48}
          />
          <View
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center border border-bg"
            style={{ backgroundColor: c.accent }}
          >
            <config.IconComp size={10} color={c.onAccent} strokeWidth={2.2} />
          </View>
        </View>
      ) : (
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: c.sr }}
        >
          <config.IconComp size={20} color={c.text} strokeWidth={1.8} />
        </View>
      )}

      <View className="flex-1 min-w-0 gap-0.5">
        <Text
          className="text-sm font-body text-text leading-[22px]"
          numberOfLines={3}
        >
          {label}
        </Text>
        <Text className="text-xs font-body text-t3">
          {formatRelativeTime(item.created_at)}
        </Text>
      </View>

      {isUnread && <View className="w-2 h-2 rounded-full shrink-0 bg-accent" />}
    </>
  )

  const rowStyle = { backgroundColor: isUnread ? c.sr : c.surface }

  return target ? (
    <Pressable
      onPress={() => router.push(target as any)}
      accessibilityRole="button"
      className="flex-row items-center mx-4 mb-3 p-4 gap-3 rounded-xl"
      style={rowStyle}
    >
      {content}
    </Pressable>
  ) : (
    <View
      className="flex-row items-center mx-4 mb-3 p-4 gap-3 rounded-xl"
      style={rowStyle}
    >
      {content}
    </View>
  )
}
