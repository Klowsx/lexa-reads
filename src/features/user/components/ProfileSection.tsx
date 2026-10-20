import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { Skeleton } from '~/components/ui/Skeleton'

export function ProfileSectionHeading({
  title,
  action,
  onAction
}: {
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-x-3 mb-3">
      <Text
        accessibilityRole="header"
        className="font-display-sb text-lg text-text tracking-tight shrink"
      >
        {title}
      </Text>
      {action && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${action}: ${title}`}
          onPress={onAction}
          className="min-h-11 justify-center rounded-sm px-1 active:bg-sr"
        >
          <Text className="font-body-sb text-xs text-text underline">
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export function ProfileEmptyState({
  message,
  action,
  onAction
}: {
  message: string
  action?: string
  onAction?: () => void
}) {
  return (
    <View className="bg-surface rounded-card p-5 items-start gap-3">
      <Text className="font-body text-xs text-t2 leading-6">{message}</Text>
      {action && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          className="min-h-12 px-4 py-3 rounded-md border border-border justify-center active:bg-sr"
        >
          <Text className="font-body-sb text-xs text-text">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

// A failed or pending collection must not look like an empty library.
export function ProfileSectionBoundary({
  query,
  title,
  children
}: {
  query: { isPending: boolean; isError: boolean; refetch: () => unknown }
  title: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  if (query.isPending) {
    return (
      <View
        className="px-container mb-8 gap-3"
        accessibilityLabel={`${title}: ${t('common.loading')}`}
        accessibilityState={{ busy: true }}
        aria-busy
      >
        <Skeleton width="55%" height={32} animate={false} />
        <Skeleton height={112} radius={14} animate={false} />
      </View>
    )
  }
  if (query.isError) {
    return (
      <View className="px-container mb-8">
        <ProfileSectionHeading title={title} />
        <ProfileEmptyState
          message={t('profile.sectionError')}
          action={t('common.retry')}
          onAction={() => void query.refetch()}
        />
      </View>
    )
  }
  return <>{children}</>
}
