import { View } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";

/** Skeleton del perfil (UX-2): cabecera de identidad + stats + secciones. */
export function ProfileSkeleton() {
  return (
    <View className="px-4 pt-4 gap-6">
      {/* Identidad */}
      <View className="flex-row items-center gap-4">
        <Skeleton width={72} height={72} radius={36} />
        <View className="flex-1 gap-2">
          <Skeleton width="55%" height={16} />
          <Skeleton width="35%" height={12} />
          <Skeleton width="80%" height={12} />
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row justify-between">
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} className="items-center gap-1.5">
            <Skeleton width={36} height={18} />
            <Skeleton width={52} height={10} />
          </View>
        ))}
      </View>

      {/* Sección — currently reading */}
      <View className="gap-3">
        <Skeleton width="40%" height={12} />
        <View className="flex-row gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width={96} height={146} radius={6} />
          ))}
        </View>
      </View>
    </View>
  );
}
