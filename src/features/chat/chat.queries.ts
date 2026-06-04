import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";

// NOTA: las tablas de mensajería (conversations, messages, conversation_members)
// aún no están en `database.ts` (se generan con `pnpm gen:types` tras aplicar las
// migraciones 019/020). Hasta entonces accedemos por un cliente sin tipar y
// devolvemos tipos de dominio definidos aquí. Al regenerar, cambiar `sb` por
// `supabase` y quitar los casts.
const sb = supabase as any;

// ── Tipos de dominio ───────────────────────────────────────────

export type MessageUser = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  reply_to_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  sender: MessageUser | null;
  reply_to: { id: string; body: string; sender_id: string } | null;
};

export type DMRequestState = "open" | "pending";

export type ConversationListItem = {
  conversationId: string;
  other: MessageUser;
  requestState: DMRequestState;
  requestedByMe: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: number;
};

// ── Cursor compuesto (created_at, id) — CLAUDE.md §6 ────────────
export type ChatCursor = { created_at: string; id: string };

const MSG_PAGE = 30;

const MSG_COLS = `
  id, conversation_id, sender_id, body, reply_to_id, created_at, edited_at, deleted_at,
  sender:users!messages_sender_id_fkey(id, username, display_name, avatar_url),
  reply_to:messages!messages_reply_to_id_fkey(id, body, sender_id)
`.trim();

function one<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

// ── Bandeja de entrada (DMs) ────────────────────────────────────

async function fetchDMInbox(userId: string): Promise<ConversationListItem[]> {
  const { data, error } = await sb
    .from("conversation_members")
    .select(
      `conversation_id, last_read_at,
       conversation:conversations!inner(id, kind, request_state, requested_by,
         last_message_at, dm_user_low, dm_user_high)`,
    )
    .eq("user_id", userId);
  if (error) throw error;

  const rows = (data ?? []).filter((r: any) => r.conversation?.kind === "dm");

  // Otros participantes en lote.
  const otherIds = rows.map((r: any) => {
    const c = r.conversation;
    return c.dm_user_low === userId ? c.dm_user_high : c.dm_user_low;
  });
  const { data: users } = otherIds.length
    ? await sb.from("users").select("id, username, display_name, avatar_url").in("id", otherIds)
    : { data: [] };
  const userMap = new Map<string, MessageUser>((users ?? []).map((u: MessageUser) => [u.id, u]));

  // Último mensaje + no leídos por conversación (N+1 aceptable a escala MVP;
  // optimizar luego denormalizando o vía RPC — ver docs/clubs-y-chat.md §9).
  const items = await Promise.all(
    rows.map(async (r: any): Promise<ConversationListItem | null> => {
      const c = r.conversation;
      const otherId = c.dm_user_low === userId ? c.dm_user_high : c.dm_user_low;
      const other = userMap.get(otherId);
      if (!other) return null;

      const { data: last } = await sb
        .from("messages")
        .select("body, deleted_at")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let unread = 0;
      if (r.last_read_at) {
        const { count } = await sb
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .neq("sender_id", userId)
          .gt("created_at", r.last_read_at);
        unread = count ?? 0;
      } else {
        const { count } = await sb
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .neq("sender_id", userId);
        unread = count ?? 0;
      }

      return {
        conversationId: c.id,
        other,
        requestState: c.request_state as DMRequestState,
        requestedByMe: c.requested_by === userId,
        lastMessage: last?.deleted_at ? "Mensaje eliminado" : (last?.body ?? null),
        lastMessageAt: c.last_message_at,
        unread,
      };
    }),
  );

  return items
    .filter((x): x is ConversationListItem => x !== null)
    .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
}

export const dmInboxQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["dm-inbox", userId],
    queryFn: () => fetchDMInbox(userId),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });

// ── Mensajes de una conversación (DM o club) ────────────────────

async function fetchMessages(
  conversationId: string,
  cursor?: ChatCursor,
): Promise<{ items: ChatMessage[]; nextCursor: ChatCursor | null }> {
  let query = sb
    .from("messages")
    .select(MSG_COLS)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(MSG_PAGE);

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  const items: ChatMessage[] = (data ?? []).map((row: any) => ({
    ...row,
    sender: one<MessageUser>(row.sender),
    reply_to: one(row.reply_to),
  }));

  const last = items[items.length - 1];
  return {
    items,
    nextCursor:
      items.length === MSG_PAGE && last ? { created_at: last.created_at, id: last.id } : null,
  };
}

