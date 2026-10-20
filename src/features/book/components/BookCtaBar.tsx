import { ChevronDown, ListPlus } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { alpha, fixed, useColors } from '~/theme/colors'
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

// Abre el editor compartido desde cualquier posición de la ficha y resume el estado guardado.
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

  const isReading = status === 'reading'
  const statusMeta = status ? STATUS_META[status] : null
  const statusColor = statusMeta?.color ?? fixed.accent

  const currentPage = userBook?.current_page ?? null
  const pageCount = book.page_count ?? null
  const progressPct =
    isReading && currentPage && pageCount
      ? Math.min(1, currentPage / pageCount)
      : null

  return (
    <View
      className="px-container py-3 border-b bg-bg"
      style={{ borderBottomColor: alpha(c.border, 0.55) }}
    >
      {/* Buttons row */}
      <View className="flex-row gap-2">
        {/* Main status button */}
        <Pressable
          onPress={onStatusPress}
          disabled={isPending}
          accessibilityRole="button"
          accessibilityLabel={t('reading.manageStatus')}
          accessibilityState={{ disabled: isPending }}
          className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: status ? alpha(statusColor, 0.13) : c.sr,
            borderWidth: 1.5,
            borderColor: status ? statusColor : c.border
          }}
        >
          <Text className="font-body-sb text-sm" style={{ color: c.text }}>
            {status ? t(STATUS_META[status].labelKey) : t('reading.add')}
          </Text>
          {status && (
            <ChevronDown size={12} color={statusColor} strokeWidth={2} />
          )}
        </Pressable>

        {/* Add to list button */}
        {onAddToList && (
          <Pressable
            onPress={onAddToList}
            accessibilityRole="button"
            accessibilityLabel={t('reading.addToList')}
            className="flex-row items-center gap-1.5 py-3 px-3 rounded-card bg-surface border border-border"
          >
            <ListPlus size={16} color={c.t2} strokeWidth={1.8} />
          </Pressable>
        )}

        {/* Rating button */}
        <Pressable
          onPress={onRatingPress}
          accessibilityRole="button"
          accessibilityLabel={t('reading.editRating')}
          className="flex-row items-center gap-1.5 py-3 px-4 rounded-card bg-surface border border-border"
        >
          {rating != null ? (
            <>
              <Text className="text-sm text-star leading-[15px]">★</Text>
              <Text className="font-body-sb text-sm text-text">{rating}</Text>
            </>
          ) : (
            <>
              <Text className="text-sm text-t3 leading-[15px]">☆</Text>
              <Text className="font-body text-xs text-t2">
                {t('book.rate')}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Reading progress bar */}
      {progressPct != null && (
        <View className="mt-2.5">
          <View className="flex-row justify-between mb-[5px]">
            <Text className="font-body text-xs text-t3">
              {t('book.pageProgress', {
                current: currentPage,
                total: pageCount
              })}
            </Text>
            <Text
              className="font-body-sb text-xs"
              style={{ color: fixed.status.reading }}
            >
              {Math.round(progressPct * 100)}%
            </Text>
          </View>
          <View className="h-[3px] bg-sh rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${progressPct * 100}%`,
                backgroundColor: fixed.status.reading
              }}
            />
          </View>
        </View>
      )}
    </View>
  )
}
