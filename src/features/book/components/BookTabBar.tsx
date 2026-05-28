import { Pressable, Text, View } from "react-native";
import { fixed, rawDark, rawLight } from "~/theme/colors";
import { useColorScheme } from "react-native";

const TABS = ["Resumen", "Reseñas", "Comunidad", "Similares"] as const;
export type BookTab = 0 | 1 | 2 | 3;

interface BookTabBarProps {
  activeTab: BookTab;
  onChange: (tab: BookTab) => void;
}

export function BookTabBar({ activeTab, onChange }: BookTabBarProps) {
  const scheme = useColorScheme();
  const raw = scheme === "dark" ? rawDark : rawLight;

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: raw.bg,
        borderBottomWidth: 1,
        borderBottomColor: raw.border,
      }}
    >
      {TABS.map((label, i) => {
        const active = activeTab === i;
        return (
          <Pressable
            key={label}
            onPress={() => onChange(i as BookTab)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 11,
              borderBottomWidth: 2.5,
              borderBottomColor: active ? fixed.accent : "transparent",
            }}
          >
            <Text
              style={{
                fontFamily: active ? "DMSans_600SemiBold" : "DMSans_400Regular",
                fontSize: 12,
                color: active ? raw.text : raw.t3,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
