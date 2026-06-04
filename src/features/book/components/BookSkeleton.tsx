import { View } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";

/** Skeleton del detalle de libro (UX-2): hero + barra CTA + bloque de texto. */
export function BookSkeleton() {
  return (
    <View className="flex-1">
      {/* Hero: cover + título */}
      <View className="flex-row gap-4 px-4 pt-6">
        <Skeleton width={110} height={166} radius={6} />
        <View className="flex-1 gap-2.5 pt-2">
          <Skeleton width="85%" height={18} />
          <Skeleton width="55%" height={13} />
          <Skeleton width="40%" height={13} />
          <View className="flex-row gap-1 mt-2">
            <Skeleton width={90} height={12} />
          </View>
        </View>
      </View>

      {/* CTA bar */}
      <View className="flex-row gap-2 px-4 pt-6">
        <Skeleton width="48%" height={40} radius={8} />
        <Skeleton width="48%" height={40} radius={8} />
      </View>

      {/* Tab bar */}
      <View className="flex-row gap-5 px-4 pt-7">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width={56} height={12} />
        ))}
      </View>

      {/* Texto */}
      <View className="px-4 pt-6 gap-2.5">
        <Skeleton width="100%" height={12} />
        <Skeleton width="95%" height={12} />
        <Skeleton width="90%" height={12} />
        <Skeleton width="70%" height={12} />
      </View>
    </View>
  );
}
