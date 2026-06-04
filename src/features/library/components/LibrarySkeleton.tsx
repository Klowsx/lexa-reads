import { View } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";

interface LibrarySkeletonProps {
  itemWidth: number;
}

/** Skeleton de la grilla de biblioteca (UX-2). 3 columnas, dos filas. */
export function LibrarySkeleton({ itemWidth }: LibrarySkeletonProps) {
  const coverHeight = Math.round(itemWidth * 1.52);
  return (
    <View
      className="flex-row flex-wrap"
      style={{ paddingHorizontal: 12, paddingTop: 16 }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <View key={i} className="items-center" style={{ width: "33.333%", marginBottom: 20 }}>
          <Skeleton width={itemWidth} height={coverHeight} radius={6} />
          <Skeleton width={itemWidth - 16} height={10} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}
