import { ActivityIndicator, View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Avatar } from '~/components/ui/Avatar'
import { ErrorState } from '~/components/ui/ErrorState'
import { StarRating } from '~/components/ui/StarRating'
import {
  bookCommunityStatsQueryOptions,
  type FriendActivity
} from '../book.queries'
import { useAuthStore } from '~/stores/auth.store'
import { STATUS_META } from '~/lib/book-status'
import { alpha, useColors } from '~/theme/colors'

// Representa la distribución con colores del tema y porcentajes localizados.
function RatingBar({ star, pct }: { star: number; pct: number }) {
  const c = useColors()
  const { i18n } = useTranslation()

  return (
    <View className="flex-row items-center gap-[7px] py-[2px]">
      <Text className="font-body text-xs text-t3 w-2 text-right">
        {star.toLocaleString(i18n.language)}
      </Text>
      <View className="flex-1 h-1 bg-sh rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: c.star
          }}
        />
      </View>
      <Text className="font-body text-xs text-t3 w-12 text-right">
        {(pct / 100).toLocaleString(i18n.language, {
          style: 'percent',
          maximumFractionDigits: 0
        })}
      </Text>
    </View>
  )
}

// Conserva la actividad real de cada lector y adapta su estado y progreso al tema.
function FriendRow({
  friend,
  pageCount
}: {
  friend: FriendActivity
  pageCount?: number | null
}) {
  const c = useColors()
  const { t, i18n } = useTranslation()
  const meta = STATUS_META[friend.status as keyof typeof STATUS_META]
  if (!meta) return null

  const progressPct =
    friend.status === 'reading' &&
    friend.currentPage != null &&
    pageCount != null &&
    pageCount > 0
      ? Math.max(
          0,
          Math.min(100, Math.round((friend.currentPage / pageCount) * 100))
        )
      : null

  return (
    <View className="flex-row items-center gap-2.5 mb-3">
      <Avatar
        displayName={friend.displayName ?? friend.username}
        username={friend.username}
        avatarUrl={friend.avatarUrl}
        size={30}
      />
      <View className="flex-1 min-w-0">
        <Text className="font-body-md text-xs text-text">
          {friend.displayName ?? friend.username}
        </Text>
        <Text className="font-body text-xs text-t3 mt-[1px]">
          @{friend.username}
        </Text>
        {progressPct != null && (
          <View className="mt-[5px]">
            <View className="h-[3px] bg-sh rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: c.status.reading
                }}
              />
            </View>
            <Text className="font-body text-xs text-t3 mt-[2px]">
              {t('book.pageProgressShort', {
                current: friend.currentPage?.toLocaleString(i18n.language),
                pct: progressPct.toLocaleString(i18n.language)
              })}
            </Text>
          </View>
        )}
      </View>
      <View
        className="rounded-full"
        style={{
          paddingHorizontal: 9,
          paddingVertical: 3,
          backgroundColor: alpha(c.status[meta.colorRole], 0.11)
        }}
      >
        <Text
          className="font-body-md text-xs"
          style={{ color: c.status[meta.colorRole] }}
        >
          {t(meta.labelKey)}
        </Text>
      </View>
    </View>
  )
}

// Distingue carga y error recuperable sin descartar las estadísticas ya disponibles.
export function BookCommunityTab({
  bookId,
  pageCount
}: {
  bookId: string
  pageCount?: number | null
}) {
  const c = useColors()
  const { t, i18n } = useTranslation()
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const query = useQuery(bookCommunityStatsQueryOptions(bookId, userId))

  const { data } = query

  if (query.isError && !data) {
    return (
      <View className="py-8">
        <ErrorState onRetry={() => void query.refetch()} />
      </View>
    )
  }

  if (query.isPending || !data) {
    return (
      <View className="py-12 items-center">
        <ActivityIndicator color={c.accent} />
      </View>
    )
  }

  const stats = [
    {
      value: data.totalReaders.toLocaleString(i18n.language),
      label: t('community.readers')
    },
    {
      value: data.readingCount.toLocaleString(i18n.language),
      label: t('community.reading')
    },
    {
      value: data.wantCount.toLocaleString(i18n.language),
      label: t('community.toRead')
    },
    {
      value:
        data.avgRating > 0
          ? `${data.avgRating.toLocaleString(i18n.language, { maximumFractionDigits: 1 })} ★`
          : '—',
      label: t('community.rating'),
      isRating: true
    }
  ]

  return (
    <View className="pb-6">
      {/* Stats grid */}
      <View className="m-container mb-3.5 bg-surface rounded-card border border-border overflow-hidden">
        <View className="flex-row flex-wrap">
          {stats.map(({ value, label, isRating }, i) => (
            <View
              key={label}
              className="items-center py-4 px-2.5"
              style={{
                width: '50%',
                borderRightWidth: i % 2 === 0 ? 1 : 0,
                borderBottomWidth: i < 2 ? 1 : 0,
                borderColor: c.border
              }}
            >
              <Text
                className="font-body-bold text-md"
                style={{ color: isRating ? c.star : c.text }}
              >
                {value}
              </Text>
              <Text className="font-body text-xs text-t3 mt-[3px]">
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Friends activity */}
      {data.friendActivity.length > 0 && (
        <View className="mx-container mb-3.5 bg-surface rounded-card p-4 border border-border">
          <Text className="font-body-sb text-xs text-t3 uppercase tracking-wider mb-3">
            {t('community.friendsActivity')}
          </Text>
          {data.friendActivity.map((friend) => (
            <FriendRow
              key={friend.userId}
              friend={friend}
              pageCount={pageCount}
            />
          ))}
        </View>
      )}

      {/* Rating distribution */}
      {data.ratingsCount > 0 && (
        <View className="mx-container bg-surface rounded-card p-4 border border-border">
          <Text className="font-body-sb text-xs text-t3 uppercase tracking-wider mb-3">
            {t('community.ratingDistribution')}
          </Text>
          <View className="flex-row gap-container items-start">
            <View className="items-center shrink-0">
              <Text className="font-display-bold text-3xl text-star leading-[46px]">
                {data.avgRating.toLocaleString(i18n.language, {
                  maximumFractionDigits: 1
                })}
              </Text>
              <View className="mt-1">
                <StarRating rating={data.avgRating} size={12} />
              </View>
              <Text className="font-body text-xs text-t3 mt-1">
                {data.ratingsCount.toLocaleString(i18n.language)}
              </Text>
            </View>
            <View className="flex-1 pt-1">
              {data.distribution.map(({ star, pct }) => (
                <RatingBar key={star} star={star} pct={pct} />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Empty state */}
      {data.totalReaders === 0 && (
        <View className="mx-container bg-surface rounded-card p-8 border border-border items-center">
          <Text className="font-body text-xs text-t3 text-center">
            {t('community.beFirstLibrary')}
          </Text>
        </View>
      )}
    </View>
  )
}
