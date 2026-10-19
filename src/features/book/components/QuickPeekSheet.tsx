import { useRouter } from 'expo-router'
import { Check, Info, Star } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { BookCover } from '~/components/ui/BookCover'
import { useUpsertUserBook } from '~/features/library/hooks/useUpsertUserBook'
import { useUserBook } from '~/features/library/hooks/useUserBook'
import { SearchAction } from '~/features/search/components/SearchControls'
import {
  SearchFeedback,
  SearchLoading
} from '~/features/search/components/SearchFeedback'
import { SearchSheet } from '~/features/search/components/SearchSheet'
import { STATUS_META, STATUS_ORDER, type BookStatus } from '~/lib/book-status'
import { cn } from '~/lib/utils'
import { alpha, useColors } from '~/theme/colors'
import type { Tables } from '~/types'

interface Props {
  book: Tables<'books'>
  onClose: () => void
}

// Permite guardar y valorar sin abandonar la búsqueda ni perder el contexto del libro.
export function QuickPeekSheet({ book, onClose }: Props) {
  const router = useRouter()
  const c = useColors()
  const { t } = useTranslation()
  const [showPagesInfo, setShowPagesInfo] = useState(false)
  const userBookQuery = useUserBook(book.id)
  const saveUserBook = useUpsertUserBook(book.id)
  const status = (userBookQuery.data?.status as BookStatus | undefined) ?? null
  const rating = userBookQuery.data?.rating ?? null
  const isSaving = saveUserBook.isPending
  const disabled = isSaving || userBookQuery.isPending || userBookQuery.isError

  // Conserva la puntuación al cambiar el estado y evita escrituras simultáneas.
  function handleStatusPress(nextStatus: BookStatus) {
    if (disabled || status === nextStatus) return
    saveUserBook.mutate({ bookId: book.id, status: nextStatus, rating })
  }

  // Tocar la misma estrella retira la valoración existente.
  function handleRatingPress(nextRating: number) {
    if (disabled) return
    saveUserBook.mutate({
      bookId: book.id,
      status: status ?? 'read',
      rating: rating === nextRating ? null : nextRating
    })
  }

  // Cierra la hoja antes de navegar a la ficha completa.
  function goToDetail() {
    onClose()
    router.push('/book/' + book.google_books_id)
  }

  return (
    <SearchSheet title={t('search.quickPeekTitle')} onClose={onClose}>
      <View className="flex-row items-start gap-4">
        <BookCover book={book} width={80} height={120} />
        <View className="min-w-0 flex-1 gap-2">
          <Text className="font-display-sb text-md text-text">
            {book.title}
          </Text>
          <Text className="font-body text-xs text-t2">
            {book.authors?.join(', ') || t('book.unknownAuthor')}
          </Text>
          {book.page_count ? (
            <Pressable
              onPress={() => setShowPagesInfo(!showPagesInfo)}
              accessibilityRole="button"
              accessibilityLabel={t('book.pagesInfoTitle')}
              accessibilityState={{ expanded: showPagesInfo }}
              aria-expanded={showPagesInfo}
              className="min-h-12 flex-row flex-wrap items-center gap-2 rounded-md active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Text className="font-body text-xs text-t2">
                {t('book.pagesLong', { count: book.page_count })}
              </Text>
              <Info size={18} color={c.t2} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {showPagesInfo && (
        <View className="gap-2">
          <Text className="font-body-sb text-xs text-text">
            {t('book.pagesInfoTitle')}
          </Text>
          <Text className="font-body text-xs text-t2">
            {t('book.pagesInfoBody1')}
          </Text>
          <Text className="font-body text-xs text-t2">
            {t('book.pagesInfoBody2')}
          </Text>
        </View>
      )}
      {userBookQuery.isPending ? (
        <SearchLoading readers />
      ) : userBookQuery.isError ? (
        <SearchFeedback
          title={t('search.libraryError')}
          message={t('search.loadErrorHint')}
          action={t('common.retry')}
          onAction={() => {
            void userBookQuery.refetch()
          }}
        />
      ) : (
        <>
          <View className="gap-3">
            <Text
              accessibilityRole="header"
              className="font-body-sb text-sm text-text"
            >
              {t('search.readingStatus')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {STATUS_ORDER.map((itemStatus) => {
                const meta = STATUS_META[itemStatus]
                const active = status === itemStatus
                return (
                  <Pressable
                    key={itemStatus}
                    onPress={() => handleStatusPress(itemStatus)}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled }}
                    aria-selected={active}
                    aria-disabled={disabled}
                    style={
                      active
                        ? {
                            borderColor: meta.color,
                            backgroundColor: alpha(meta.color, 0.12)
                          }
                        : undefined
                    }
                    className={cn(
                      'min-h-12 flex-row items-center gap-2 rounded-full border px-4 py-3 active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                      active
                        ? 'border-accent bg-sr'
                        : 'border-border bg-surface',
                      disabled && 'opacity-50'
                    )}
                  >
                    {active && <Check size={18} color={c.text} />}
                    <Text
                      className={cn(
                        'text-xs text-text',
                        active ? 'font-body-sb' : 'font-body'
                      )}
                    >
                      {t(meta.labelKey)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
          <View className="gap-2">
            <Text
              accessibilityRole="header"
              className="font-body-sb text-sm text-text"
            >
              {t('book.myRatingShort')}
            </Text>
            <View className="flex-row flex-wrap items-center gap-2">
              <View className="flex-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => handleRatingPress(star)}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityLabel={t('search.rateStars', { count: star })}
                    accessibilityHint={t('search.ratingHint')}
                    accessibilityState={{ selected: rating === star, disabled }}
                    aria-selected={rating === star}
                    aria-disabled={disabled}
                    className="h-12 w-12 items-center justify-center rounded-md active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <Star
                      size={28}
                      color={c.t2}
                      fill={rating != null && rating >= star ? c.star : 'none'}
                      strokeWidth={1.5}
                    />
                  </Pressable>
                ))}
              </View>
              {rating != null && (
                <Text className="font-body-sb text-xs text-text">
                  {rating}/5
                </Text>
              )}
            </View>
            <Text className="font-body text-xs text-t2">
              {t('search.ratingHint')}
            </Text>
          </View>
        </>
      )}
      <View accessibilityLiveRegion="polite">
        {isSaving ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color={c.text} />
            <Text className="font-body text-xs text-t2">
              {t('search.saving')}
            </Text>
          </View>
        ) : saveUserBook.isError ? (
          <Text
            accessibilityRole="alert"
            className="font-body text-xs text-text"
          >
            {t('search.saveError')}
          </Text>
        ) : saveUserBook.isSuccess ? (
          <View className="flex-row items-center gap-2">
            <Check size={18} color={c.text} />
            <Text className="font-body text-xs text-text">
              {t('search.saved')}
            </Text>
          </View>
        ) : null}
      </View>
      <SearchAction label={t('book.viewFullBook')} onPress={goToDetail} />
    </SearchSheet>
  )
}
