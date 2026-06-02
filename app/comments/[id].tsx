import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, ChevronLeft, Send } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '~/components/ui/Avatar';
import { MockBookCover } from '~/components/ui/MockBookCover';
import { StarRating } from '~/components/ui/StarRating';
import {
  ACT_LABEL,
  FEED_COMMENTS,
  FEED_INIT,
  type MockComment,
} from '~/mock';
import { fixed, useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const ME_MOCK = { av: 'JM', avC: '#C4783A' };

// ─── Comment row ──────────────────────────────────────────────

function CommentRow({ comment, onLike }: { comment: MockComment; onLike: () => void }) {
  const c = useColors();

  return (
    <View
      className="flex-row gap-2.5 py-3"
      style={{ borderBottomWidth: 1, borderBottomColor: c.border }}
    >
      <Avatar user={comment.user} size={34} />

      <View className="flex-1 min-w-0">
        <View className="flex-row items-baseline gap-1.5 mb-0.5">
          <Text className="text-xs font-body-sb text-text">{comment.user.name}</Text>
          <Text className="text-xs font-body text-t3">{comment.time}</Text>
        </View>
        <Text className="text-xs font-body text-t2" style={{ lineHeight: 19 }}>
          {comment.text}
        </Text>

        <Pressable
          onPress={onLike}
          className="flex-row items-center gap-1 mt-2"
          hitSlop={8}
        >
          <Heart
            size={13}
            color={comment.liked ? fixed.accent : c.t3}
            fill={comment.liked ? fixed.accent : 'none'}
            strokeWidth={1.8}
          />
          {comment.likes > 0 && (
            <Text
              className="text-xs font-body"
              style={{ color: comment.liked ? fixed.accent : c.t3 }}
            >
              {comment.likes}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const item = FEED_INIT.find((f) => f.id === id) ?? FEED_INIT[0];
  const [comments, setComments] = useState<MockComment[]>(
    FEED_COMMENTS[id] ?? []
  );
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  function toggleLike(commentId: string) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
  }

  function submitComment() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setComments((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        user: { id: 'me', username: 'javierml', name: 'Javier M.', av: 'JM', avC: '#C4783A' },
        text: trimmed,
        time: 'ahora',
        liked: false,
        likes: 0,
      },
    ]);
    setText('');
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
        <Text className="text-xs font-body text-t3">{comments.length}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* Post context card */}
        <View
          className="mx-4 mt-3 mb-1 rounded-md border border-border bg-surface p-3 flex-row gap-3"
        >
          <MockBookCover book={item.book} width={46} height={70} />

          <View className="flex-1 min-w-0 justify-between py-0.5">
            <View>
              <Text className="text-xs font-body-sb text-text" numberOfLines={2} style={{ lineHeight: 17 }}>
                {item.book.title}
              </Text>
              <Text className="text-xs font-body text-t3 mt-0.5" numberOfLines={1}>
                {item.book.author}
              </Text>
            </View>

            <View className="flex-row items-center gap-1.5 mt-1.5">
              <Avatar user={item.user} size={18} />
              <Text className="text-xs font-body text-t2" numberOfLines={1}>
                <Text className="font-body-sb">{item.user.name} </Text>
                <Text style={{ color: c.t3 }}>{ACT_LABEL[item.type]}</Text>
              </Text>
            </View>

            {item.rating != null && (
              <View className="flex-row items-center gap-1 mt-1">
                <StarRating rating={item.rating} size={10} />
                <Text className="text-xs font-body-sb" style={{ color: fixed.star }}>
                  {item.rating}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Comments */}
        <View className="px-4">
          {comments.length === 0 ? (
            <View className="items-center py-12 gap-2">
              <Text className="text-sm font-body-sb text-text">Sin comentarios</Text>
              <Text className="text-xs font-body text-t3 text-center">
                Sé el primero en comentar.
              </Text>
            </View>
          ) : (
            comments.map((comment) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                onLike={() => toggleLike(comment.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Input bar */}
      <View
        className="border-t border-border flex-row items-center px-3 gap-2 bg-surface"
        style={{ paddingBottom: insets.bottom + 8, paddingTop: 8 }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: alpha(ME_MOCK.avC, 0.18),
            borderWidth: 1.5,
            borderColor: ME_MOCK.avC,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text className="font-body-sb" style={{ fontSize: 10, color: ME_MOCK.avC }}>
            {ME_MOCK.av}
          </Text>
        </View>

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
          style={{ opacity: text.trim() ? 1 : 0.35 }}
        >
          <Send size={20} color={c.accent} strokeWidth={1.8} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
