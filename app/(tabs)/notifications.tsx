import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";
import { Bell } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationRow } from "~/features/notifications/components/NotificationRow";
import { useNotifications } from "~/features/notifications/hooks/useNotifications";
import { useMarkNotificationsRead } from "~/features/notifications/hooks/useMarkNotificationsRead";
import { useNotificationPreferences } from "~/features/user/hooks/useNotificationPreferences";
import { registerPushToken, useSavePushToken } from "~/features/notifications/hooks/usePushOptIn";
import { fixed, useColors } from "~/theme/colors";
import type { NotificationItem } from "~/features/notifications/notifications.queries";

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const router = useRouter();
  const canGoBack = router.canGoBack();
  const markRead = useMarkNotificationsRead();
  const savePushToken = useSavePushToken();
  const { data: prefs } = useNotificationPreferences();
  const pushOptInShown = useRef(false);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useNotifications();

  const items: NotificationItem[] =
    data?.pages.flatMap((p) => p.items) ?? [];

  // Mark all as read when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (items.length > 0) markRead.mutate();
    }, [items.length]),
  );

  // Push opt-in contextual: show after first visit if consent was given and token not set
  useEffect(() => {
    if (pushOptInShown.current) return;
    if (!prefs) return;
    const pushToken = (prefs as any).push_token as string | null | undefined;
    const consentGiven = (prefs as any).consent_given_at as string | null;
    if (consentGiven && pushToken === null) {
      pushOptInShown.current = true;
      // Small delay so the screen finishes rendering first
      const t = setTimeout(() => showPushOptIn(), 1200);
      return () => clearTimeout(t);
    }
  }, [prefs]);

  async function showPushOptIn() {
    Alert.alert(
      "Activar notificaciones",
      "¿Quieres recibir avisos cuando alguien te siga, comente o le dé me gusta a tus publicaciones?",
      [
        {
          text: "Ahora no",
          style: "cancel",
          onPress: () => savePushToken.savePushToken("declined"),
        },
        {
          text: "Activar",
          onPress: async () => {
            const token = await registerPushToken();
            await savePushToken.savePushToken(token);
          },
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        {canGoBack && (
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
          </Pressable>
        )}
        <Text className="font-display-sb text-xl text-text tracking-tight">
          Notificaciones
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accent} />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <View
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: alpha(c.t3, 0.1) }}
          >
            <Bell size={24} color={c.t3} strokeWidth={1.5} />
          </View>
          <Text className="text-sm font-body-sb text-text text-center">
            Sin notificaciones
          </Text>
          <Text className="text-xs font-body text-t3 text-center leading-[20px]">
            Aquí aparecerán los me gusta, seguidores y comentarios que recibas.
          </Text>
        </View>
      ) : (
        <FlashList
          data={items}
          renderItem={({ item }) => <NotificationRow item={item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={c.t3} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
