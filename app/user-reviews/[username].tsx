import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Heart, AlertTriangle, MessageCircle } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { BookCover } from '~/components/ui/BookCover';
import { StarRating } from '~/components/ui/StarRating';
import { useToggleReviewLike } from '~/features/feed/hooks/useToggleReviewLike';
import { useUserReviews } from '~/features/reviews/hooks/useUserReviews';
import type { ReviewWithBook } from '~/features/reviews/reviews.queries';
import { profileQueryOptions } from '~/features/user/user.queries';
import { formatRelativeTime } from '~/lib/utils';
import { fixed, useColors } from '~/theme/colors';
import { useAuthStore } from '~/stores/auth.store';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

function ReviewCard({
  review,
  onBookPress,
}: {
  review: ReviewWithBook;
  onBookPress: () => void;
}) {
  const c = useColors();
  const [expanded, setExpanded] = useState(false);
  const isLong = review.body.length > 220;
  const rating = review.user_books?.rating ?? null;

  const { liked, count, toggle, isPending } = useToggleReviewLike(
    review.id,
    false,
    review.likes_count ?? 0,
  );

  return (
    <Pressable
      onPress={onBookPress}
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
        <Text className="text-xs font-body text-t3 shrink-0">
          {formatRelativeTime(review.created_at)}
        </Text>
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
            onPress={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
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
      <View className="flex-row items-center gap-4 px-3.5 pt-2.5 pb-3 border-t border-border">
        <Pressable
          onPress={(e) => { e.stopPropagation(); toggle(); }}
          disabled={isPending}
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
            {count}
          </Text>
        </Pressable>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
          }}
          className="flex-row items-center gap-1.5"
          hitSlop={8}
        >
          <MessageCircle size={13} color={c.t3} strokeWidth={1.8} />
          <Text className="text-xs font-body text-t3">{review.comments_count ?? 0}</Text>
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
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: profile, isLoading: profileLoading } = useQuery(
    profileQueryOptions(username, currentUserId),
  );

  const {
    reviews,
    isLoading: reviewsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUserReviews(profile?.id ?? '');

  const isLoading = profileLoading || (!!profile && reviewsLoading);

  function handleBookPress(review: ReviewWithBook) {
    const googleId = review.books?.google_books_id;
    if (googleId) router.push(`/book/${googleId}` as any);
  }

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
          {profile && (
            <Text className="text-xs font-body text-t3">@{profile.username}</Text>
          )}
        </View>
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
          <Text className="text-sm font-body-sb text-text text-center">Sin reseñas</Text>
          <Text className="text-xs font-body text-t3 text-center leading-[20px]">
            {profile ? `@${profile.username}` : 'Este usuario'} aún no ha publicado reseñas.
          </Text>
        </View>
      ) : (
        <FlashList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          renderItem={({ item }) => (
            <ReviewCard
              review={item}
              onBookPress={() => handleBookPress(item)}
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
