import { MessageSquare } from "lucide-react-native";
import { Text, View } from "react-native";
import { rawDark, rawLight } from "~/theme/colors";
import { useColorScheme } from "react-native";

export function BookReviewsTab() {
  const scheme = useColorScheme();
  const raw = scheme === "dark" ? rawDark : rawLight;

  return (
    <View style={{ alignItems: "center", paddingTop: 56, paddingHorizontal: 32 }}>
      <MessageSquare size={32} color={raw.t3} strokeWidth={1.2} />
      <Text
        style={{
          fontFamily: "DMSans_500Medium",
          fontSize: 15,
          color: raw.t2,
          marginTop: 16,
          textAlign: "center",
        }}
      >
        Reseñas próximamente
      </Text>
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 13,
          color: raw.t3,
          marginTop: 6,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Las reseñas de la comunidad se mostrarán aquí.
      </Text>
    </View>
  );
}
