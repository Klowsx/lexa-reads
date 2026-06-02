import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Send, Trash2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '~/components/ui/Avatar';
import { useComments } from '~/features/feed/hooks/useComments';
import { useCreateComment } from '~/features/feed/hooks/useCreateComment';
import { useDeleteComment } from '~/features/feed/hooks/useDeleteComment';
import { useAuthStore } from '~/stores/auth.store';
import { fixed, useColors } from '~/theme/colors';
import { formatRelativeTime } from '~/lib/utils';
import type { CommentRow, CommentTargetType } from '~/features/feed/feed.queries';

// ─── Comment row ──────────────────────────────────────────────

function CommentRow({
  comment,
  currentUserId,
  onDelete,
}: {
  comment: CommentRow;
  currentUserId: string | undefined;
  onDelete: () => void;
}) {
  const c = useColors();
  const isOwn = comment.user_id === currentUserId;
  const isDeleted = !!comment.deleted_at;

  if (isDeleted) {
    return (
      <View className="py-3 border-b border-border">
        <Text className="text-xs font-body text-t3 italic">Comentario eliminado.</Text>
      </View>
    );
  }

  function confirmDelete() {
    Alert.alert('Eliminar comentario', '¿Seguro que quieres borrar este comentario?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
    ]);
  }

  return (
    <View className="flex-row gap-2.5 py-3 border-b border-border">
      <Avatar
        displayName={comment.user.display_name ?? comment.user.username}
        username={comment.user.username}
        avatarUrl={comment.user.avatar_url ?? undefined}
        size={34}
      />

      <View className="flex-1 min-w-0">
        <View className="flex-row items-baseline gap-1.5 mb-0.5">
          <Text className="text-xs font-body-sb text-text">
            {comment.user.display_name ?? comment.user.username}
          </Text>
          <Text className="text-xs font-body text-t3">
            {formatRelativeTime(comment.created_at)}
          </Text>
        </View>
        <Text className="text-xs font-body text-t2" style={{ lineHeight: 19 }}>
          {comment.body}
        </Text>
      </View>

      {isOwn && (
        <Pressable onPress={confirmDelete} hitSlop={8} className="self-center">
          <Trash2 size={14} color={c.t3} strokeWidth={1.8} />
        </Pressable>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function CommentsScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState('');

  const currentUserId = useAuthStore((s) => s.user?.id);
  const targetType: CommentTargetType = type === 'review' ? 'review' : 'activity';

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useComments(targetType, id ?? '');

  const createMutation = useCreateComment(targetType, id ?? '');
  const deleteMutation = useDeleteComment(targetType, id ?? '');

  const allComments = data?.pages.flatMap((p) => p.items) ?? [];
  const totalCount = allComments.length;

  function submitComment() {
    const trimmed = text.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed, {
      onSuccess: () => setText(''),
    });
    inputRef.current?.blur();
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">
          Comentarios
        </Text>
        {!isLoading && (
          <Text className="text-xs font-body text-t3">{totalCount}</Text>
        )}
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accent} />
        </View>
      ) : (
        <FlatList
          data={allComments}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          ListEmptyComponent={
            <View className="items-center py-12 gap-2">
              <Text className="text-sm font-body-sb text-text">Sin comentarios</Text>
              <Text className="text-xs font-body text-t3 text-center">
                Sé el primero en comentar.
              </Text>
            </View>
          }
          ListFooterComponent={
            hasNextPage ? (
              <Pressable
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="items-center py-3"
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator color={c.accent} size="small" />
                ) : (
                  <Text className="text-xs font-body-md text-accent">
                    Cargar más
                  </Text>
                )}
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <CommentRow
              comment={item}
              currentUserId={currentUserId}
              onDelete={() => deleteMutation.mutate(item.id)}
            />
          )}
        />
      )}

      {/* Input bar */}
      <View
        className="border-t border-border flex-row items-center px-3 gap-2 bg-surface"
        style={{ paddingBottom: insets.bottom + 8, paddingTop: 8 }}
      >
        <Avatar
          displayName={currentUserId ?? 'Yo'}
          username={currentUserId ?? ''}
          size={32}
        />

        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Añade un comentario..."
          placeholderTextColor={c.t3}
          returnKeyType="send"
          onSubmitEditing={submitComment}
          className="flex-1 text-xs font-body text-text"
          style={{
            backgroundColor: c.sh,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            minHeight: 36,
          }}
        />

        <Pressable
          onPress={submitComment}
          hitSlop={8}
          disabled={createMutation.isPending || !text.trim()}
          style={{ opacity: text.trim() && !createMutation.isPending ? 1 : 0.35 }}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color={c.accent} />
          ) : (
            <Send size={20} color={c.accent} strokeWidth={1.8} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
