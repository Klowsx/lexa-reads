import { useRouter } from 'expo-router';
import { ChevronLeft, Monitor, Moon, Sun } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '~/theme/colors';
import { type ThemeMode, useThemeStore } from '~/stores/theme.store';

const OPTIONS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: 'light',  label: 'Claro',    Icon: Sun },
  { mode: 'system', label: 'Sistema',  Icon: Monitor },
  { mode: 'dark',   label: 'Oscuro',   Icon: Moon },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useColors();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-2.5 flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight">
          Configuración
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Sección: Apariencia */}
        <View className="mt-4">
          <Text
            className="text-xs text-t3 tracking-widest mb-2.5 px-4"
            style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
          >
            Apariencia
          </Text>

          <View className="mx-4 rounded-md border border-border bg-surface overflow-hidden">
            <View className="px-3.5 py-3 border-b border-border">
              <Text className="text-sm font-body-sb text-text">Tema</Text>
              <Text className="text-xs font-body text-t3 mt-0.5">
                Elige cómo se ve la app
              </Text>
            </View>

            {/* Switch tri-estado */}
            <View className="p-2">
              <View className="flex-row rounded-md bg-sh p-1">
                {OPTIONS.map(({ mode: m, label, Icon }) => {
                  const active = mode === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setMode(m)}
                      className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-sm"
                      style={{
                        backgroundColor: active ? c.accent : 'transparent',
                      }}
                    >
                      <Icon
                        size={14}
                        color={active ? '#FFFFFF' : c.t3}
                        strokeWidth={1.8}
                      />
                      <Text
                        className="text-xs font-body-sb"
                        style={{ color: active ? '#FFFFFF' : c.t3 }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
