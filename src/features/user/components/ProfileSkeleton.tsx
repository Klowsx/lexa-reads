import { useTranslation } from 'react-i18next'
import { View, useWindowDimensions } from 'react-native'
import { Skeleton } from '~/components/ui/Skeleton'

export function ProfileSkeleton() {
  const { t } = useTranslation()
  const { width, fontScale } = useWindowDimensions()
  const columns = Math.min(width, 720) / fontScale < 390 ? 2 : 4
  return (
    <View
      className="pt-3 gap-6"
      accessibilityLabel={t('common.loading')}
      accessibilityState={{ busy: true }}
      aria-busy
    >
      <View className="mx-container overflow-hidden rounded-card bg-surface">
        <View className="px-5 pt-6 pb-5 gap-5">
          <View className="flex-row items-center gap-4">
            <Skeleton width={84} height={84} radius={42} animate={false} />
            <View className="flex-1 gap-2">
              <Skeleton width="80%" height={32} animate={false} />
              <Skeleton width="55%" height={20} animate={false} />
            </View>
          </View>
          <Skeleton width="72%" height={24} animate={false} />
        </View>
        <View className="flex-row flex-wrap border-t border-border px-2 py-3">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className="items-center gap-2 py-3"
              style={{ width: `${100 / columns}%` }}
            >
              <Skeleton width={32} height={30} animate={false} />
              <Skeleton width={64} height={20} animate={false} />
            </View>
          ))}
        </View>
      </View>
      <View className="px-container gap-3">
        <Skeleton width="60%" height={32} animate={false} />
        <View className="rounded-card bg-surface p-4 flex-row gap-4">
          <Skeleton width={80} height={120} radius={5} animate={false} />
          <View className="flex-1 justify-center gap-3">
            <Skeleton width="90%" height={24} animate={false} />
            <Skeleton width="60%" height={20} animate={false} />
            <Skeleton height={6} radius={99} animate={false} />
          </View>
        </View>
      </View>
      <Skeleton height={176} radius={14} animate={false} />
    </View>
  )
}
