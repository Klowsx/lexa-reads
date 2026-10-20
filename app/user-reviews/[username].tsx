import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft, Heart, MessageCircle } from 'lucide-react-native'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '~/components/ui/ErrorState'
import { SpoilerText } from '~/features/reviews/components/SpoilerText'
import { BookCover } from '~/components/ui/BookCover'
import { StarRating } from '~/components/ui/StarRating'
import { useToggleReviewLike } from '~/features/feed/hooks/useToggleReviewLike'
import { useUserReviews } from '~/features/reviews/hooks/useUserReviews'
import type { ReviewWithBook } from '~/features/reviews/reviews.queries'
import { useProfile } from '~/features/user/hooks/useProfile'
import { formatRelativeTime } from '~/lib/utils'
import { fixed, useColors } from '~/theme/colors'
import { useAuthStore } from '~/stores/auth.store'

// Renderiza una reseña sin exponer su texto marcado hasta que el lector lo solicite.
function ReviewCard({
  review,
  onBookPress
}: {
  review: ReviewWithBook
  onBookPress: () => void
}) {
  const c = useColors()
  const router = useRouter()
  const rating = review.user_books?.rating ?? null

  const { liked, count, toggle, isPending } = useToggleReviewLike(
    review.id,
    false,
    review.likes_count ?? 0
  )

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
          <Text
            className="text-xs font-body-sb text-text leading-[16px]"
            numberOfLines={2}
          >
            {review.books?.title ?? ''}
          </Text>
          <Text className="text-xs font-body text-t3 mt-0.5" numberOfLines={1}>
            {review.books?.authors?.join(', ') ?? ''}
          </Text>
          {rating != null && (
            <View className="flex-row items-center gap-1.5 mt-1.5">
              <StarRating rating={rating} size={10} />
              <Text className="text-xs font-body-sb text-star">{rating}</Text>
            </View>
          )}
        </View>
        <Text className="text-xs font-body text-t3 shrink-0">
          {formatRelativeTime(review.created_at)}
        </Text>
      </View>

      {/* Body */}
      <View className="px-3.5 pt-3 pb-2.5">
        <SpoilerText
          body={review.body}
          containsSpoilers={!!review.contains_spoilers}
          contentId={review.id}
          numberOfLines={4}
        />
      </View>

      {/* Footer */}
      <View className="flex-row items-center gap-4 px-3.5 pt-2.5 pb-3 border-t border-border">
        <Pressable
          onPress={(e) => {
            e.stopPropagation()
            toggle()
          }}
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
          <Text
            className="text-xs font-body"
            style={{ color: liked ? fixed.accent : c.t3 }}
          >
            {count}
          </Text>
        </Pressable>
        <Pressable
          onPress={(e) => {
            e.stopPropagation()
            router.push({
              pathname: '/comments/[id]',
              params: { id: review.id, type: 'review' }
            })
          }}
          className="flex-row items-center gap-1.5"
          hitSlop={8}
        >
          <MessageCircle size={13} color={c.t3} strokeWidth={1.8} />
          <Text className="text-xs font-body text-t3">
            {review.comments_count ?? 0}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  )
}

// Comprueba la relación antes de consultar reseñas y distingue privacidad, errores y ausencia de publicaciones.
export default function UserReviewsScreen() {
  const { username } = useLocalSearchParams<{ username: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { t } = useTranslation()
  const profileQuery = useProfile(username)
  const { data: profile, isLoading: profileLoading } = profileQuery
  const visible =
    !!profile &&
    (profile.id === currentUserId ||
      !profile.is_private ||
      (profile.follow_status === 'accepted' &&
        !profileQuery.isFetching &&
        !profileQuery.isError))

  const {
    reviews,
    isLoading: reviewsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch
  } = useUserReviews(visible ? (profile?.id ?? '') : '')

  const isLoading = profileLoading || (!!profile && reviewsLoading)

  // Abre la ficha usando el identificador externo esperado por la ruta del catálogo.
  function handleBookPress(review: ReviewWithBook) {
    const googleId = review.books?.google_books_id
    if (googleId) router.push(`/book/${googleId}` as any)
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <View className="flex-1 min-w-0">
          <Text
            className="font-display-sb text-xl text-text tracking-tight"
            numberOfLines={1}
          >
            Reseñas
          </Text>
          {profile && (
            <Text className="text-xs font-body text-t3">
              @{profile.username}
            </Text>
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
      ) : profileQuery.isError ? (
        <ErrorState onRetry={() => void profileQuery.refetch()} />
      ) : !profile ? (
        <View className="px-container py-10">
          <Text className="font-body text-sm text-text">
            {t('social.unavailable')}
          </Text>
        </View>
      ) : !visible ? (
        <View className="px-container py-10 gap-3">
          <Text className="font-display-sb text-lg text-text text-center">
            {t('social.privateAccount')}
          </Text>
          <Text className="font-body text-sm text-t2 text-center">
            {t('social.privateHint')}
          </Text>
        </View>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : reviews.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="text-sm font-body-sb text-text text-center">
            Sin reseñas
          </Text>
          <Text className="text-xs font-body text-t3 text-center leading-[20px]">
            {profile ? `@${profile.username}` : 'Este usuario'} aún no ha
            publicado reseñas.
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
  )
}
