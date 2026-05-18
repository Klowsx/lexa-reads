import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-bg gap-4">
      <Text className="text-text font-sans-sb text-lg">Página no encontrada</Text>
      <Link href="/(tabs)/feed">
        <Text className="text-accent font-sans text-base">Ir al feed</Text>
      </Link>
    </View>
  );
}
