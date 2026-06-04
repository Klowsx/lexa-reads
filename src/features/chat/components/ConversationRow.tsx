import { Pressable, Text, View } from "react-native";
import { Avatar } from "~/components/ui/Avatar";
import { formatRelativeTime } from "~/lib/utils";
import type { ConversationListItem } from "../chat.queries";

export function ConversationRow({
  item,
  onPress,
}: {
  item: ConversationListItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3 border-b border-border"
      accessibilityRole="button"
      accessibilityLabel={`Conversación con ${item.other.display_name ?? item.other.username}`}
    >
      <Avatar
        displayName={item.other.display_name ?? item.other.username}
        username={item.other.username}
        avatarUrl={item.other.avatar_url ?? undefined}
        size={48}
      />
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-body-sb text-text" numberOfLines={1}>
            {item.other.display_name ?? item.other.username}
          </Text>
          {item.lastMessageAt && (
            <Text className="text-[11px] font-body text-t3">
              {formatRelativeTime(item.lastMessageAt)}
            </Text>
          )}
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className={`flex-1 text-xs font-body ${item.unread > 0 ? "text-text" : "text-t3"}`}
            numberOfLines={1}
          >
            {item.lastMessage ?? "Sin mensajes aún"}
          </Text>
          {item.unread > 0 && (
            <View className="rounded-full bg-accent min-w-[18px] h-[18px] items-center justify-center px-1.5">
              <Text className="text-[10px] font-body-sb text-white">{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
