import { useRouter } from 'expo-router'
import { Bell } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { FeedCard } from '~/features/feed/components/FeedCard'
import { FEED_INIT, NOTIFICATIONS } from '~/mock'
import { useColors } from '~/theme/colors'

// ─── Screen ───────────────────────────────────────────────────

export default function FeedScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const c = useColors()
  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center justify-between">
        <Text className="font-display-sb text-xl text-text tracking-tight">
          lexa
        </Text>
        <Pressable hitSlop={8} onPress={() => router.push('/notifications' as any)}>
          <View>
            <Bell size={20} color={c.t3} strokeWidth={1.6} />
            {unreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: c.accent,
                }}
              />
            )}
          </View>
        </Pressable>
      </View>
      {/* Feed */}
      <FlashList
        data={FEED_INIT}
        renderItem={({ item }) => <FeedCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 72 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}
