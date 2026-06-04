import { useRouter } from 'expo-router';
import { ChevronLeft, Monitor, Moon, Sun } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsItem } from '~/features/user/components/SettingsItem';
import { SettingsSection } from '~/features/user/components/SettingsSection';
import { SettingsToggle } from '~/features/user/components/SettingsToggle';
import { useAccountDeletion } from '~/features/user/hooks/useAccountDeletion';
import { useBlockedUsers } from '~/features/user/hooks/useBlockedUsers';
import { useMe } from '~/features/user/hooks/useMe';
import { useReadingGoal } from '~/features/user/hooks/useReadingGoal';
import { useUpdateProfile } from '~/features/user/hooks/useUpdateProfile';
import { useUpdateReadingGoal } from '~/features/user/hooks/useUpdateReadingGoal';
import { useLogout } from '~/features/auth/hooks/useLogout';
import { type ThemeMode, useThemeStore } from '~/stores/theme.store';
import { useUIStore } from '~/stores/ui.store';
import { cn } from '~/lib/utils';
import { useColors } from '~/theme/colors';
import { supabase } from '~/lib/supabase';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

// URLs de documentos legales — fuente en public/legal/, publicar en el dominio.
const PRIVACY_URL   = 'https://lexareads.app/privacy';
const TERMS_URL     = 'https://lexareads.app/terms';
const EULA_URL      = 'https://lexareads.app/eula';
const COMMUNITY_URL = 'https://lexareads.app/community';
const OSS_URL       = 'https://lexareads.app/licenses';

