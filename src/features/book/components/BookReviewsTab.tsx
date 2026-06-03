import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import ViewShot from "react-native-view-shot";
import {
  Heart,
  MessageCircle,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react-native";
import { StarRating } from "~/components/ui/StarRating";
import { UserAvatar } from "~/components/ui/UserAvatar";
import { useBookReviews } from "../hooks/useBookReviews";
import { useMyReview } from "../hooks/useMyReview";
import { useDeleteReview } from "../hooks/useDeleteReview";
import { useToggleReviewLike } from "~/features/feed/hooks/useToggleReviewLike";
import { ReviewShareCard } from "~/features/share/components/ReviewShareCard";
import { useShareCard } from "~/features/share/hooks/useShareCard";
import { bookCommunityStatsQueryOptions } from "../book.queries";
import { useAuthStore } from "~/stores/auth.store";
import { fixed, useColors } from "~/theme/colors";
import { formatRelativeTime } from "~/lib/utils";
import type { Tables } from "~/types/database";
import type { ReviewWithUser } from "../book.queries";

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})` as const;
};

// ─── Barra de distribución de rating ─────────────────────────

// Muestra la barra de distribución para un número de estrellas.
// El filtro activo resalta la barra correspondiente y cambia su color.
function RatingBar({
  star,
  pct,
  active,
  onPress,
}: {
  star: number;
  pct: number;
  active: boolean;
  onPress: () => void;
}) {
  const c = useColors();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-[7px] py-[2px]"
    >
      <Text
        className={active ? "font-body-bold text-xs" : "font-body text-xs"}
        style={{
          color: active ? fixed.star : c.t3,
          width: 8,
          textAlign: "right",
        }}
      >
        {star}
      </Text>
      <View className="flex-1 h-1 bg-sh rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: active ? c.text : fixed.star,
          }}
        />
      </View>
      <Text
        className="font-body text-xs"
        style={{ color: active ? c.text : c.t3, width: 26, textAlign: "left" }}
      >
        {pct}%
      </Text>
    </Pressable>
  );
}

// ─── Tarjeta individual de reseña ────────────────────────────

// Muestra una reseña con header de usuario, cuerpo de texto y acciones.
// Si isOwn = true se muestran botones de editar y borrar en lugar de like/comentar.
function ReviewCard({
  review,
  isOwn = false,
  onEdit,
  onDelete,
  onShare,
}: {
  review: ReviewWithUser;
  isOwn?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}) {
  const router = useRouter();
  const c = useColors();

  const { liked, count, toggle, isPending } = useToggleReviewLike(
    review.id,
    false,
    review.likes_count ?? 0,
  );

  // El usuario puede no estar disponible si la FK falla — fallback a datos básicos.
  const user = review.users ?? {
    id: review.user_id,
    username: "usuario",
    display_name: null,
    avatar_url: null,
  };

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
                borderColor: alpha(fixed.accent, 0.3),
              }}
            >
              <Text className="font-body-md text-accent text-[10px]">
                Editada
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Aviso de spoiler — se muestra encima del cuerpo si aplica */}
      {review.contains_spoilers && (
        <View className="bg-warning/10 border border-warning/30 rounded-md px-2.5 py-1.5 mb-2">
          <Text className="font-body-md text-xs text-warning">
            ⚠ Contiene spoilers
          </Text>
        </View>
      )}

      {/* Cuerpo de la reseña */}
      <Text
        className="font-body text-xs text-t2 mb-3"
        style={{ lineHeight: 13 * 1.7 }}
        numberOfLines={isOwn ? undefined : 6}
      >
        {review.body}
      </Text>

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
              <Text className="font-body text-xs text-t3">Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              className="flex-row items-center gap-[5px]"
            >
              <Trash2 size={13} color={c.error} strokeWidth={1.8} />
              <Text className="font-body text-xs text-error">Eliminar</Text>
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
                fill={liked ? fixed.accent : "transparent"}
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
                  pathname: "/comments/[id]",
                  params: { id: review.id, type: "review" },
                } as any)
              }
              className="flex-row items-center gap-[5px]"
            >
              <MessageCircle size={14} color={c.t3} strokeWidth={1.8} />
              <Text className="font-body text-xs text-t3">Responder</Text>
            </TouchableOpacity>
          </>
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
  );
}

// ─── Tab principal ────────────────────────────────────────────

interface BookReviewsTabProps {
  bookId: string;
  book?: Tables<"books">;
  onWriteReview: () => void;
}

export function BookReviewsTab({
  bookId,
  book,
  onWriteReview,
}: BookReviewsTabProps) {
  const c = useColors();
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const [sharingReview, setSharingReview] = useState<ReviewWithUser | null>(
    null,
  );
  const { ref: shareRef, capture } = useShareCard();

  const { data: communityStats } = useQuery(bookCommunityStatsQueryOptions(bookId, userId));

  useEffect(() => {
    if (!sharingReview) return;
    // Esperar a que el ViewShot se monte antes de capturar
    const t = setTimeout(async () => {
      await capture();
      setSharingReview(null);
    }, 80);
    return () => clearTimeout(t);
  }, [sharingReview?.id]);

  // Reseñas paginadas del libro.
  const { reviews, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useBookReviews(bookId);

  // Reseña del usuario actual (null si no ha escrito ninguna).
  const { data: myReview } = useMyReview(bookId);

  // Mutación de borrado — necesita reviewId al ejecutarse.
  const deleteMutation = useDeleteReview(bookId);

  // Las reseñas ajenas excluyen la mía (se muestra en su propia sección).
  const otherReviews = reviews.filter((r) => r.id !== myReview?.id);

  const dist = communityStats?.distribution ?? [];
  const avgRating = communityStats?.avgRating ?? 0;
  const ratingsCount = communityStats?.ratingsCount ?? 0;

  return (
    <View className="pb-6">
      {/* ── Resumen de ratings ───────────────────────────── */}
      {communityStats && ratingsCount > 0 && (
        <View className="m-container mb-0 bg-surface rounded-card p-4 border border-border flex-row gap-container items-start">
          <View className="items-center shrink-0">
            <Text className="font-display-bold text-3xl text-star leading-[48px]">
              {avgRating > 0 ? avgRating.toFixed(1) : "—"}
            </Text>
            <View className="mt-[5px]">
              <StarRating rating={avgRating} size={12} />
            </View>
            <Text className="font-body text-xs text-t3 mt-[5px] text-center leading-[14px]">
              {`${ratingsCount.toLocaleString()}\nratings`}
            </Text>
          </View>
          <View className="flex-1 pt-1">
            {dist.map(({ star, pct }) => (
              <RatingBar
                key={star}
                star={star}
                pct={pct}
                active={false}
                onPress={() => {}}
              />
            ))}
          </View>
        </View>
      )}

      {/* ── CTA escribir reseña ──────────────────────────── */}
      <View className="px-container pt-3.5 pb-3.5">
        <TouchableOpacity
          onPress={onWriteReview}
          activeOpacity={0.85}
          className="py-3.5 rounded-card bg-accent items-center"
        >
          <Text className="font-body-sb text-sm text-white">
            {myReview ? "Editar mi reseña" : "Escribir mi reseña"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Mi reseña (si existe) ────────────────────────── */}
      {myReview && (
        <View className="px-container">
          <Text className="font-body-sb text-xs text-t3 uppercase tracking-widest mb-2">
            Mi reseña
          </Text>
          <ReviewCard
            review={{ ...myReview, users: null }}
            isOwn
            onEdit={onWriteReview}
            onDelete={() => deleteMutation.mutate(myReview.id)}
            onShare={() => setSharingReview({ ...myReview, users: null })}
          />
        </View>
      )}

      {/* ── Lista de reseñas ─────────────────────────────── */}
      <View className="px-container">
        {/* Título de sección solo si hay reseñas de otros */}
        {otherReviews.length > 0 && (
          <Text className="font-body-sb text-xs text-t3 uppercase tracking-widest mb-2">
            Reseñas de lectores
          </Text>
        )}

        {/* Estado de carga inicial */}
        {isLoading && (
          <View className="items-center py-6">
            <ActivityIndicator color={c.accent} />
          </View>
        )}

        {/* Estado vacío */}
        {!isLoading && otherReviews.length === 0 && !myReview && (
          <View className="items-center py-8">
            <Text className="font-body text-xs text-t3 text-center">
              Sé el primero en reseñar este libro.
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
                Cargar más reseñas
              </Text>
            )}
          </Pressable>
        )}
      </View>

      {/* ViewShot offscreen para capturar ReviewShareCard */}
      {sharingReview && (
        <View className="absolute top-0 left-[-9999px]">
          <ViewShot ref={shareRef}>
            <ReviewShareCard
              review={sharingReview}
              bookTitle={book?.title}
              bookCoverUrl={book?.cover_url}
              bookGoogleId={book?.google_books_id}
            />
          </ViewShot>
        </View>
      )}
    </View>
  );
}
