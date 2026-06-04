import { useInfiniteQuery } from "@tanstack/react-query";
import { messagesInfiniteOptions } from "../chat.queries";

export function useMessages(conversationId: string) {
  return useInfiniteQuery(messagesInfiniteOptions(conversationId));
}