const THEME_OPTIONS: { mode: ThemeMode; labelKey: string; Icon: typeof Sun }[] = [
  { mode: 'light',  labelKey: 'settings.themeLight',  Icon: Sun },
  { mode: 'system', labelKey: 'settings.themeSystem', Icon: Monitor },
  { mode: 'dark',   labelKey: 'settings.themeDark',   Icon: Moon },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useColors();
  const { t } = useTranslation();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const addToast = useUIStore((s) => s.addToast);

  const { data: me } = useMe();
  const { data: goalData } = useReadingGoal();
  const updateGoal = useUpdateReadingGoal();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const [goalVal, setGoalVal]         = useState<number | null>(null);
  const [showGoal, setShowGoal]       = useState(false);

  const currentGoal = goalVal ?? goalData?.goal ?? 12;
  const goalYear = goalData?.goalYear ?? new Date().getFullYear();
  const privateOn = me?.is_private ?? false;
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
        title: t('settings.exportTitle'),
      });
    } catch {
      addToast(t('settings.exportError'), 'error');
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
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight">{t('settings.title')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ── Cuenta ── */}
        <SettingsSection title={t('settings.account')}>
          <SettingsItem
            label={t('settings.editProfile')}
            subtitle={t('settings.editProfileSub')}
            onPress={() => router.push('/edit-profile' as any)}
          />
          <SettingsItem
            label={t('settings.readingGoal')}
            subtitle={t('settings.readingGoalSub', { count: currentGoal, year: goalYear })}
            onPress={() => {
              setGoalVal(goalData?.goal ?? 12);
              setShowGoal(s => !s);
            }}
            separator={!showGoal}
          />
          {showGoal && (
            <View className="p-4 bg-sr border-b border-border">
              <Text className="text-xs font-body text-t2 text-center mb-3.5">
                {t('settings.booksToReadIn', { year: goalYear })}
              </Text>
              <View className="flex-row items-center justify-center gap-4.5 mb-3.5">
                <Pressable
                  onPress={() => setGoalVal(g => Math.max(1, (g ?? currentGoal) - 5))}
                  accessibilityRole="button"
                  accessibilityLabel={t('settings.reduceGoal')}
                  className="rounded-full bg-sh border border-border items-center justify-center w-[38px] h-[38px]"
                >
                  <Text className="text-lg font-body text-text">−</Text>
                </Pressable>
                <Text
                  className="font-display-sb text-accent text-center text-[42px] min-w-[70px] leading-[44px]"
                >
                  {currentGoal}
                </Text>
                <Pressable
                  onPress={() => setGoalVal(g => Math.min(365, (g ?? currentGoal) + 5))}
                  accessibilityRole="button"
                  accessibilityLabel={t('settings.increaseGoal')}
                  className="rounded-full bg-sh border border-border items-center justify-center w-[38px] h-[38px]"
                >
                  <Text className="text-lg font-body text-text">+</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => {
                  updateGoal.mutate(currentGoal, { onSuccess: () => setShowGoal(false) });
                }}
                disabled={updateGoal.isPending}
                className="py-2.5 rounded-md items-center bg-accent"
              >
                {updateGoal.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text className="text-xs font-body-sb text-white">{t('common.save')}</Text>
                }
              </Pressable>
            </View>
          )}
          <SettingsItem label={t('settings.changePassword')} onPress={() => router.push('/change-password' as any)} separator={false} />
        </SettingsSection>

        {/* ── Apariencia ── */}
        <SettingsSection title={t('settings.appearance')}>
          <View className="p-3">
            <Text className="text-sm font-body-md text-text mb-2.5">{t('settings.theme')}</Text>
            <View className="flex-row rounded-sm bg-sh p-1">
              {THEME_OPTIONS.map(({ mode: m, labelKey, Icon }) => {
                const active = mode === m;
                const label = t(labelKey);
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    accessibilityRole="button"
                    accessibilityLabel={t('settings.themeNamed', { name: label })}
                    accessibilityState={{ selected: active }}
                    className={cn("flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-sm", active ? "bg-accent" : "bg-transparent")}
                  >
                    <Icon size={14} color={active ? '#fff' : c.t3} strokeWidth={1.8} />
                    <Text
                      className={cn("text-xs font-body-sb", active ? "text-white" : "text-t3")}
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
        <SettingsSection title={t('settings.notifications')}>
          <SettingsItem
            label={t('settings.manageNotifications')}
            subtitle={t('settings.manageNotificationsSub')}
            onPress={() => router.push('/settings-notifications' as any)}
            separator={false}
          />
        </SettingsSection>

        {/* ── Privacidad ── */}
        <SettingsSection title={t('settings.privacy')}>
          <SettingsItem
            label={t('settings.privateAccount')}
            subtitle={
              privateOn
                ? t('settings.privateOn')
                : t('settings.privateOff')
            }
            trailing={
              <SettingsToggle
                on={privateOn}
                onChange={(val) => updateProfile.mutate({ is_private: val })}
                disabled={updateProfile.isPending || !me}
              />
            }
          />
          <SettingsItem
            label={t('settings.blockedUsers')}
            subtitle={
              blockedCount > 0
                ? t('settings.blockedCount', { count: blockedCount })
                : t('settings.noBlocked')
            }
            onPress={() => router.push('/blocked-users' as any)}
          />
          <SettingsItem
            label={t('settings.exportData')}
            subtitle={t('settings.exportDataSub')}
            onPress={handleExport}
            trailing={
              exportLoading
                ? <ActivityIndicator size="small" color={c.t3} />
                : undefined
            }
          />
          <SettingsItem
            label={t('settings.deleteAccount')}
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
                <Text className="text-xs font-body-sb text-error mb-1.5">
                  {t('settings.deletionScheduled')}
                </Text>
                <Text className="text-xs font-body text-t2 mb-3">
                  {t('settings.deletionScheduledBody', { date: scheduledDate })}
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => setShowDelete(false)}
                    className="flex-1 py-2.5 rounded-md bg-sh border border-border items-center"
                  >
                    <Text className="text-xs font-body-md text-text">{t('common.close')}</Text>
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
                      : <Text className="text-xs font-body-sb text-error">
                          {t('settings.cancelDeletion')}
                        </Text>
                    }
                  </Pressable>
                </View>
              </>
            ) : (
              /* Sin solicitud — mostrar confirmación */
              <>
                <Text className="text-xs font-body-sb text-error mb-1.5">
                  {t('settings.deleteConfirmTitle')}
                </Text>
                <Text className="text-xs font-body text-t2 mb-3">
                  {t('settings.deleteConfirmBody')}
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => setShowDelete(false)}
                    className="flex-1 py-2.5 rounded-md bg-sh border border-border items-center"
                  >
                    <Text className="text-xs font-body-md text-text">{t('common.cancel')}</Text>
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
                      : <Text className="text-xs font-body-sb text-error">
                          {t('settings.requestDeletion')}
                        </Text>
                    }
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Legal ── */}
        <SettingsSection title={t('settings.legal')}>
          <SettingsItem
            label={t('settings.privacyPolicy')}
            onPress={() => Linking.openURL(PRIVACY_URL)}
          />
          <SettingsItem
            label={t('settings.termsOfService')}
            onPress={() => Linking.openURL(TERMS_URL)}
          />
          <SettingsItem
            label={t('settings.eula')}
            onPress={() => Linking.openURL(EULA_URL)}
          />
          <SettingsItem
            label={t('settings.communityGuidelines')}
            onPress={() => Linking.openURL(COMMUNITY_URL)}
          />
          <SettingsItem
            label={t('settings.ossLicenses')}
            onPress={() => Linking.openURL(OSS_URL)}
            separator={false}
          />
        </SettingsSection>

        {/* ── Sesión ── */}
        <SettingsSection title={t('settings.session')}>
          <SettingsItem
            label={t('settings.logout')}
            onPress={() => logout.mutate()}
            separator={false}
          />
        </SettingsSection>

        <Text className="text-xs font-body text-t3 text-center pt-7">lexa · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}
