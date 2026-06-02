import { useRouter } from 'expo-router';
import { Bell, Users } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { FeedCard } from '~/features/feed/components/FeedCard';
import { useFeed } from '~/features/feed/hooks/useFeed';
import { fixed, useColors } from '~/theme/colors';

// ─── Screen ───────────────────────────────────────────────────

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useColors();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFeed();

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center justify-between">
        <Text className="font-display-sb text-xl text-text tracking-tight">lexa</Text>
        <Pressable hitSlop={8} onPress={() => router.push('/notifications' as any)}>
          <Bell size={20} color={c.t3} strokeWidth={1.6} />
        </Pressable>
      </View>

      {/* Loading */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accent} />
        </View>
      )}

      {/* Empty state — user follows nobody */}
      {!isLoading && items.length === 0 && (
        <View className="flex-1 items-center justify-center px-8 gap-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: `${fixed.accent}1A` }}
          >
            <Users size={28} color={fixed.accent} strokeWidth={1.6} />
          </View>
          <Text className="font-display-sb text-lg text-text text-center tracking-tight">
            Tu feed está vacío
          </Text>
          <Text className="font-body text-sm text-t3 text-center" style={{ lineHeight: 20 }}>
            Sigue a otras lectoras para ver su actividad aquí.
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/search' as any)}
            className="mt-2 px-6 py-3 rounded-full"
            style={{ backgroundColor: fixed.accent }}
          >
            <Text className="font-body-sb text-sm text-white">Buscar personas</Text>
          </Pressable>
        </View>
      )}

      {/* Feed list */}
      {!isLoading && items.length > 0 && (
        <FlashList
          data={items}
          renderItem={({ item }) => <FeedCard item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 72 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator color={c.accent} size="small" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
