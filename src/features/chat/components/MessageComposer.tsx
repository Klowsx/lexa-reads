import { Send, X } from "lucide-react-native";
import { useRef } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "~/theme/colors";
import type { ChatMessage } from "../chat.queries";

const MAX_MESSAGE_LENGTH = 4000;

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  onSend: () => void;
  sending: boolean;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  disabled?: boolean;
  disabledHint?: string;
};

export function MessageComposer({
  value,
  onChangeText,
  onSend,
  sending,
  replyTo,
  onCancelReply,
  disabled,
  disabledHint,
}: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const canSend = !!value.trim() && !sending && !disabled;

  if (disabled && disabledHint) {
    return (
      <View
        className="border-t border-border bg-surface px-4"
        style={{ paddingBottom: insets.bottom + 12, paddingTop: 12 }}
      >
        <Text className="text-xs font-body text-t3 text-center">{disabledHint}</Text>
      </View>
    );
  }

  return (
    <View className="border-t border-border bg-surface" style={{ paddingBottom: insets.bottom + 8 }}>
      {replyTo && (
        <View className="flex-row items-center gap-2 px-4 pt-2">
          <View className="flex-1 pl-2" style={{ borderLeftWidth: 2, borderLeftColor: c.accent }}>
            <Text className="text-[11px] font-body-sb text-accent">Respondiendo</Text>
            <Text numberOfLines={1} className="text-[11px] font-body text-t2">
              {replyTo.body}
            </Text>
          </View>
          <Pressable onPress={onCancelReply} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancelar respuesta">
            <X size={16} color={c.t3} strokeWidth={1.8} />
          </Pressable>
        </View>
      )}

      <View className="flex-row items-center px-3 gap-2 pt-2">
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder="Mensaje..."
          placeholderTextColor={c.t3}
          maxLength={MAX_MESSAGE_LENGTH}
          multiline
          className="flex-1 text-sm font-body text-text rounded-2xl px-4 py-2 max-h-[120px] min-h-[40px] border border-border bg-sh"
        />
        <Pressable
          onPress={onSend}
          hitSlop={8}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensaje"
          style={{ opacity: canSend ? 1 : 0.35 }}
        >
          {sending ? (
            <ActivityIndicator size="small" color={c.accent} />
          ) : (
            <Send size={22} color={c.accent} strokeWidth={1.8} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
