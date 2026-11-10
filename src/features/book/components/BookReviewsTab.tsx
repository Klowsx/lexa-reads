import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Heart,
  MessageCircle,
  Pencil,
  Share2,
  Trash2
} from 'lucide-react-native'
import { SpoilerText } from '~/features/reviews/components/SpoilerText'
import { ConfirmDialog } from '~/components/ui/ConfirmDialog'
import { StarRating } from '~/components/ui/StarRating'
import { UserAvatar } from '~/components/ui/UserAvatar'
import { useBookReviews } from '../hooks/useBookReviews'
import { useMyReview } from '../hooks/useMyReview'
import { useDeleteReview } from '../hooks/useDeleteReview'
import { useToggleReviewLike } from '~/features/feed/hooks/useToggleReviewLike'
import { ReviewShareCard } from '~/features/share/components/ReviewShareCard'
import { SharePreviewSheet } from '~/features/share/components/SharePreviewSheet'
import { bookCommunityStatsQueryOptions } from '../book.queries'
import { useAuthStore } from '~/stores/auth.store'
import { meQueryOptions } from '~/features/user/user.queries'
import { fixed, useColors } from '~/theme/colors'
import { formatRelativeTime } from '~/lib/utils'
import type { Tables } from '~/types/database'
import type { ReviewWithUser } from '../book.queries'

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})` as const
}

// ─── Barra de distribución de rating ─────────────────────────

// Muestra la barra de distribución para un número de estrellas.
// Es información de distribución, sin simular un filtro que no existe.
function RatingBar({ star, pct }: { star: number; pct: number }) {
  const c = useColors()

  return (
    <View className="flex-row items-center gap-[7px] py-1">
      <Text
        className="font-body text-xs"
        style={{
          color: c.t2,
          width: 8,
          textAlign: 'right'
        }}
      >
        {star}
      </Text>
      <View className="flex-1 h-1 bg-sh rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: fixed.star
          }}
        />
      </View>
      <Text
        className="font-body text-xs"
        style={{ color: c.t2, width: 36, textAlign: 'left' }}
      >
        {pct}%
      </Text>
    </View>
  )
}

// ─── Tarjeta individual de reseña ────────────────────────────

// Muestra una reseña con header de usuario, cuerpo de texto y acciones.
// Si isOwn = true se muestran botones de editar y borrar en lugar de like/comentar.
function ReviewCard({
  review,
  isOwn = false,
  onEdit,
  onDelete,
  onShare
}: {
  review: ReviewWithUser
  isOwn?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onShare?: () => void
}) {
  const router = useRouter()
  const c = useColors()
  const { t } = useTranslation()

  const { liked, count, toggle, isPending } = useToggleReviewLike(
    review.id,
    false,
    review.likes_count ?? 0
  )

  // El usuario puede no estar disponible si la FK falla — fallback a datos básicos.
  const user = review.users ?? {
    id: review.user_id,
    username: 'usuario',
    display_name: null,
    avatar_url: null
  }

  return (
    <View className="bg-surface rounded-card p-4 border border-border mb-2.5">
      {/* Header: avatar + nombre + tiempo */}
      <View className="flex-row items-start gap-2.5 mb-2.5">
        <UserAvatar user={user} size={30} />
        <View className="flex-1">
          <Text className="font-body-sb text-xs text-text">
            {user.display_name ?? user.username}
          </Text>
          <Text className="font-body text-xs text-t3">@{user.username}</Text>
        </View>
        <View className="items-end gap-1">
          <Text className="font-body text-xs text-t3">
            {formatRelativeTime(review.created_at)}
          </Text>
          {review.edited_at && (
            <View
              className="rounded-full px-2 py-0.5"
              style={{
                backgroundColor: alpha(fixed.accent, 0.12),
                borderWidth: 1,
                borderColor: alpha(fixed.accent, 0.3)
              }}
            >
              <Text className="font-body-md text-accent text-[10px]">
                {t('reviews.edited')}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="mb-3">
        <SpoilerText
          body={review.body}
          containsSpoilers={!!review.contains_spoilers}
          contentId={review.id}
        />
      </View>

      {/* Footer: acciones */}
      <View
        className="flex-row gap-4 pt-2.5 border-t"
        style={{ borderTopColor: alpha(c.border, 0.5) }}
      >
        {isOwn ? (
          // Reseña propia: mostrar editar y borrar
          <>
            <TouchableOpacity
              onPress={onEdit}
              className="flex-row items-center gap-[5px]"
            >
              <Pencil size={13} color={c.t3} strokeWidth={1.8} />
              <Text className="font-body text-xs text-t3">
                {t('common.edit')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              className="flex-row items-center gap-[5px]"
            >
              <Trash2 size={13} color={c.error} strokeWidth={1.8} />
              <Text className="font-body text-xs text-error">
                {t('common.delete')}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // Reseña ajena: like y comentar
          <>
            <TouchableOpacity
              onPress={() => toggle()}
              disabled={isPending}
              className="flex-row items-center gap-[5px]"
            >
              <Heart
                size={14}
                color={liked ? fixed.accent : c.t3}
                fill={liked ? fixed.accent : 'transparent'}
                strokeWidth={1.8}
              />
              <Text
                className="font-body text-xs"
                style={{ color: liked ? fixed.accent : c.t3 }}
              >
                {count}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/comments/[id]',
                  params: { id: review.id, type: 'review' }
                } as any)
              }
              className="flex-row items-center gap-[5px]"
            >
              <MessageCircle size={14} color={c.t3} strokeWidth={1.8} />
              <Text className="font-body text-xs text-t3">
                {t('reviews.reply')}
              </Text>
            </TouchableOpacity>
          </>
        )}
        {isOwn && (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/comments/[id]',
                params: { id: review.id, type: 'review' }
              })
            }
            className="min-h-12 flex-row items-center gap-2"
          >
            <MessageCircle size={18} color={c.text} />
            <Text className="font-body text-xs text-text">
              {t('comments.title')}
            </Text>
          </Pressable>
        )}
        {/* Botón compartir — disponible en reseñas propias y ajenas */}
        <TouchableOpacity
          onPress={onShare}
          className="ml-auto flex-row items-center gap-[5px]"
        >
          <Share2 size={13} color={c.t3} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Tab principal ────────────────────────────────────────────

interface BookReviewsTabProps {
  bookId: string
  book?: Tables<'books'>
  onWriteReview: () => void
}

// Gestiona reseñas publicadas y propias con spoilers ocultos y borrado confirmado.
export function BookReviewsTab({
  bookId,
  book,
  onWriteReview
}: BookReviewsTabProps) {
  const c = useColors()
  const { t } = useTranslation()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const { data: ownProfile } = useQuery(meQueryOptions(userId))
  const ownUser = ownProfile
    ? {
        id: ownProfile.id,
        username: ownProfile.username,
        display_name: ownProfile.display_name,
        avatar_url: ownProfile.avatar_url
      }
    : null
  const [sharingReview, setSharingReview] = useState<ReviewWithUser | null>(
    null
  )

  const { data: communityStats } = useQuery(
    bookCommunityStatsQueryOptions(bookId, userId)
  )

  // Reseñas paginadas del libro.
  const {
    reviews,
    isLoading,
    isError,
    refetch,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useBookReviews(bookId)

  // Reseña del usuario actual (null si no ha escrito ninguna).
  const { data: myReview } = useMyReview(bookId)

  // Mutación de borrado — necesita reviewId al ejecutarse.
  const deleteMutation = useDeleteReview(bookId)

  // Las reseñas ajenas excluyen la mía (se muestra en su propia sección).
  const otherReviews = reviews.filter((r) => r.id !== myReview?.id)

  const dist = communityStats?.distribution ?? []
  const avgRating = communityStats?.avgRating ?? 0
  const ratingsCount = communityStats?.ratingsCount ?? 0

  return (
    <View className="pb-6">
      {/* ── Resumen de ratings ───────────────────────────── */}
      {communityStats && ratingsCount > 0 && (
        <View className="m-container mb-0 bg-surface rounded-card p-4 border border-border flex-row gap-container items-start">
          <View className="items-center shrink-0">
            <Text className="font-display-bold text-3xl text-star leading-[48px]">
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            </Text>
            <View className="mt-[5px]">
              <StarRating rating={avgRating} size={12} />
            </View>
            <Text className="font-body text-xs text-t3 mt-[5px] text-center leading-[14px]">
              {`${ratingsCount.toLocaleString()}\n${t('reviews.ratings')}`}
            </Text>
          </View>
          <View className="flex-1 pt-1">
            {dist.map(({ star, pct }) => (
              <RatingBar key={star} star={star} pct={pct} />
            ))}
          </View>
        </View>
      )}

      {/* ── CTA escribir reseña ──────────────────────────── */}
      <View className="px-container pt-3.5 pb-3.5">
        <TouchableOpacity
          onPress={onWriteReview}
          activeOpacity={0.85}
          accessibilityRole="button"
          className="min-h-12 py-3.5 rounded-card bg-sr items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Text className="font-body-sb text-sm text-text">
            {myReview ? t('book.editMyReview') : t('book.writeMyReview')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Mi reseña (si existe) ────────────────────────── */}
      {myReview && (
        <View className="px-container">
          <Text className="font-body-sb text-xs text-t3 uppercase tracking-widest mb-2">
            {t('reviews.myReview')}
          </Text>
          <ReviewCard
            review={{ ...myReview, users: ownUser }}
            isOwn
            onEdit={onWriteReview}
            onDelete={() => {
              deleteMutation.reset()
              setDeletingId(myReview.id)
            }}
            onShare={() => setSharingReview({ ...myReview, users: ownUser })}
          />
        </View>
      )}

      {isError && (
        <View className="gap-2 px-container">
          <Text
            accessibilityRole="alert"
            className="font-body text-xs text-text"
          >
            {t('reviews.loadError')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void refetch()}
            className="min-h-12 justify-center rounded-md bg-sr px-4"
          >
            <Text className="font-body-sb text-xs text-text">
              {t('common.retry')}
            </Text>
          </Pressable>
        </View>
      )}
      {deletingId && (
        <ConfirmDialog
          title={t('reviews.deleteTitle')}
          description={t('reviews.deleteHint')}
          pending={deleteMutation.isPending}
          error={deleteMutation.isError ? t('reviews.deleteError') : undefined}
          onConfirm={() =>
            deleteMutation.mutate(deletingId, {
              onSuccess: () => setDeletingId(null)
            })
          }
          onClose={() => setDeletingId(null)}
        />
      )}
      {/* ── Lista de reseñas ─────────────────────────────── */}
      <View className="px-container">
        {/* Título de sección solo si hay reseñas de otros */}
        {otherReviews.length > 0 && (
          <Text className="font-body-sb text-xs text-t3 uppercase tracking-widest mb-2">
            {t('reviews.readerReviews')}
          </Text>
        )}

        {/* Estado de carga inicial */}
        {isLoading && (
          <View className="items-center py-6">
            <ActivityIndicator color={c.accent} />
          </View>
        )}

        {/* Estado vacío */}
        {!isLoading && !isError && otherReviews.length === 0 && !myReview && (
          <View className="items-center py-8">
            <Text className="font-body text-xs text-t3 text-center">
              {t('reviews.beFirst')}
            </Text>
          </View>
        )}

        {/* Lista de tarjetas de reseña */}
        {otherReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onShare={() => setSharingReview(review)}
          />
        ))}

        {/* Botón "Cargar más" — visible solo si hay más páginas */}
        {hasNextPage && (
          <Pressable
            onPress={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="items-center py-3 mt-1"
          >
            {isFetchingNextPage ? (
              <ActivityIndicator color={c.accent} size="small" />
            ) : (
              <Text className="font-body-md text-xs text-accent">
                {t('reviews.loadMore')}
              </Text>
            )}
          </Pressable>
        )}
      </View>

      {sharingReview && (
        <SharePreviewSheet
          key={`${sharingReview.id}:${book?.cover_url ?? ''}`}
          onClose={() => setSharingReview(null)}
          containsSpoilers={Boolean(sharingReview.contains_spoilers)}
        >
          {(onCoverReady) => (
            <ReviewShareCard
              review={sharingReview}
              bookTitle={book?.title}
              bookCoverUrl={book?.cover_url}
              bookId={book?.id}
              onCoverReady={onCoverReady}
            />
          )}
        </SharePreviewSheet>
      )}
    </View>
  )
}