export const messagesInfiniteOptions = (conversationId: string) =>
  infiniteQueryOptions({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) => fetchMessages(conversationId, pageParam as ChatCursor | undefined),
    initialPageParam: undefined as ChatCursor | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!conversationId,
  });

// ── Mutaciones / acciones ───────────────────────────────────────

export async function sendMessageFn(params: {
  conversationId: string;
  senderId: string;
  body: string;
  replyToId?: string | null;
}): Promise<ChatMessage> {
  const { data, error } = await sb
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      sender_id: params.senderId,
      body: params.body,
      reply_to_id: params.replyToId ?? null,
    })
    .select(MSG_COLS)
    .single();
  if (error) throw error;
  return { ...data, sender: one<MessageUser>(data.sender), reply_to: one(data.reply_to) };
}

// Devuelve el conversation_id del DM entre `me` y `otherId`, creándolo si no existe.
export async function getOrCreateDMFn(me: string, otherId: string): Promise<string> {
  const low = me < otherId ? me : otherId;
  const high = me < otherId ? otherId : me;

  const { data: existing } = await sb
    .from("conversations")
    .select("id")
    .eq("kind", "dm")
    .eq("dm_user_low", low)
    .eq("dm_user_high", high)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: conv, error } = await sb
    .from("conversations")
    .insert({ kind: "dm", dm_user_low: low, dm_user_high: high })
    .select("id")
    .single();
  if (error) throw error;

  const { error: memErr } = await sb.from("conversation_members").insert([
    { conversation_id: conv.id, user_id: low },
    { conversation_id: conv.id, user_id: high },
  ]);
  if (memErr) throw memErr;

  return conv.id;
}

export async function acceptMessageRequestFn(conversationId: string): Promise<void> {
  const { error } = await sb.rpc("accept_message_request", { p_conv: conversationId });
  if (error) throw error;
}

// Rechazar = borrar la conversación (RLS lo permite a cualquiera del par).
export async function rejectConversationFn(conversationId: string): Promise<void> {
  const { error } = await sb.from("conversations").delete().eq("id", conversationId);
  if (error) throw error;
}

export async function markConversationReadFn(conversationId: string, userId: string): Promise<void> {
  const { error } = await sb
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ── Metadatos de la conversación (header + puerta de solicitud) ──

export type ConversationMeta = {
  conversationId: string;
  kind: "dm" | "club";
  requestState: DMRequestState;
  requestedByMe: boolean;
  isPendingRecipient: boolean; // pendiente y YO soy el receptor → no puedo escribir aún
  other: MessageUser | null;
};

async function fetchConversationMeta(
  conversationId: string,
  userId: string,
): Promise<ConversationMeta | null> {
  const { data: c, error } = await sb
    .from("conversations")
    .select("id, kind, request_state, requested_by, dm_user_low, dm_user_high")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw error;
  if (!c) return null;

  let other: MessageUser | null = null;
  if (c.kind === "dm") {
    const otherId = c.dm_user_low === userId ? c.dm_user_high : c.dm_user_low;
    const { data: u } = await sb
      .from("users")
      .select("id, username, display_name, avatar_url")
      .eq("id", otherId)
      .maybeSingle();
    other = u ?? null;
  }

  const requestedByMe = c.requested_by === userId;
  return {
    conversationId: c.id,
    kind: c.kind,
    requestState: c.request_state,
    requestedByMe,
    isPendingRecipient: c.request_state === "pending" && !requestedByMe,
    other,
  };
}

export const conversationMetaQueryOptions = (conversationId: string, userId: string) =>
  queryOptions({
    queryKey: ["conversation-meta", conversationId, userId],
    queryFn: () => fetchConversationMeta(conversationId, userId),
    enabled: !!conversationId && !!userId,
  });

export async function deleteMessageFn(messageId: string): Promise<void> {
  const { error } = await sb
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId);
  if (error) throw error;
}
