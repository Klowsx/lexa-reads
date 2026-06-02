import { useRouter } from 'expo-router';
import { ChevronLeft, Heart, MessageCircle, AlertTriangle, Pencil, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, GestureResponderEvent, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MockBookCover } from '~/components/ui/MockBookCover';
import { StarRating } from '~/components/ui/StarRating';
import { MY_REVIEWS, type MockMyReview } from '~/mock';
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
  review: MockMyReview;
  onPress: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const c = useColors();
  const [expanded, setExpanded] = useState(false);
  const isLong = review.body.length > 220;

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
        <MockBookCover book={review.book} width={40} height={60} />
        <View className="flex-1 min-w-0">
          <Text className="text-xs font-body-sb text-text" numberOfLines={2} style={{ lineHeight: 16 }}>
            {review.book.title}
          </Text>
          <Text className="text-xs font-body text-t3 mt-0.5" numberOfLines={1}>
            {review.book.author}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-1.5">
            <StarRating rating={review.rating} size={10} />
            <Text className="text-xs font-body-sb" style={{ color: fixed.star }}>
              {review.rating}
            </Text>
          </View>
        </View>

        {/* Date + edited badge */}
        <View className="items-end gap-1 shrink-0">
          <Text className="text-xs font-body text-t3">{review.createdAt}</Text>
          {review.editedAt && (
            <View
              className="rounded-full px-2 py-0.5"
              style={{
                backgroundColor: alpha(c.accent, 0.12),
                borderWidth: 1,
                borderColor: alpha(c.accent, 0.3),
              }}
            >
              <Text className="text-xs font-body-md" style={{ color: c.accent, fontSize: 10 }}>
                Editada
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Body */}
      <View className="px-3.5 pt-3 pb-2.5">
        {review.containsSpoilers && (
          <View
            className="flex-row items-center gap-1.5 rounded-md px-2.5 py-1.5 mb-2 self-start"
            style={{
              backgroundColor: alpha(c.warning, 0.1),
              borderWidth: 1,
              borderColor: alpha(c.warning, 0.3),
            }}
          >
            <AlertTriangle size={11} color={c.warning} strokeWidth={2} />
            <Text className="text-xs font-body-md" style={{ color: c.warning }}>
              Contiene spoilers
            </Text>
          </View>
        )}

        <Text
          className="text-xs font-body text-t2"
          style={{ lineHeight: 20 }}
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
            <Text className="text-xs font-body-md" style={{ color: c.accent }}>
              {expanded ? 'Ver menos' : 'Ver más'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Footer */}
      <View
        className="flex-row items-center px-3.5 pt-2.5 pb-3 border-t border-border gap-4"
      >
        {/* Stats */}
        <View className="flex-row items-center gap-1.5">
          <Heart size={13} color={c.t3} strokeWidth={1.8} />
          <Text className="text-xs font-body text-t3">{review.likes}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <MessageCircle size={13} color={c.t3} strokeWidth={1.8} />
          <Text className="text-xs font-body text-t3">{review.comments}</Text>
        </View>

        <View className="flex-1" />

        {/* Actions */}
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
          <Text className="text-xs font-body" style={{ color: c.error }}>Eliminar</Text>
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
  const [reviews, setReviews] = useState(MY_REVIEWS);

  function handleDelete(id: string, title: string) {
    Alert.alert(
      'Eliminar reseña',
      `¿Eliminar tu reseña de "${title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setReviews((prev) => prev.filter((r) => r.id !== id)),
        },
      ]
    );
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
        <Text className="text-xs font-body text-t3">{reviews.length}</Text>
      </View>

      {reviews.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="text-sm font-body-sb text-text text-center">
            Aún no has escrito reseñas
          </Text>
          <Text className="text-xs font-body text-t3 text-center leading-[20px]">
            Busca un libro que hayas leído y comparte tu opinión.
          </Text>
          <Pressable
            onPress={() => router.navigate('/(tabs)/search' as any)}
            className="mt-2 px-5 py-2.5 rounded-md"
            style={{ backgroundColor: c.accent }}
          >
            <Text className="text-xs font-body-sb" style={{ color: '#fff' }}>
              Buscar libros
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        >
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onPress={() => router.push(`/book/${review.book.id}` as any)}
              onDelete={() => handleDelete(review.id, review.book.title)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
