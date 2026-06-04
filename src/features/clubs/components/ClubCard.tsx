import { Lock, Users } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useColors } from "~/theme/colors";
import type { ClubListItem } from "../clubs.queries";

export function ClubCard({ club, onPress }: { club: ClubListItem; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3 border-b border-border"
      accessibilityRole="button"
      accessibilityLabel={`Club ${club.name}`}
    >
      {club.current_book?.cover_url ? (
        <Image
          source={{ uri: club.current_book.cover_url }}
          style={{ width: 44, height: 64, borderRadius: 4 }}
          contentFit="cover"
        />
      ) : (
        <View className="w-[44px] h-[64px] rounded bg-sh items-center justify-center">
          <Users size={20} color={c.t3} strokeWidth={1.6} />
        </View>
      )}
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-sm font-body-sb text-text" numberOfLines={1}>
            {club.name}
          </Text>
          {club.visibility === "private" && <Lock size={12} color={c.t3} strokeWidth={2} />}
        </View>
        {club.description && (
          <Text className="text-xs font-body text-t2 mt-0.5" numberOfLines={2}>
            {club.description}
          </Text>
        )}
        <View className="flex-row items-center gap-1 mt-1">
          <Users size={11} color={c.t3} strokeWidth={1.8} />
          <Text className="text-[11px] font-body text-t3">
            {club.members_count} {club.members_count === 1 ? "miembro" : "miembros"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
