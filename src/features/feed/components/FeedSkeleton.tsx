import { View } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";

function FeedCardSkeleton() {
  return (
    <View className="bg-surface mb-px pb-4">
      <View className="flex-row items-center px-3.5 pt-3 pb-2.5 gap-2.5">
        <Skeleton width={36} height={36} radius={18} />
        <View className="flex-1 gap-1.5">
          <Skeleton width="55%" height={12} />
          <Skeleton width="35%" height={10} />
        </View>
      </View>
      <Skeleton width="100%" height={250} radius={0} />
      <View className="px-3.5 pt-3 gap-2">
        <Skeleton width="80%" height={12} />
        <Skeleton width="60%" height={12} />
      </View>
    </View>
  );
}

/** Skeleton del feed (UX-2). */
export function FeedSkeleton() {
  return (
    <View>
      <FeedCardSkeleton />
      <FeedCardSkeleton />
    </View>
  );
}
