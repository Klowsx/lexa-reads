import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SettingsItem } from '~/features/user/components/SettingsItem'
import { SettingsSection } from '~/features/user/components/SettingsSection'
import { SettingsToggle } from '~/features/user/components/SettingsToggle'
import {
  useNotificationPreferences,
  useUpsertNotificationPreferences
} from '~/features/user/hooks/useNotificationPreferences'
import { usePushOptIn } from '~/features/notifications/hooks/usePushOptIn'
import { PushOptInSheet } from '~/features/notifications/components/PushOptInSheet'
import { StitchFeedback } from '~/components/ui/StitchFeedback'
import { StitchLoading } from '~/components/ui/StitchLoading'
import { useColors } from '~/theme/colors'

// Mantiene los ajustes existentes y recupera los errores sin solicitar permisos de forma implícita.
export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const c = useColors()
  const { t } = useTranslation()
  const preferences = useNotificationPreferences()
  const prefs = preferences.data
  const upsert = useUpsertNotificationPreferences()
  const pushOptIn = usePushOptIn()
  const [showPushOptIn, setShowPushOptIn] = useState(false)
  const writing = useRef(false)
  const busy =
    upsert.isPending ||
    pushOptIn.isPending ||
    preferences.isFetching ||
    showPushOptIn

  const pushToken = prefs?.push_token
  const pushEnabled = !!pushToken && pushToken !== 'declined'

  // Activar abre la explicación; desactivar solo persiste la preferencia, sin pedir otro permiso.
  function handleTogglePush(enabled: boolean) {
    if (busy || writing.current) return
    if (enabled) {
      setShowPushOptIn(true)
    } else {
      writing.current = true
      pushOptIn.mutate(false, {
        onSettled: () => {
          writing.current = false
        }
      })
    }
  }

  // Cambia una sola categoría y bloquea dobles pulsaciones hasta terminar su escritura.
  function toggle(
    field:
      | 'push_new_follower'
      | 'push_activity_like'
      | 'push_review_like'
      | 'push_comment'
      | 'push_recommendation'
      | 'email_weekly_digest',
    value: boolean
  ) {
    if (busy || writing.current) return
    writing.current = true
    upsert.mutate(
      { [field]: value },
      {
        onSettled: () => {
          writing.current = false
        }
      }
    )
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 flex-row items-center gap-2 border-b border-border">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-12 w-12 items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight">
          {t('settings.notifications')}
        </Text>
      </View>

      {preferences.isPending ? (
        <StitchLoading />
      ) : preferences.isError && !prefs ? (
        <StitchFeedback
          kind="error"
          title={t('common.error')}
          message={t('communityStates.retryHint')}
          action={{
            label: t('common.retry'),
            onPress: () => {
              void preferences.refetch()
            }
          }}
          busy={preferences.isFetching}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
        >
          {preferences.isError && (
            <StitchFeedback
              kind="error"
              title={t('communityStates.refreshError')}
              message={t('communityStates.cachedHint')}
              action={{
                label: t('common.retry'),
                onPress: () => {
                  void preferences.refetch()
                }
              }}
              busy={preferences.isFetching}
            />
          )}
          {prefs === null && (
            <StitchFeedback
              title={t('notifSettings.noPreferencesTitle')}
              message={t('notifSettings.noPreferencesHint')}
            />
          )}
          {(upsert.isError || pushOptIn.isError) && (
            <StitchFeedback
              kind="error"
              title={t('common.error')}
              message={t('consent.saveError')}
            />
          )}
          <SettingsSection title={t('notifSettings.push')}>
            <SettingsItem
              label={t('notifSettings.pushNotifications')}
              subtitle={
                pushEnabled ? t('notifSettings.on') : t('notifSettings.off')
              }
              trailing={
                <SettingsToggle
                  label={t('notifSettings.pushNotifications')}
                  on={pushEnabled}
                  onChange={handleTogglePush}
                  disabled={busy}
                />
              }
            />
            <SettingsItem
              label={t('notifSettings.newFollowers')}
              trailing={
                <SettingsToggle
                  label={t('notifSettings.newFollowers')}
                  on={(prefs?.push_new_follower ?? true) && pushEnabled}
                  onChange={(v) => toggle('push_new_follower', v)}
                  disabled={!pushEnabled || busy}
                />
              }
            />
            <SettingsItem
              label={t('notifSettings.likesOnPosts')}
              trailing={
                <SettingsToggle
                  label={t('notifSettings.likesOnPosts')}
                  on={(prefs?.push_activity_like ?? true) && pushEnabled}
                  onChange={(v) => toggle('push_activity_like', v)}
                  disabled={!pushEnabled || busy}
                />
              }
            />
            <SettingsItem
              label={t('notifSettings.likesOnReviews')}
              trailing={
                <SettingsToggle
                  label={t('notifSettings.likesOnReviews')}
                  on={(prefs?.push_review_like ?? true) && pushEnabled}
                  onChange={(v) => toggle('push_review_like', v)}
                  disabled={!pushEnabled || busy}
                />
              }
            />
            <SettingsItem
              label={t('notifSettings.comments')}
              trailing={
                <SettingsToggle
                  label={t('notifSettings.comments')}
                  on={(prefs?.push_comment ?? true) && pushEnabled}
                  onChange={(v) => toggle('push_comment', v)}
                  disabled={!pushEnabled || busy}
                />
              }
            />
            <SettingsItem
              label={t('notifSettings.recommendations')}
              trailing={
                <SettingsToggle
                  label={t('notifSettings.recommendations')}
                  on={(prefs?.push_recommendation ?? true) && pushEnabled}
                  onChange={(v) => toggle('push_recommendation', v)}
                  disabled={!pushEnabled || busy}
                />
              }
              separator={false}
            />
          </SettingsSection>

          <SettingsSection title={t('notifSettings.email')}>
            <SettingsItem
              label={t('notifSettings.weeklyDigest')}
              subtitle={t('notifSettings.weeklyDigestSub')}
              trailing={
                <SettingsToggle
                  label={t('notifSettings.weeklyDigest')}
                  on={prefs?.email_weekly_digest ?? false}
                  onChange={(v) => toggle('email_weekly_digest', v)}
                  disabled={busy}
                />
              }
              separator={false}
            />
          </SettingsSection>
        </ScrollView>
      )}
      {showPushOptIn && (
        <PushOptInSheet onClose={() => setShowPushOptIn(false)} />
      )}
    </View>
  )
}
