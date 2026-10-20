import { View } from 'react-native'
import { Skeleton } from '~/components/ui/Skeleton'

interface LibrarySkeletonProps {
  itemWidth: number
  columns?: number
}

// Reserva las mismas columnas y dimensiones que tendrá la estantería al finalizar la carga.
export function LibrarySkeleton({
  itemWidth,
  columns = 3
}: LibrarySkeletonProps) {
  const coverHeight = Math.round(itemWidth * 1.52)
  return (
    <View className="flex-row flex-wrap" style={{ paddingHorizontal: 18 }}>
      {Array.from({ length: columns * 3 }).map((_, i) => (
        <View
          key={i}
          className="items-center"
          style={{ width: `${100 / columns}%`, marginBottom: 20 }}
        >
          <Skeleton width={itemWidth} height={coverHeight} radius={6} />
          <Skeleton
            width={itemWidth - 16}
            height={10}
            style={{ marginTop: 8 }}
          />
        </View>
      ))}
    </View>
  )
}
