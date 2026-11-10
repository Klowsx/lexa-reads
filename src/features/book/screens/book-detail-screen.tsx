import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { QueryBoundary } from '~/components/ui/QueryBoundary'
import { BookSkeleton } from '~/features/book/components/BookSkeleton'
import { useBook } from '~/features/book/hooks/useBook'
import { BookCommunityTab } from '~/features/book/components/BookCommunityTab'
import { BookCtaBar } from '~/features/book/components/BookCtaBar'
import { BookHero } from '~/features/book/components/BookHero'
import { BookReviewsTab } from '~/features/book/components/BookReviewsTab'
import { BookSimilarTab } from '~/features/book/components/BookSimilarTab'
import { BookSummaryTab } from '~/features/book/components/BookSummaryTab'
import { BookTabBar, type BookTab } from '~/features/book/components/BookTabBar'
import { BookReadingSheet } from '~/features/book/components/BookReadingSheet'
import { useUserBook } from '~/features/library/hooks/useUserBook'
import { BookShareCard } from '~/features/share/components/BookShareCard'
import { SharePreviewSheet } from '~/features/share/components/SharePreviewSheet'
import { useAuthStore } from '~/stores/auth.store'
import { type BookStatus } from '~/lib/book-status'

// Carga la edición y mantiene sus acciones de lectura conectadas al editor compartido.
export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const username = useAuthStore(
    (s) => s.user?.user_metadata?.username as string | undefined
  )

  const [activeTab, setActiveTab] = useState<BookTab>(0)

  const bookQuery = useBook(id)
  const book = bookQuery.data
  const userBookQuery = useUserBook(book?.id ?? '')
  const userBook = userBookQuery.data
  const [showReadingSheet, setShowReadingSheet] = useState(false)

  const [showSharePreview, setShowSharePreview] = useState(false)

  const status = (userBook?.status as BookStatus) ?? null
  const rating = userBook?.rating ?? null
  const isPending = userBookQuery.isPending

  // Abre todos los estados y la puntuación sin obligar a buscar el formulario en el scroll.
  function openReadingSheet() {
    setShowReadingSheet(true)
  }

  // Abre la reseña vinculada al libro persistido.
  function handleWriteReview() {
    if (!book) return
    router.push(`/review/new?bookId=${book.id}`)
  }

  // Conserva el contexto del libro al abrir el selector de listas.
  function handleAddToList() {
    if (!book) return
    router.push({
      pathname: '/book/add-to-list',
      params: { bookId: book.id, bookTitle: book.title }
    } as any)
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="w-full max-w-3xl flex-1 self-center">
        <QueryBoundary query={bookQuery} skeleton={<BookSkeleton />}>
          {(book) =>
            book ? (
              <>
                <ScrollView
                  className="flex-1"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                  stickyHeaderIndices={[2]}
                >
                  {/* 0 — scrolls away */}
                  <BookHero
                    book={book}
                    onBack={() => router.back()}
                    onShare={() => setShowSharePreview(true)}
                  />

                  {/* 1 — scrolls away */}
                  <BookCtaBar
                    book={book}
                    status={status}
                    rating={rating}
                    userBook={userBook ?? null}
                    isPending={isPending}
                    onStatusPress={openReadingSheet}
                    onRatingPress={openReadingSheet}
                    onAddToList={handleAddToList}
                  />

                  {/* 2 — sticks to top */}
                  <BookTabBar activeTab={activeTab} onChange={setActiveTab} />

                  {/* 3 — tab content */}
                  <View>
                    {activeTab === 0 && (
                      <BookSummaryTab
                        book={book}
                        // Desde Resumen: cambia al tab de Reseñas antes de abrir el modal
                        // para que el usuario vea su reseña en contexto al volver.
                        onWriteReview={() => {
                          setActiveTab(1)
                          handleWriteReview()
                        }}
                      />
                    )}
                    {activeTab === 1 && (
                      <BookReviewsTab
                        bookId={book.id}
                        book={book}
                        onWriteReview={handleWriteReview}
                      />
                    )}
                    {activeTab === 2 && (
                      <BookCommunityTab
                        bookId={book.id}
                        pageCount={book.page_count}
                      />
                    )}
                    {activeTab === 3 && <BookSimilarTab book={book} />}
                  </View>
                </ScrollView>

                {showReadingSheet && (
                  <BookReadingSheet
                    book={book}
                    showSynopsis={false}
                    showBookLink={false}
                    onClose={() => setShowReadingSheet(false)}
                  />
                )}

                {showSharePreview && (
                  <SharePreviewSheet
                    key={`${book.id}:${book.cover_url ?? ''}`}
                    onClose={() => setShowSharePreview(false)}
                  >
                    {(onCoverReady) => (
                      <BookShareCard
                        book={book}
                        rating={rating}
                        username={username}
                        onCoverReady={onCoverReady}
                      />
                    )}
                  </SharePreviewSheet>
                )}
              </>
            ) : (
              <View className="flex-1 items-center justify-center px-8">
                <Text className="font-body text-sm text-t2 text-center">
                  {t('book.notFound')}
                </Text>
                <Pressable
                  onPress={() => router.back()}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.back')}
                  className="mt-4"
                >
                  <Text className="font-body-sb text-sm text-accent">
                    {t('common.back')}
                  </Text>
                </Pressable>
              </View>
            )
          }
        </QueryBoundary>
      </View>
    </View>
  )
}
