import { useRouter } from 'expo-router';
import { ChevronLeft, Monitor, Moon, Sun } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsItem } from '~/features/user/components/SettingsItem';
import { SettingsSection } from '~/features/user/components/SettingsSection';
import { SettingsToggle } from '~/features/user/components/SettingsToggle';
import { useReadingGoal } from '~/features/user/hooks/useReadingGoal';
import { useUpdateReadingGoal } from '~/features/user/hooks/useUpdateReadingGoal';
import { type ThemeMode, useThemeStore } from '~/stores/theme.store';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const THEME_OPTIONS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: 'light',  label: 'Claro',   Icon: Sun },
  { mode: 'system', label: 'Sistema', Icon: Monitor },
  { mode: 'dark',   label: 'Oscuro',  Icon: Moon },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useColors();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const { data: goalData } = useReadingGoal();
  const updateGoal = useUpdateReadingGoal();
  const [goalVal, setGoalVal]         = useState<number | null>(null);
  const [showGoal, setShowGoal]       = useState(false);

  const currentGoal = goalVal ?? goalData?.goal ?? 12;
  const goalYear = goalData?.goalYear ?? new Date().getFullYear();
  const [pushOn, setPushOn]           = useState(true);
  const [followersOn, setFollowersOn] = useState(true);
  const [likesOn, setLikesOn]         = useState(false);
  const [privateOn, setPrivateOn]     = useState(false);
  const [showDelete, setShowDelete]   = useState(false);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 flex-row items-center gap-2 border-b border-border">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight">Ajustes</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ── Cuenta ── */}
        <SettingsSection title="Cuenta">
          <SettingsItem
            label="Editar perfil"
            subtitle="Nombre, bio, géneros favoritos"
            onPress={() => {}}
          />
          <SettingsItem
            label="Meta de lectura"
            subtitle={`${currentGoal} libros en ${goalYear}`}
            onPress={() => {
              setGoalVal(goalData?.goal ?? 12);
              setShowGoal(s => !s);
            }}
            separator={!showGoal}
          />
          {showGoal && (
            <View className="p-4 bg-sr border-b border-border">
              <Text className="text-xs font-body text-t2 text-center mb-3.5">
                Libros a leer en {goalYear}
              </Text>
              <View className="flex-row items-center justify-center gap-4.5 mb-3.5">
                <Pressable
                  onPress={() => setGoalVal(g => Math.max(1, (g ?? currentGoal) - 5))}
                  className="rounded-full bg-sh border border-border items-center justify-center"
                  style={{ width: 38, height: 38 }}
                >
                  <Text className="text-lg font-body text-text">−</Text>
                </Pressable>
                <Text
                  className="font-display-sb text-accent text-center"
                  style={{ fontSize: 42, minWidth: 70, lineHeight: 44 }}
                >
                  {currentGoal}
                </Text>
                <Pressable
                  onPress={() => setGoalVal(g => Math.min(365, (g ?? currentGoal) + 5))}
                  className="rounded-full bg-sh border border-border items-center justify-center"
                  style={{ width: 38, height: 38 }}
                >
                  <Text className="text-lg font-body text-text">+</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => {
                  updateGoal.mutate(currentGoal, { onSuccess: () => setShowGoal(false) });
                }}
                disabled={updateGoal.isPending}
                className="py-2.5 rounded-md items-center"
                style={{ backgroundColor: c.accent }}
              >
                {updateGoal.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text className="text-xs font-body-sb" style={{ color: '#fff' }}>Guardar</Text>
                }
              </Pressable>
            </View>
          )}
          <SettingsItem label="Cambiar contraseña" onPress={() => {}} separator={false} />
        </SettingsSection>

        {/* ── Apariencia ── */}
        <SettingsSection title="Apariencia">
          <View className="p-3">
            <Text className="text-sm font-body-md text-text mb-2.5">Tema</Text>
            <View className="flex-row rounded-sm bg-sh p-1">
              {THEME_OPTIONS.map(({ mode: m, label, Icon }) => {
                const active = mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-sm"
                    style={{ backgroundColor: active ? c.accent : 'transparent' }}
                  >
                    <Icon size={14} color={active ? '#fff' : c.t3} strokeWidth={1.8} />
                    <Text
                      className="text-xs font-body-sb"
                      style={{ color: active ? '#fff' : c.t3 }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </SettingsSection>

        {/* ── Notificaciones ── */}
        <SettingsSection title="Notificaciones">
          <SettingsItem
            label="Notificaciones push"
            trailing={<SettingsToggle on={pushOn} onChange={setPushOn} />}
          />
          <SettingsItem
            label="Nuevos seguidores"
            subtitle={!pushOn ? 'Activa las notificaciones push primero' : undefined}
            trailing={
              <SettingsToggle
                on={followersOn && pushOn}
                onChange={v => pushOn && setFollowersOn(v)}
                disabled={!pushOn}
              />
            }
          />
          <SettingsItem
            label="Me gusta y comentarios"
            subtitle={!pushOn ? 'Activa las notificaciones push primero' : undefined}
            trailing={
              <SettingsToggle
                on={likesOn && pushOn}
                onChange={v => pushOn && setLikesOn(v)}
                disabled={!pushOn}
              />
            }
            separator={false}
          />
        </SettingsSection>

        {/* ── Privacidad ── */}
        <SettingsSection title="Privacidad">
          <SettingsItem
            label="Cuenta privada"
            subtitle={
              privateOn
                ? 'Solo seguidores aprobados ven tu perfil'
                : 'Tu perfil es visible para todos'
            }
            trailing={<SettingsToggle on={privateOn} onChange={setPrivateOn} />}
          />
          <SettingsItem label="Usuarios bloqueados" subtitle="0 usuarios" onPress={() => router.push('/blocked-users' as any)} />
          <SettingsItem label="Exportar mis datos" onPress={() => {}} />
          <SettingsItem
            label="Eliminar cuenta"
            danger
            onPress={() => setShowDelete(s => !s)}
            separator={false}
          />
        </SettingsSection>

        {showDelete && (
          <View
            className="mx-4 mt-2.5 p-3.5 rounded-md border"
            style={{
              backgroundColor: alpha(c.error, 0.07),
              borderColor: alpha(c.error, 0.22),
            }}
          >
            <Text className="text-xs font-body-sb mb-1.5" style={{ color: c.error }}>
              ¿Eliminar tu cuenta?
            </Text>
            <Text className="text-xs font-body text-t2 mb-3">
              Tu cuenta y datos se eliminarán permanentemente después de 30 días. Puedes cancelar antes iniciando sesión de nuevo.
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowDelete(false)}
                className="flex-1 py-2.5 rounded-md bg-sh border border-border items-center"
              >
                <Text className="text-xs font-body-md text-text">Cancelar</Text>
              </Pressable>
              <Pressable
                className="flex-1 py-2.5 rounded-md items-center border"
                style={{
                  backgroundColor: alpha(c.error, 0.12),
                  borderColor: alpha(c.error, 0.32),
                }}
              >
                <Text className="text-xs font-body-sb" style={{ color: c.error }}>
                  Solicitar eliminación
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Legal ── */}
        <SettingsSection title="Legal">
          <SettingsItem label="Política de privacidad" onPress={() => {}} />
          <SettingsItem label="Términos de servicio" onPress={() => {}} />
          <SettingsItem label="Licencias open source" onPress={() => {}} separator={false} />
        </SettingsSection>

        {/* ── Sesión ── */}
        <SettingsSection title="Sesión">
          <SettingsItem label="Cerrar sesión" onPress={() => {}} separator={false} />
        </SettingsSection>

        <Text className="text-xs font-body text-t3 text-center pt-7">lexa · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}
