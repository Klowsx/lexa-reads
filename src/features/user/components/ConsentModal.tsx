import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bell, Mail } from 'lucide-react-native'
import {
  useNotificationPreferences,
  useUpsertNotificationPreferences
} from '~/features/user/hooks/useNotificationPreferences'
import { useColors } from '~/theme/colors'

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`
}

function Toggle({
  on,
  onChange
}: {
  on: boolean
  onChange: (v: boolean) => void
}) {
  const c = useColors()
  return (
    <Pressable
      onPress={() => onChange(!on)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        backgroundColor: on ? c.accent : c.sh,
        justifyContent: 'center',
        padding: 3
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#fff',
          transform: [{ translateX: on ? 18 : 0 }]
        }}
      />
    </Pressable>
  )
}

export function ConsentModal() {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const { t } = useTranslation()
  const { data: prefs } = useNotificationPreferences()
  const upsert = useUpsertNotificationPreferences()

  const [pushOn, setPushOn] = useState(true)
  const [emailOn, setEmailOn] = useState(false)

  // Solo mostrar si el registro de preferencias existe y no se ha dado consentimiento
  if (!prefs || prefs.consent_given_at !== null) return null

  function handleSave() {
    upsert.mutate({
      push_new_follower: pushOn,
      push_activity_like: pushOn,
      push_review_like: pushOn,
      push_comment: pushOn,
      push_recommendation: pushOn,
      email_weekly_digest: emailOn,
      markConsent: true
    })
  }

  return (
    <Modal transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 justify-end bg-black/60">
        <View
          className="bg-surface rounded-t-xl border-t border-border"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {/* Handle */}
          <View className="items-center pt-3 pb-1">
            <View className="w-9 h-1 rounded-full bg-border" />
          </View>

          <View className="px-5 pt-3 pb-5">
            <Text className="font-display-sb text-lg text-text tracking-tight mb-1">
              {t('consent.title')}
            </Text>
            <Text className="text-xs font-body text-t2 leading-[20px] mb-6">
              {t('consent.body')}
            </Text>

            {/* Push */}
            <View className="flex-row items-center gap-3 py-3.5 border-b border-border">
              <View
                className="w-9 h-9 rounded-md items-center justify-center"
                style={{ backgroundColor: alpha(c.accent, 0.12) }}
              >
                <Bell size={18} color={c.accent} strokeWidth={1.8} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-body-sb text-text">
                  {t('consent.pushTitle')}
                </Text>
                <Text className="text-xs font-body text-t3 mt-0.5">
                  {t('consent.pushBody')}
                </Text>
              </View>
              <Toggle on={pushOn} onChange={setPushOn} />
            </View>

            {/* Email */}
            <View className="flex-row items-center gap-3 py-3.5">
              <View
                className="w-9 h-9 rounded-md items-center justify-center"
                style={{ backgroundColor: alpha(c.accent, 0.12) }}
              >
                <Mail size={18} color={c.accent} strokeWidth={1.8} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-body-sb text-text">
                  {t('consent.emailTitle')}
                </Text>
                <Text className="text-xs font-body text-t3 mt-0.5">
                  {t('consent.emailBody')}
                </Text>
              </View>
              <Toggle on={emailOn} onChange={setEmailOn} />
            </View>

            <Pressable
              onPress={handleSave}
              disabled={upsert.isPending}
              className="mt-5 py-3.5 rounded-md items-center bg-accent"
            >
              {upsert.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-xs font-body-sb text-white">
                  {t('consent.continue')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
