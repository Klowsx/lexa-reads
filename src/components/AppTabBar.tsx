import { Bell, BookOpen, Library, Search, User } from 'lucide-react-native'
import type { ComponentProps } from 'react'
import type { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useUnreadCount } from '~/features/notifications/hooks/useUnreadCount'
import { useColors } from '~/theme/colors'

const destinations = {
  feed: BookOpen,
  search: Search,
  library: Library,
  notifications: Bell,
  profile: User
} as const

type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0]

// Mantiene los cinco destinos, etiquetas escalables y áreas táctiles de Stitch sin recrear iconos.
export function AppTabBar({
  state,
  navigation
}: Pick<TabBarProps, 'state' | 'navigation'>) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const { data: unread = 0 } = useUnreadCount()
  return (
    <View
      className="border-t border-border bg-surface"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex-row items-stretch">
        {state.routes.map((route, index) => {
          const name = route.name as keyof typeof destinations
          const Icon = destinations[name]
          if (!Icon) return null
          const selected = state.index === index
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                // Conserva los eventos nativos de pestañas y permite cancelar la navegación.
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true
                })
                if (!selected && !event.defaultPrevented)
                  navigation.navigate(route.name)
              }}
              onLongPress={() =>
                navigation.emit({ type: 'tabLongPress', target: route.key })
              }
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={
                name === 'notifications' && unread
                  ? t('stitch.shell.unreadNotifications', { count: unread })
                  : t(`stitch.shell.tabs.${name}`)
              }
              className="min-h-16 min-w-0 flex-1 items-center justify-start gap-1 px-1 py-2 active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <View
                className="relative h-7 w-9 items-center justify-center rounded-md"
                style={{ backgroundColor: selected ? c.sr : 'transparent' }}
              >
                <Icon
                  size={22}
                  color={selected ? c.accent : c.t2}
                  strokeWidth={selected ? 2 : 1.7}
                />
                {name === 'notifications' && unread > 0 && (
                  <View
                    className="absolute -right-1 -top-1 min-w-4 items-center rounded-full px-1"
                    style={{ backgroundColor: c.error }}
                  >
                    <Text
                      className="font-body-sb text-[10px] leading-[14px]"
                      style={{ color: c.onAccent }}
                    >
                      {unread > 9 ? '9+' : unread}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                className="w-full text-center font-body text-[11px] leading-[14px]"
                style={{ color: selected ? c.accent : c.t2 }}
              >
                {t(`stitch.shell.tabs.${name}`)}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
