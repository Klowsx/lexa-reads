import { Bell } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { CommunityMenu } from '~/features/feed/components/CommunityMenu'
import { useUnreadCount } from '~/features/notifications/hooks/useUnreadCount'
import { useColors } from '~/theme/colors'

// Comparte la cabecera principal de Stitch entre Inicio, Buscar y Biblioteca con destinos reales.
export function AppHeader() {
  const c = useColors()
  const router = useRouter()
  const { t } = useTranslation()
  const { data: count = 0 } = useUnreadCount()
  return (
    <View className="min-h-16 flex-row items-center justify-between gap-3 border-b border-border bg-bg px-container py-2">
      <View className="flex-row items-center gap-2">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-accent">
          <Text className="font-display-i text-lg text-on-accent">L</Text>
        </View>
        <Text
          accessibilityRole="header"
          className="font-display-sb text-xl text-text"
        >
          Lexa
        </Text>
      </View>
      <View className="flex-row items-center gap-1">
        <CommunityMenu />
        <Pressable
          onPress={() => router.push('/(tabs)/notifications')}
          accessibilityRole="button"
          accessibilityLabel={
            count
              ? t('stitch.shell.unreadNotifications', { count })
              : t('feed.notifications')
          }
          className="relative h-12 w-12 items-center justify-center rounded-full active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Bell size={22} color={c.text} strokeWidth={1.8} />
          {count > 0 && (
            <View
              className="absolute right-2 top-2 h-2 w-2 rounded-full"
              style={{ backgroundColor: c.error }}
            />
          )}
        </Pressable>
      </View>
    </View>
  )
}
