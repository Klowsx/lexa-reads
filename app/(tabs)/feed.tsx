import { Bell } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { FeedCard } from '~/features/feed/components/FeedCard'
import { FEED_INIT } from '~/mock'
import { useColors } from '~/theme/colors'

// ─── Screen ───────────────────────────────────────────────────

export default function FeedScreen() {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const [items, setItems] = useState(FEED_INIT)

  const toggleLike = (id: string) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              liked: !it.liked,
              likes: it.liked ? it.likes - 1 : it.likes + 1
            }
          : it
      )
    )

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center justify-between">
        <Text className="font-display-sb text-xl text-text tracking-tight">
          lexa
        </Text>
        <Pressable hitSlop={8}>
          <Bell size={20} color={c.t3} strokeWidth={1.6} />
        </Pressable>
      </View>
      {/* Feed */}
      <FlashList
        data={items}
        renderItem={({ item }) => (
          <FeedCard item={item} onLike={() => toggleLike(item.id)} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 72 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}
