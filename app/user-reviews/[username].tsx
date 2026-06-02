import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Heart, AlertTriangle } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MockBookCover } from '~/components/ui/MockBookCover';
import { StarRating } from '~/components/ui/StarRating';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { FULL_USERS, USER_REVIEWS, type MockOtherReview } from '~/mock';
import { fixed, useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

function ReviewCard({
  review,
  onBookPress,
}: {
  review: MockOtherReview;
  onBookPress: () => void;
}) {
  const c = useColors();
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(review.likes);
  const isLong = review.body.length > 220;

  function toggleLike() {
    setLiked((v) => !v);
    setLikes((n) => (liked ? n - 1 : n + 1));
  }

  return (
    <Pressable
      onPress={onBookPress}
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
        <Text className="text-xs font-body text-t3 shrink-0">{review.createdAt}</Text>
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
            onPress={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
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
      <View className="flex-row items-center gap-4 px-3.5 pt-2.5 pb-3 border-t border-border">
        <Pressable
          onPress={(e) => { e.stopPropagation(); toggleLike(); }}
          className="flex-row items-center gap-1.5"
          hitSlop={8}
        >
          <Heart
            size={13}
            color={liked ? fixed.accent : c.t3}
            fill={liked ? fixed.accent : 'none'}
            strokeWidth={1.8}
          />
          <Text className="text-xs font-body" style={{ color: liked ? fixed.accent : c.t3 }}>
            {likes}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function UserReviewsScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const user = FULL_USERS.find((u) => u.username === username);
  const reviews = USER_REVIEWS[username] ?? [];
  const [previewBook, setPreviewBook] = useState<MockOtherReview['book'] | null>(null);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <View className="flex-1 min-w-0">
          <Text className="font-display-sb text-xl text-text tracking-tight" numberOfLines={1}>
            Reseñas
          </Text>
          {user && (
            <Text className="text-xs font-body text-t3">@{user.username}</Text>
          )}
        </View>
        <Text className="text-xs font-body text-t3">{reviews.length}</Text>
      </View>

      {reviews.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="text-sm font-body-sb text-text text-center">Sin reseñas</Text>
          <Text className="text-xs font-body text-t3 text-center leading-[20px]">
            {user ? `@${user.username}` : 'Este usuario'} aún no ha publicado reseñas.
          </Text>
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
              onBookPress={() => setPreviewBook(review.book)}
            />
          ))}
        </ScrollView>
      )}

      {previewBook && (
        <BookDetailSheet book={previewBook as any} onClose={() => setPreviewBook(null)} />
      )}
    </View>
  );
}
