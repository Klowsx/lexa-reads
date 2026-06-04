import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConversationRow } from "~/features/chat/components/ConversationRow";
import { useDMInbox } from "~/features/chat/hooks/useDMInbox";
import { useColors } from "~/theme/colors";

type Tab = "chats" | "requests";

export default function InboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [tab, setTab] = useState<Tab>("chats");

  const { data, isLoading, refetch, isRefetching } = useDMInbox();

  const { chats, requests } = useMemo(() => {
    const all = data ?? [];
    return {
      chats: all.filter((i) => i.requestState === "open" || i.requestedByMe),
      requests: all.filter((i) => i.requestState === "pending" && !i.requestedByMe),
    };
  }, [data]);

  const list = tab === "chats" ? chats : requests;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">Mensajes</Text>
      </View>

      {/* Segmented */}
      <View className="flex-row border-b border-border">
        {(["chats", "requests"] as Tab[]).map((tk) => {
          const active = tab === tk;
          const label = tk === "chats" ? "Mensajes" : `Solicitudes${requests.length ? ` (${requests.length})` : ""}`;
          return (
            <Pressable
              key={tk}
              onPress={() => setTab(tk)}
              className="flex-1 py-3 items-center"
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={{ borderBottomWidth: 2, borderBottomColor: active ? c.accent : "transparent" }}
            >
              <Text className={`text-xs font-body-sb ${active ? "text-text" : "text-t3"}`}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accent} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => i.conversationId}
          onRefresh={refetch}
          refreshing={isRefetching}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-16 gap-2 px-8">
              <Text className="text-sm font-body-sb text-text">
                {tab === "chats" ? "Sin conversaciones" : "Sin solicitudes"}
              </Text>
              <Text className="text-xs font-body text-t3 text-center">
                {tab === "chats"
                  ? "Escríbele a alguien desde su perfil."
                  : "Aquí aparecerán los mensajes de quienes aún no sigues."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ConversationRow item={item} onPress={() => router.push(`/messages/${item.conversationId}`)} />
          )}
        />
      )}
    </View>
  );
}
