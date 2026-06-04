import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar } from "~/components/ui/Avatar";
import { ChatThread } from "~/features/chat/components/ChatThread";
import { conversationMetaQueryOptions } from "~/features/chat/chat.queries";
import { useRespondMessageRequest } from "~/features/chat/hooks/useRespondMessageRequest";
import { useAuthStore } from "~/stores/auth.store";
import { useColors } from "~/theme/colors";

export default function DMThreadScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const convId = conversationId ?? "";
  const userId = useAuthStore((s) => s.user?.id) ?? "";
  const router = useRouter();
  const c = useColors();
  const queryClient = useQueryClient();

  const metaQuery = useQuery(conversationMetaQueryOptions(convId, userId));
  const respond = useRespondMessageRequest();
  const meta = metaQuery.data;
  const other = meta?.other;
  const isPendingRecipient = meta?.isPendingRecipient ?? false;

  function accept() {
    respond.mutate(
      { conversationId: convId, accept: true },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: ["conversation-meta", convId, userId] }),
      },
    );
  }

  function reject() {
    respond.mutate({ conversationId: convId, accept: false }, { onSuccess: () => router.back() });
  }

  const header = (
    <View>
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2.5">
        <Pressable hitSlop={8} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        {other && (
          <Pressable
            className="flex-row items-center gap-2.5 flex-1"
            onPress={() => router.push(`/user/${other.username}`)}
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${other.username}`}
          >
            <Avatar
              displayName={other.display_name ?? other.username}
              username={other.username}
              avatarUrl={other.avatar_url ?? undefined}
              size={34}
            />
            <Text className="font-display-sb text-lg text-text tracking-tight" numberOfLines={1}>
              {other.display_name ?? other.username}
            </Text>
          </Pressable>
        )}
      </View>

      {isPendingRecipient && (
        <View className="px-4 py-3 border-b border-border bg-surface gap-2">
          <Text className="text-xs font-body text-t2 text-center">
            {other?.display_name ?? other?.username ?? "Este usuario"} quiere enviarte mensajes.
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={reject}
              disabled={respond.isPending}
              className="flex-1 py-2.5 rounded-md items-center border border-border bg-sh"
              accessibilityRole="button"
              accessibilityLabel="Rechazar solicitud"
            >
              <Text className="text-xs font-body-md text-text">Rechazar</Text>
            </Pressable>
            <Pressable
              onPress={accept}
              disabled={respond.isPending}
              className="flex-1 py-2.5 rounded-md items-center bg-accent"
              accessibilityRole="button"
              accessibilityLabel="Aceptar solicitud"
            >
              <Text className="text-xs font-body-sb text-white">Aceptar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <ChatThread
      conversationId={convId}
      header={header}
      canSend={!isPendingRecipient}
      disabledHint="Acepta la solicitud para responder."
    />
  );
}
