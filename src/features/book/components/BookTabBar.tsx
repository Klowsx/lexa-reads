import { Pressable, Text, View } from "react-native";
import { fixed, useColors } from "~/theme/colors";

const TABS = ["Resumen", "Reseñas", "Comunidad", "Similares"] as const;
export type BookTab = 0 | 1 | 2 | 3;

interface BookTabBarProps {
  activeTab: BookTab;
  onChange: (tab: BookTab) => void;
}

export function BookTabBar({ activeTab, onChange }: BookTabBarProps) {
  const c = useColors();

  return (
    <View className="flex-row bg-bg border-b border-border">
      {TABS.map((label, i) => {
        const active = activeTab === i;
        return (
          <Pressable
            key={label}
            onPress={() => onChange(i as BookTab)}
            className="flex-1 items-center py-[11px]"
            style={{
              borderBottomWidth: 2.5,
              borderBottomColor: active ? fixed.accent : "transparent",
            }}
          >
            <Text
              className={active ? "font-body-sb text-xs text-text" : "font-body text-xs text-t3"}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
