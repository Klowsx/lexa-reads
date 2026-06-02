import { useRouter } from 'expo-router';
import { ChevronLeft, Monitor, Moon, Sun } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsItem } from '~/features/user/components/SettingsItem';
import { SettingsSection } from '~/features/user/components/SettingsSection';
import { SettingsToggle } from '~/features/user/components/SettingsToggle';
import { useAccountDeletion } from '~/features/user/hooks/useAccountDeletion';
import { useBlockedUsers } from '~/features/user/hooks/useBlockedUsers';
import { useReadingGoal } from '~/features/user/hooks/useReadingGoal';
import { useUpdateReadingGoal } from '~/features/user/hooks/useUpdateReadingGoal';
import { useLogout } from '~/features/auth/hooks/useLogout';
import { type ThemeMode, useThemeStore } from '~/stores/theme.store';
import { useUIStore } from '~/stores/ui.store';
import { useColors } from '~/theme/colors';
import { supabase } from '~/lib/supabase';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

// URLs de documentos legales — actualizar cuando los docs estén publicados
const PRIVACY_URL = 'https://lexareads.app/privacy';
const TERMS_URL   = 'https://lexareads.app/terms';
const OSS_URL     = 'https://lexareads.app/licenses';

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
  const addToast = useUIStore((s) => s.addToast);

  const { data: goalData } = useReadingGoal();
  const updateGoal = useUpdateReadingGoal();
  const logout = useLogout();
  const [goalVal, setGoalVal]         = useState<number | null>(null);
  const [showGoal, setShowGoal]       = useState(false);

  const currentGoal = goalVal ?? goalData?.goal ?? 12;
  const goalYear = goalData?.goalYear ?? new Date().getFullYear();
  const [privateOn, setPrivateOn]     = useState(false);
  const [showDelete, setShowDelete]   = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const { data: blockedUsers = [] } = useBlockedUsers();
  const { request: deletionRequest, requestDeletion, cancelDeletion } = useAccountDeletion();

  async function handleExport() {
    setExportLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data');
      if (error) throw error;
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: 'Lexa — Mis datos',
      });
    } catch {
      addToast('No se pudieron exportar los datos. Intenta de nuevo.', 'error');
    } finally {
      setExportLoading(false);
    }
  }

  const blockedCount = blockedUsers.length;

  const scheduledDate = deletionRequest?.scheduled_delete_at
    ? new Date(deletionRequest.scheduled_delete_at).toLocaleDateString('es', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

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
            onPress={() => router.push('/edit-profile' as any)}
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
          <SettingsItem label="Cambiar contraseña" onPress={() => router.push('/change-password' as any)} separator={false} />
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
            label="Gestionar notificaciones"
            subtitle="Push, email y preferencias"
            onPress={() => router.push('/settings-notifications' as any)}
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
          <SettingsItem
            label="Usuarios bloqueados"
            subtitle={
              blockedCount > 0
                ? `${blockedCount} ${blockedCount === 1 ? 'usuario' : 'usuarios'}`
                : 'Sin usuarios bloqueados'
            }
            onPress={() => router.push('/blocked-users' as any)}
          />
          <SettingsItem
            label="Exportar mis datos"
            subtitle="Descarga tu biblioteca, reseñas y listas"
            onPress={handleExport}
            trailing={
              exportLoading
                ? <ActivityIndicator size="small" color={c.t3} />
                : undefined
            }
          />
          <SettingsItem
            label="Eliminar cuenta"
            danger
            onPress={() => setShowDelete(s => !s)}
            separator={false}
          />
        </SettingsSection>

        {/* Eliminación de cuenta */}
        {showDelete && (
          <View
            className="mx-4 mt-2.5 p-3.5 rounded-md border"
            style={{
              backgroundColor: alpha(c.error, 0.07),
              borderColor: alpha(c.error, 0.22),
            }}
          >
            {deletionRequest ? (
              /* Ya hay una solicitud pendiente */
              <>
                <Text className="text-xs font-body-sb mb-1.5" style={{ color: c.error }}>
                  Eliminación programada
                </Text>
                <Text className="text-xs font-body text-t2 mb-3">
                  Tu cuenta se eliminará el {scheduledDate}. Puedes cancelar antes de esa fecha.
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => setShowDelete(false)}
                    className="flex-1 py-2.5 rounded-md bg-sh border border-border items-center"
                  >
                    <Text className="text-xs font-body-md text-text">Cerrar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => cancelDeletion.mutate(deletionRequest.id, {
                      onSuccess: () => setShowDelete(false),
                    })}
                    disabled={cancelDeletion.isPending}
                    className="flex-1 py-2.5 rounded-md items-center border"
                    style={{
                      backgroundColor: alpha(c.error, 0.12),
                      borderColor: alpha(c.error, 0.32),
                    }}
                  >
                    {cancelDeletion.isPending
                      ? <ActivityIndicator size="small" color={c.error} />
                      : <Text className="text-xs font-body-sb" style={{ color: c.error }}>
                          Cancelar eliminación
                        </Text>
                    }
                  </Pressable>
                </View>
              </>
            ) : (
              /* Sin solicitud — mostrar confirmación */
              <>
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
                    onPress={() => requestDeletion.mutate()}
                    disabled={requestDeletion.isPending}
                    className="flex-1 py-2.5 rounded-md items-center border"
                    style={{
                      backgroundColor: alpha(c.error, 0.12),
                      borderColor: alpha(c.error, 0.32),
                    }}
                  >
                    {requestDeletion.isPending
                      ? <ActivityIndicator size="small" color={c.error} />
                      : <Text className="text-xs font-body-sb" style={{ color: c.error }}>
                          Solicitar eliminación
                        </Text>
                    }
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Legal ── */}
        <SettingsSection title="Legal">
          <SettingsItem
            label="Política de privacidad"
            onPress={() => Linking.openURL(PRIVACY_URL)}
          />
          <SettingsItem
            label="Términos de servicio"
            onPress={() => Linking.openURL(TERMS_URL)}
          />
          <SettingsItem
            label="Licencias open source"
            onPress={() => Linking.openURL(OSS_URL)}
            separator={false}
          />
        </SettingsSection>

        {/* ── Sesión ── */}
        <SettingsSection title="Sesión">
          <SettingsItem
            label="Cerrar sesión"
            onPress={() => logout.mutate()}
            separator={false}
          />
        </SettingsSection>

        <Text className="text-xs font-body text-t3 text-center pt-7">lexa · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}
