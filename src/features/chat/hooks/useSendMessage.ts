import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { sendMessageFn, type ChatCursor, type ChatMessage } from "../chat.queries";

type Page = { items: ChatMessage[]; nextCursor: ChatCursor | null };

export type ReplyTarget = { id: string; body: string; sender_id: string } | null;

// Optimistic send: añade un mensaje temporal al frente de la 1ª página (orden
// desc) → revierte en error → reconcilia en settle. El realtime trae el resto.
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const queryKey = ["messages", conversationId];

  return useMutation({
    mutationFn: (params: { body: string; replyTo?: ReplyTarget }) => {
      if (!userId) throw new Error("Not authenticated");
      return sendMessageFn({
        conversationId,
        senderId: userId,
        body: params.body,
        replyToId: params.replyTo?.id ?? null,
      });
    },
    onMutate: async ({ body, replyTo }) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<InfiniteData<Page>>(queryKey);

      const temp: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: userId,
        body,
        reply_to_id: replyTo?.id ?? null,
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        sender: null,
        reply_to: replyTo ?? null,
      };

      queryClient.setQueryData<InfiniteData<Page>>(queryKey, (old) => {
        if (!old) {
          return { pages: [{ items: [temp], nextCursor: null }], pageParams: [undefined] };
        }
        const [first, ...rest] = old.pages;
        return {
          ...old,
          pages: [{ ...first, items: [temp, ...first.items] }, ...rest],
        };
      });

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      if (userId) queryClient.invalidateQueries({ queryKey: ["dm-inbox", userId] });
    },
  });
}
