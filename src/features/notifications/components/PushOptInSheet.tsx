import { useRef } from 'react'
import { Bell } from 'lucide-react-native'
import { Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { StitchSheet } from '~/components/ui/StitchSheet'
import { StitchButton } from '~/components/ui/StitchButton'
import { useStitchTheme } from '~/theme/stitch'
import { usePushOptIn } from '../hooks/usePushOptIn'

// Explica el permiso contextual y distingue la preferencia guardada del permiso concedido por el sistema.
export function PushOptInSheet({ onClose }: { onClose: () => void }) {
  const c = useStitchTheme()
  const { t } = useTranslation()
  const mutation = usePushOptIn()
  const running = useRef(false)

  // Conserva la hoja en caso de error y no anuncia una activación si el permiso fue rechazado.
  function submit(enable: boolean) {
    if (running.current || mutation.isPending) return
    running.current = true
    mutation.mutate(enable, {
      onSuccess: (result) => {
        if (!enable || result.enabled) onClose()
      },
      onSettled: () => {
        running.current = false
      }
    })
  }

  // Un cierre equivale a «Ahora no» y persiste la decisión para no repetir el aviso.
  function dismiss() {
    if (mutation.isPending) return
    if (mutation.data && !mutation.data.enabled) onClose()
    else submit(false)
  }

  const declined = mutation.data && !mutation.data.enabled
  return (
    <StitchSheet
      title={t('notifications.pushTitle')}
      onClose={dismiss}
      busy={mutation.isPending}
    >
      <Bell size={32} color={c.text} accessible={false} />
      <Text
        style={{
          fontFamily: c.body,
          fontSize: 16,
          lineHeight: 24,
          color: c.secondary
        }}
      >
        {t('notifications.pushBody')}
      </Text>
      <Text
        style={{
          fontFamily: c.body,
          fontSize: 16,
          lineHeight: 24,
          color: c.secondary
        }}
      >
        {t('pushPermission.systemHint')}
      </Text>
      {mutation.isError && (
        <Text
          accessibilityRole="alert"
          style={{
            fontFamily: c.body,
            fontSize: 16,
            lineHeight: 24,
            color: c.error
          }}
        >
          {t('pushPermission.error')}
        </Text>
      )}
      {declined ? (
        <>
          <Text
            accessibilityRole="alert"
            style={{
              fontFamily: c.body,
              fontSize: 16,
              lineHeight: 24,
              color: c.text
            }}
          >
            {t('pushPermission.declined')}
          </Text>
          <StitchButton label={t('common.close')} onPress={onClose} />
        </>
      ) : (
        <>
          <StitchButton
            label={t('notifications.pushEnable')}
            onPress={() => submit(true)}
            loading={mutation.isPending}
          />
          <StitchButton
            label={t('notifications.pushNotNow')}
            onPress={dismiss}
            secondary
            disabled={mutation.isPending}
          />
        </>
      )}
    </StitchSheet>
  )
}
