import { Alert, Pressable, Text, View } from "react-native";
import { useColors } from "~/theme/colors";
import { formatRelativeTime } from "~/lib/utils";
import type { ChatMessage } from "../chat.queries";

type Props = {
  message: ChatMessage;
  isOwn: boolean;
  showSender?: boolean; // en clubes: mostrar el nombre del autor
  onReply: (m: ChatMessage) => void;
  onDelete?: (m: ChatMessage) => void;
  onReport?: (m: ChatMessage) => void;
};

export function MessageBubble({ message, isOwn, showSender, onReply, onDelete, onReport }: Props) {
  const c = useColors();
  const isDeleted = !!message.deleted_at;

  function showActions() {
    if (isDeleted) return;
    const actions: Parameters<typeof Alert.alert>[2] = [
      { text: "Responder", onPress: () => onReply(message) },
    ];
    if (isOwn && onDelete) {
      actions.push({ text: "Eliminar", style: "destructive", onPress: () => onDelete(message) });
    } else if (!isOwn && onReport) {
      actions.push({ text: "Reportar", style: "destructive", onPress: () => onReport(message) });
    }
    actions.push({ text: "Cancelar", style: "cancel" });
    Alert.alert("Mensaje", undefined, actions);
  }

  return (
    <View className={`px-4 py-0.5 ${isOwn ? "items-end" : "items-start"}`}>
      <Pressable
        onLongPress={showActions}
        delayLongPress={250}
        accessibilityRole="text"
        accessibilityLabel={isDeleted ? "Mensaje eliminado" : message.body}
        className={`max-w-[78%] rounded-2xl px-3 py-2 ${
          isOwn ? "bg-accent" : "bg-surface border border-border"
        }`}
      >
        {showSender && !isOwn && message.sender && (
          <Text className="text-[11px] font-body-sb mb-0.5" style={{ color: c.accent }}>
            {message.sender.display_name ?? message.sender.username}
          </Text>
        )}

        {message.reply_to && !isDeleted && (
          <View
            className="mb-1 pl-2 py-0.5 rounded"
            style={{ borderLeftWidth: 2, borderLeftColor: isOwn ? "#ffffff99" : c.t3 }}
          >
            <Text
              numberOfLines={1}
              className="text-[11px] font-body"
              style={{ color: isOwn ? "#ffffffcc" : c.t2 }}
            >
              {message.reply_to.body}
            </Text>
          </View>
        )}

        {isDeleted ? (
          <Text
            className="text-xs font-body italic"
            style={{ color: isOwn ? "#ffffffcc" : c.t3 }}
          >
            Mensaje eliminado
          </Text>
        ) : (
          <Text
            className="text-sm font-body leading-[20px]"
            style={{ color: isOwn ? "#fff" : c.text }}
          >
            {message.body}
          </Text>
        )}

        <Text
          className="text-[10px] font-body mt-0.5 self-end"
          style={{ color: isOwn ? "#ffffffaa" : c.t3 }}
        >
          {formatRelativeTime(message.created_at)}
          {message.edited_at ? " · editado" : ""}
        </Text>
      </Pressable>
    </View>
  );
}
