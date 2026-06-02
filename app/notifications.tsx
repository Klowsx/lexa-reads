import { useRouter } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationItem } from '~/features/notifications/components/NotificationItem';
import { FollowRequestsSection } from '~/features/user/components/FollowRequestsSection';
import { usePendingFollowRequests } from '~/features/user/hooks/usePendingFollowRequests';
import { NOTIFICATIONS, type MockNotification } from '~/mock';
import { useColors } from '~/theme/colors';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useColors();
  const [items, setItems] = useState<MockNotification[]>(NOTIFICATIONS);

  const { data: pendingRequests = [] } = usePendingFollowRequests();

  const unreadCount = items.filter((n) => !n.read).length;

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  const hasContent = pendingRequests.length > 0 || items.length > 0;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">
          Notificaciones
        </Text>
        {unreadCount > 0 && (
          <Pressable
            onPress={markAllRead}
            hitSlop={8}
            className="flex-row items-center gap-1"
          >
            <Check size={14} color={c.accent} strokeWidth={2} />
            <Text className="text-xs font-body-md text-accent">
              Marcar todas
            </Text>
          </Pressable>
        )}
      </View>

      {!hasContent ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="font-display text-2xl text-t3">—</Text>
          <Text className="text-sm font-body-sb text-text text-center">
            Sin notificaciones
          </Text>
          <Text className="text-xs font-body text-t3 text-center leading-[20px]">
            Cuando alguien interactúe con tu perfil o reseñas, lo verás aquí.
          </Text>
        </View>
      ) : (
        <FlashList
          data={items}
          ListHeaderComponent={
            <FollowRequestsSection requests={pendingRequests} />
          }
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={() => markRead(item.id)} />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}
