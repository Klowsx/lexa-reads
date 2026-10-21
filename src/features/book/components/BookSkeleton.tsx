import { View } from 'react-native'
import { Skeleton } from '~/components/ui/Skeleton'

// Anticipa la composición centrada de la ficha para reducir los saltos durante la carga.
export function BookSkeleton() {
  return (
    <View className="flex-1 px-container">
      <View className="flex-row justify-between py-2">
        <Skeleton width={48} height={48} radius={24} />
        <Skeleton width={48} height={48} radius={24} />
      </View>
      <View className="items-center pt-2">
        <Skeleton width={132} height={198} radius={5} />
        <View className="mt-6 w-full items-center gap-3">
          <Skeleton width="80%" height={38} />
          <Skeleton width="55%" height={24} />
          <Skeleton width="45%" height={20} />
        </View>
      </View>
      <View className="mt-6 gap-3">
        <Skeleton height={56} radius={12} />
        <Skeleton width="80%" height={48} radius={12} />
      </View>
      <View className="mt-4">
        <Skeleton height={56} radius={6} />
      </View>
      <View className="gap-3 pt-6">
        <Skeleton width="40%" height={30} />
        <Skeleton height={20} />
        <Skeleton width="95%" height={20} />
        <Skeleton width="70%" height={20} />
      </View>
    </View>
  )
}
