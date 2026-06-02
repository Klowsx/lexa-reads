import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { ChevronLeft, Heart, MessageCircle, AlertTriangle, Pencil, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, GestureResponderEvent, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookCover } from '~/components/ui/BookCover';
import { StarRating } from '~/components/ui/StarRating';
import { useDeleteMyReview } from '~/features/reviews/hooks/useDeleteMyReview';
import { useMyReviews } from '~/features/reviews/hooks/useMyReviews';
import type { ReviewWithBook } from '~/features/reviews/reviews.queries';
import { formatRelativeTime } from '~/lib/utils';
import { fixed, useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

// ─── Review card ──────────────────────────────────────────────

function ReviewCard({
  review,
  onPress,
  onDelete,
}: {
  review: ReviewWithBook;
  onPress: () => void;
  onDelete: () => void;
}) {
  const c = useColors();
  const [expanded, setExpanded] = useState(false);
  const isLong = review.body.length > 220;
  const rating = review.user_books?.rating ?? null;

  function stopProp(e: GestureResponderEvent) {
    e.stopPropagation();
  }

  return (
    <Pressable
      onPress={onPress}
      className="bg-surface rounded-card border border-border mb-3 overflow-hidden"
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      {/* Book row */}
      <View className="flex-row items-center gap-3 p-3 border-b border-border">
        <BookCover book={review.books as any} width={40} height={60} />
        <View className="flex-1 min-w-0">
          <Text className="text-xs font-body-sb text-text leading-[16px]" numberOfLines={2}>
            {review.books?.title ?? ''}
          </Text>
          <Text className="text-xs font-body text-t3 mt-0.5" numberOfLines={1}>
            {review.books?.authors?.join(', ') ?? ''}
          </Text>
          {rating != null && (
            <View className="flex-row items-center gap-1.5 mt-1.5">
              <StarRating rating={rating} size={10} />
              <Text className="text-xs font-body-sb text-star">
                {rating}
              </Text>
            </View>
          )}
        </View>

        {/* Date + edited badge */}
        <View className="items-end gap-1 shrink-0">
          <Text className="text-xs font-body text-t3">
            {formatRelativeTime(review.created_at)}
          </Text>
          {review.edited_at && (
            <View
              className="rounded-full px-2 py-0.5"
              style={{
                backgroundColor: alpha(c.accent, 0.12),
                borderWidth: 1,
                borderColor: alpha(c.accent, 0.3),
              }}
            >
              <Text className="text-xs font-body-md text-accent text-[10px]">
                Editada
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Body */}
      <View className="px-3.5 pt-3 pb-2.5">
        {review.contains_spoilers && (
          <View
            className="flex-row items-center gap-1.5 rounded-md px-2.5 py-1.5 mb-2 self-start"
            style={{
              backgroundColor: alpha(c.warning, 0.1),
              borderWidth: 1,
              borderColor: alpha(c.warning, 0.3),
            }}
          >
            <AlertTriangle size={11} color={c.warning} strokeWidth={2} />
            <Text className="text-xs font-body-md text-warning">
              Contiene spoilers
            </Text>
          </View>
        )}

        <Text
          className="text-xs font-body text-t2 leading-[20px]"
          numberOfLines={expanded ? undefined : 4}
        >
          {review.body}
        </Text>

        {isLong && (
          <Pressable
            onPress={(e) => { stopProp(e); setExpanded((v) => !v); }}
            hitSlop={8}
            className="mt-1.5"
          >
            <Text className="text-xs font-body-md text-accent">
              {expanded ? 'Ver menos' : 'Ver más'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Footer */}
      <View className="flex-row items-center px-3.5 pt-2.5 pb-3 border-t border-border gap-4">
        <View className="flex-row items-center gap-1.5">
          <Heart size={13} color={c.t3} strokeWidth={1.8} />
          <Text className="text-xs font-body text-t3">{review.likes_count ?? 0}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <MessageCircle size={13} color={c.t3} strokeWidth={1.8} />
          <Text className="text-xs font-body text-t3">{review.comments_count ?? 0}</Text>
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={(e) => { stopProp(e); onPress(); }}
          className="flex-row items-center gap-1"
          hitSlop={8}
        >
          <Pencil size={13} color={c.t2} strokeWidth={1.8} />
          <Text className="text-xs font-body text-t2">Editar</Text>
        </Pressable>

        <Pressable
          onPress={(e) => { stopProp(e); onDelete(); }}
          className="flex-row items-center gap-1"
          hitSlop={8}
        >
          <Trash2 size={13} color={c.error} strokeWidth={1.8} />
          <Text className="text-xs font-body text-error">Eliminar</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function MyReviewsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useColors();

  const {
    reviews,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMyReviews();

  const deleteMutation = useDeleteMyReview();

  function handleDelete(review: ReviewWithBook) {
    Alert.alert(
      'Eliminar reseña',
      `¿Eliminar tu reseña de "${review.books?.title ?? 'este libro'}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(review.id),
        },
      ]
    );
  }

  function handlePress(review: ReviewWithBook) {
    const googleId = review.books?.google_books_id;
    if (googleId) router.push(`/book/${googleId}` as any);
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">
          Mis reseñas
        </Text>
        {!isLoading && (
          <Text className="text-xs font-body text-t3">{reviews.length}</Text>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accent} />
        </View>
      ) : reviews.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="text-sm font-body-sb text-text text-center">
            Aún no has escrito reseñas
          </Text>
          <Text className="text-xs font-body text-t3 text-center leading-[20px]">
            Busca un libro que hayas leído y comparte tu opinión.
          </Text>
          <Pressable
            onPress={() => router.navigate('/(tabs)/search' as any)}
            className="mt-2 px-5 py-2.5 rounded-md bg-accent"
          >
            <Text className="text-xs font-body-sb text-white">
              Buscar libros
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={reviews}
          keyExtractor={(item) => item.id}
          estimatedItemSize={180}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          renderItem={({ item }) => (
            <ReviewCard
              review={item}
              onPress={() => handlePress(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={c.accent} className="py-4" />
            ) : null
          }
        />
      )}
    </View>
  );
}
