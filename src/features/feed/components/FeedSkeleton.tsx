import { View } from 'react-native'
import { Skeleton } from '~/components/ui/Skeleton'

// Reserva la composición compacta del feed mientras llega la actividad.
function FeedCardSkeleton() {
  return (
    <View className="mx-4 mb-3 rounded-xl bg-surface p-4 gap-4">
      <View className="flex-row items-center gap-3">
        <Skeleton width={40} height={40} radius={20} />
        <View className="flex-1 gap-2">
          <Skeleton width="55%" height={16} />
          <Skeleton width="35%" height={12} />
        </View>
      </View>
      <View className="flex-row rounded-xl bg-sr p-3 gap-4">
        <Skeleton width={64} height={96} radius={4} />
        <View className="flex-1 gap-3 pt-2">
          <Skeleton width="80%" height={20} />
          <Skeleton width="60%" height={14} />
        </View>
      </View>
      <Skeleton width="80%" height={16} />
    </View>
  )
}

// Mantiene la misma jerarquía y separación que las tarjetas cargadas.
export function FeedSkeleton() {
  return (
    <View className="pt-6">
      <FeedCardSkeleton />
      <FeedCardSkeleton />
    </View>
  )
}
