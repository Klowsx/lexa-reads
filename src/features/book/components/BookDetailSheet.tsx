import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookCover } from "~/components/ui/BookCover";
import { useUpsertUserBook } from "~/features/library/hooks/useUpsertUserBook";
import { useUserBook } from "~/features/library/hooks/useUserBook";
import { STATUS_META, type BookStatus } from "~/lib/book-status";
import { fixed, useColors } from "~/theme/colors";
import { toAppError, type Tables } from "~/types";

const STAR = fixed.star;
const STATUS_ORDER: BookStatus[] = [
  "want_to_read",
  "reading",
  "read",
  "abandoned",
];

// Convierte un color hexadecimal en rgba para resaltar estados y estrellas sin crear nuevos tokens.
function alpha(hex: string, opacity: number) {
  const numericColor = parseInt(hex.replace("#", ""), 16);
  return `rgba(${numericColor >> 16},${(numericColor >> 8) & 255},${numericColor & 255},${opacity})`;
}

interface BookDetailSheetProps {
  book: Tables<"books">;
  onClose: () => void;
}

// Muestra una ficha rápida conectada a la biblioteca real del usuario.
export function BookDetailSheet({ book, onClose }: BookDetailSheetProps) {
  const router = useRouter();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const userBookQuery = useUserBook(book.id);
  const saveUserBook = useUpsertUserBook(book.id);
  const status = (userBookQuery.data?.status as BookStatus | undefined) ?? null;
  const rating = userBookQuery.data?.rating ?? null;
  const isSaving = saveUserBook.isPending;
  const error = saveUserBook.error
    ? toAppError(saveUserBook.error).message
    : undefined;

  // Guarda el estado seleccionado en la biblioteca sin eliminar datos al pulsar la opción activa.
  function handleStatusPress(nextStatus: BookStatus) {
    if (isSaving || status === nextStatus) return;

    saveUserBook.mutate({ bookId: book.id, status: nextStatus, rating });
  }

  // Guarda la puntuación y crea el registro como leído cuando todavía no existe un estado.
  function handleRatingPress(nextRating: number) {
    if (isSaving) return;

    saveUserBook.mutate({
      bookId: book.id,
      status: status ?? "read",
      rating: rating === nextRating ? null : nextRating,
    });
  }

  // Abre el editor de reseña para el libro persistido y cierra la hoja temporal.
  function handleWriteReview() {
    onClose();
    router.push(`/review/new?bookId=${book.id}`);
  }

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/[0.72]" onPress={onClose} />

        <View
          className="rounded-t-lg overflow-hidden bg-surface"
          style={{ maxHeight: "87%", paddingBottom: insets.bottom + 8 }}
        >
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View className="flex-row gap-4 px-5 pt-4 pb-3.5">
              <BookCover book={book} width={82} height={124} />
              <View className="flex-1">
                <Text
                  className="font-display-sb text-md text-text leading-tight mb-1"
                  numberOfLines={3}
                >
                  {book.title}
                </Text>
                <Text className="font-body text-sm text-t2 mb-2">
                  {book.authors?.join(", ")}
                </Text>
                <Text className="font-body text-xs text-t3">
                  {t("book.pagesLong", { count: book.page_count })} · {book.published_year}
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-1.5 px-5 pb-3.5">
              {STATUS_ORDER.map((itemStatus) => {
                const meta = STATUS_META[itemStatus];
                const active = status === itemStatus;
                return (
                  <Pressable
                    key={itemStatus}
                    onPress={() => handleStatusPress(itemStatus)}
                    disabled={isSaving || active}
                    className="rounded-full"
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      backgroundColor: active ? alpha(meta.color, 0.15) : c.sh,
                      borderWidth: 1.5,
                      borderColor: active ? meta.color : c.border,
                      opacity: isSaving ? 0.6 : 1,
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled: isSaving || active }}
                    accessibilityLabel={t(meta.labelKey)}
                  >
                    <Text
                      className={active ? "font-body-md text-xs" : "font-body text-xs"}
                      style={{ color: active ? meta.color : c.t2 }}
                    >
                      {t(meta.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="mx-4 mb-3.5 rounded-md p-3 bg-sr border border-border">
              <Text className="font-body-sb text-xs text-t3 tracking-wider uppercase mb-2">
                {t("book.myRatingShort")}
              </Text>
              <View className="flex-row items-center gap-2.5">
                <View className="flex-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => handleRatingPress(star)}
                      disabled={isSaving}
                      hitSlop={4}
                      accessibilityRole="button"
                      accessibilityLabel={`${star} estrellas`}
                      accessibilityState={{ selected: rating === star, disabled: isSaving }}
                    >
                      <View className="relative w-[34px] h-8">
                        <Text
                          className="text-xl absolute"
                          style={{ lineHeight: 32, color: alpha(STAR, 0.2) }}
                        >
                          ★
                        </Text>
                        {rating != null && rating >= star ? (
                          <Text className="text-xl absolute leading-8 text-star">★</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                {rating != null ? (
                  <Text className="font-body-sb text-md text-star">{rating}</Text>
                ) : null}
                {isSaving ? <ActivityIndicator size="small" color={c.accent} /> : null}
              </View>
              <Text className="text-xs text-t3 font-body mt-1.5">
                {t("book.doubleTapRemove")}
              </Text>
            </View>

            {error ? (
              <Text className="font-body text-error text-xs px-5 pb-3">{error}</Text>
            ) : null}

            {book.description ? (
              <View className="px-5 pb-3.5">
                <Text className="font-body-sb text-xs text-t3 tracking-wider uppercase mb-1.5">
                  {t("book.synopsis")}
                </Text>
                <Text className="font-body text-sm text-t2 leading-relaxed">
                  {book.description}
                </Text>
              </View>
            ) : null}

            <View className="flex-row flex-wrap gap-1.5 px-5 pb-4">
              {book.genres?.map((genre) => (
                <Text
                  key={genre}
                  className="text-xs font-body text-t3 px-2.5 py-1 rounded-sm bg-sh border border-border"
                >
                  {genre}
                </Text>
              ))}
            </View>

            <View className="px-5 pb-2">
              <TouchableOpacity
                className="rounded-md items-center py-3.5 bg-accent"
                activeOpacity={0.85}
                onPress={handleWriteReview}
              >
                <Text className="text-sm font-body-sb text-white">
                  {t("book.writeReview")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
