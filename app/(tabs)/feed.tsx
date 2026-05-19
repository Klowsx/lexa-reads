import { PrimaryButton } from "@/src/features/auth/components";
import { useLogout } from "@/src/features/auth/hooks/useLogout";
import { useAuthStore } from "@/src/stores/auth.store";
import { Text, View } from "react-native";

export default function FeedScreen() {
  const { mutate: logout, isPending, error } = useLogout();
  return (
    <View className="flex-1 items-center justify-center bg-bg">
      <Text className="text-text font-sans-sb text-lg">Feed</Text>
      <PrimaryButton onPress={() => logout()}>Salir</PrimaryButton>
    </View>
  );
}
