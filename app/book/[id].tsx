import { useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBook } from "~/features/book/hooks/useBook";
import { BookCommunityTab } from "~/features/book/components/BookCommunityTab";
import { BookCtaBar } from "~/features/book/components/BookCtaBar";
import { BookHero } from "~/features/book/components/BookHero";
import { BookReviewsTab } from "~/features/book/components/BookReviewsTab";
import { BookSimilarTab } from "~/features/book/components/BookSimilarTab";
import { BookSummaryTab } from "~/features/book/components/BookSummaryTab";
import { BookTabBar, type BookTab } from "~/features/book/components/BookTabBar";
import { useDeleteUserBook } from "~/features/library/hooks/useDeleteUserBook";
import { useUpsertUserBook } from "~/features/library/hooks/useUpsertUserBook";
import { useUserBook } from "~/features/library/hooks/useUserBook";
import { BookShareCard } from "~/features/share/components/BookShareCard";
import { useShareCard } from "~/features/share/hooks/useShareCard";
import { useAuthStore } from "~/stores/auth.store";
import { type BookStatus } from "~/lib/book-status";
import { fixed, useColors } from "~/theme/colors";

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const username = useAuthStore((s) => s.user?.user_metadata?.username as string | undefined);

  const [activeTab, setActiveTab] = useState<BookTab>(0);

  const { data: book, isLoading } = useBook(id);
  const { data: userBook } = useUserBook(book?.id ?? "");
  const upsertMutation = useUpsertUserBook(book?.id ?? "");
  const deleteMutation = useDeleteUserBook(book?.id ?? "");

  const { ref: shareRef, capture: captureBook } = useShareCard();

  const status = (userBook?.status as BookStatus) ?? null;
  const rating = userBook?.rating ?? null;
  const isPending = upsertMutation.isPending || deleteMutation.isPending;

  function handleStatusClick(s: BookStatus) {
    if (!book) return;
    if (status === s) {
      deleteMutation.mutate();
    } else {
      upsertMutation.mutate({ bookId: book.id, status: s, rating });
    }
  }

  function handleCtaStatusPress() {
    if (!book) return;
    if (!status) {
      upsertMutation.mutate({ bookId: book.id, status: "want_to_read", rating });
    } else {
      // Navigate to Resumen tab where user can change status
      setActiveTab(0);
    }
  }

  function handleRatingClick(i: number) {
    if (!book) return;
    const newRating = rating === i ? i - 0.5 : i;
    upsertMutation.mutate({
      bookId: book.id,
      status: status ?? "read",
      rating: newRating,
    });
  }

  function handleRatingButtonPress() {
    setActiveTab(0);
  }

  function handleWriteReview() {
    if (!book) return;
    router.push(`/review/new?bookId=${book.id}`);
  }

  function handleAddToList() {
    if (!book) return;
    router.push({
      pathname: '/book/add-to-list',
      params: { bookId: book.id, bookTitle: book.title },
    } as any);
  }

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-bg items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator color={fixed.accent} />
      </View>
    );
  }

  if (!book) {
    return (
      <View
        className="flex-1 bg-bg items-center justify-center px-8"
        style={{ paddingTop: insets.top }}
      >
        <Text className="font-body text-sm text-t2 text-center">
          No se encontró el libro.
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="font-body-sb text-sm text-accent">Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        stickyHeaderIndices={[2]}
      >
        {/* 0 — scrolls away */}
        <BookHero book={book} onBack={() => router.back()} onShare={captureBook} />

        {/* 1 — scrolls away */}
        <BookCtaBar
          book={book}
          status={status}
          rating={rating}
          userBook={userBook ?? null}
          isPending={isPending}
          onStatusPress={handleCtaStatusPress}
          onRatingPress={handleRatingButtonPress}
          onAddToList={handleAddToList}
        />

        {/* 2 — sticks to top */}
        <BookTabBar activeTab={activeTab} onChange={setActiveTab} />

        {/* 3 — tab content */}
        <View>
          {activeTab === 0 && (
            <BookSummaryTab
              book={book}
              status={status}
              rating={rating}
              isPending={isPending}
              onStatusClick={handleStatusClick}
              onRatingClick={handleRatingClick}
              // Desde Resumen: cambia al tab de Reseñas antes de abrir el modal
              // para que el usuario vea su reseña en contexto al volver.
              onWriteReview={() => { setActiveTab(1); handleWriteReview(); }}
            />
          )}
          {activeTab === 1 && (
            <BookReviewsTab
              bookId={book.id}
              book={book}
              onWriteReview={handleWriteReview}
            />
          )}
          {activeTab === 2 && <BookCommunityTab bookId={book.id} />}
          {activeTab === 3 && <BookSimilarTab />}
        </View>
      </ScrollView>

      {/* ViewShot off-screen para capturar BookShareCard */}
      <View className="absolute left-[-9999px] top-0">
        <ViewShot ref={shareRef}>
          <BookShareCard book={book} rating={rating} username={username} />
        </ViewShot>
      </View>
    </View>
  );
}
