import {
  BookOpen,
  ChevronDown,
  ListPlus,
  Plus,
  Star
} from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { Skeleton } from '~/components/ui/Skeleton'
import { StarRating } from '~/components/ui/StarRating'
import { useColors } from '~/theme/colors'
import { type BookStatus, STATUS_META } from '~/lib/book-status'
import type { Tables } from '~/types/database'

interface BookCtaBarProps {
  book: Tables<'books'>
  status: BookStatus | null
  rating: number | null
  userBook: Tables<'user_books'> | null | undefined
  isPending: boolean
  onStatusPress: () => void
  onRatingPress: () => void
  onAddToList?: () => void
}

// Resume la lectura y ofrece un único acceso al editor, con valoración y listas a mano.
export function BookCtaBar({
  book,
  status,
  rating,
  userBook,
  isPending,
  onStatusPress,
  onRatingPress,
  onAddToList
}: BookCtaBarProps) {
  const c = useColors()
  const { t } = useTranslation()
  const currentPage = userBook?.current_page ?? null
  const pageCount = book.page_count ?? null
  // Incluye la página cero y limita el indicador a un porcentaje válido.
  const progress =
    status === 'reading' &&
    currentPage != null &&
    pageCount != null &&
    pageCount > 0
      ? Math.max(0, Math.min(100, Math.round((currentPage / pageCount) * 100)))
      : null
  const statusLabel = status
    ? t(STATUS_META[status].labelKey)
    : t('reading.add')

  return (
    <View className="mx-container mb-5 gap-3 rounded-card bg-surface p-4">
      {isPending ? (
        <View
          accessibilityLabel={t('common.loading')}
          accessibilityState={{ busy: true }}
          aria-busy
        >
          <Skeleton height={56} radius={12} animate={false} />
        </View>
      ) : (
        <Pressable
          onPress={onStatusPress}
          accessibilityRole="button"
          accessibilityLabel={`${statusLabel}. ${t('reading.manageStatus')}`}
          className="min-h-12 flex-row items-center gap-3 rounded-full bg-sr px-4 py-3 active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {status ? (
            <BookOpen
              size={21}
              color={c.status[status === 'want_to_read' ? 'want' : status]}
            />
          ) : (
            <Plus size={21} color={c.text} />
          )}
          <Text className="flex-1 font-body-sb text-sm text-text">
            {statusLabel}
          </Text>
          <ChevronDown size={20} color={c.text} />
        </Pressable>
      )}
      {progress != null && (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('book.pageProgress', {
            current: currentPage,
            total: pageCount
          })}
          accessibilityValue={{ min: 0, max: 100, now: progress }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="gap-2 py-2"
        >
          <View className="flex-row flex-wrap justify-between gap-2">
            <Text className="font-body text-sm text-t2">
              {t('book.pageProgress', {
                current: currentPage,
                total: pageCount
              })}
            </Text>
            <Text className="font-body-sb text-sm text-text">{progress}%</Text>
          </View>
          <View className="h-1 rounded-full bg-sr overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: c.status.reading
              }}
            />
          </View>
        </View>
      )}
      <View className="flex-row flex-wrap items-center justify-between gap-x-4">
        <Pressable
          onPress={onRatingPress}
          disabled={isPending}
          accessibilityRole="button"
          accessibilityLabel={
            rating != null
              ? `${t('book.ratingValue', { rating })}. ${t('reading.editRating')}`
              : t('reading.editRating')
          }
          accessibilityState={{ disabled: isPending }}
          className="min-h-12 flex-row items-center justify-center gap-2 rounded-md px-3 py-2 active:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {rating != null ? (
            <StarRating rating={rating} size={18} />
          ) : (
            <Star size={19} color={c.text} fill="none" />
          )}
          <Text className="font-body-md text-sm text-text">
            {rating != null ? `${rating} / 5` : t('book.rate')}
          </Text>
        </Pressable>
        {onAddToList && (
          <Pressable
            onPress={onAddToList}
            accessibilityRole="button"
            className="min-h-12 flex-row items-center justify-center gap-2 rounded-md px-3 py-2 active:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ListPlus size={20} color={c.text} />
            <Text className="font-body-md text-sm text-text">
              {t('reading.addToList')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}
