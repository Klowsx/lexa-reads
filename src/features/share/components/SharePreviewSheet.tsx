import type { ReactNode } from 'react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text } from 'react-native'
import { Share2 } from 'lucide-react-native'
import ViewShot from 'react-native-view-shot'
import { StitchSheet } from '~/components/ui/StitchSheet'
import { StitchButton } from '~/components/ui/StitchButton'
import { useShareCard } from '../hooks/useShareCard'
import { useStitchTheme } from '~/theme/stitch'

// Previsualiza la pieza exacta antes de exportarla; mantiene la hoja montada mientras se comparte.
export function SharePreviewSheet({
  children,
  onClose,
  containsSpoilers = false
}: {
  children: ReactNode | ((onReady: (imageFailed: boolean) => void) => ReactNode)
  onClose: () => void
  containsSpoilers?: boolean
}) {
  const c = useStitchTheme()
  const { t } = useTranslation()
  const { ref, capture, isSharing } = useShareCard()
  const [error, setError] = useState(false)
  const [ready, setReady] = useState(typeof children !== 'function')
  const [imageFailed, setImageFailed] = useState(false)
  const exporting = useRef(false)

  // Espera a que la portada o su alternativa estén dibujadas, sin retrasos arbitrarios.
  const onReady = useCallback((failed: boolean) => {
    setImageFailed(failed)
    setReady(true)
  }, [])

  // Mantiene el error junto a la acción y conserva la tarjeta para volver a compartirla.
  async function share() {
    if (!ready || exporting.current) return
    exporting.current = true
    setError(false)
    await capture()
      .catch(() => setError(true))
      .finally(() => {
        exporting.current = false
      })
  }

  // Protege también el intervalo anterior al render que anuncia el procesamiento.
  function close() {
    if (!exporting.current) onClose()
  }

  return (
    <StitchSheet
      title={t('sharePreview.title')}
      onClose={close}
      busy={isSharing}
    >
      <Text
        style={{
          fontFamily: c.body,
          fontSize: 16,
          lineHeight: 24,
          color: c.secondary
        }}
      >
        {t('sharePreview.description')}
      </Text>
      <ScrollView
        horizontal
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <ViewShot ref={ref}>
          {typeof children === 'function' ? children(onReady) : children}
        </ViewShot>
      </ScrollView>
      {containsSpoilers && (
        <Text
          style={{
            fontFamily: c.body,
            fontSize: 16,
            lineHeight: 24,
            color: c.secondary
          }}
        >
          {t('sharePreview.spoilerHint')}
        </Text>
      )}
      {error && (
        <Text
          accessibilityRole="alert"
          style={{ fontFamily: c.body, fontSize: 16, color: c.error }}
        >
          {t('sharePreview.error')}
        </Text>
      )}
      {!ready && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ fontFamily: c.body, fontSize: 16, color: c.secondary }}
        >
          {t('sharePreview.loadingImage')}
        </Text>
      )}
      {imageFailed && (
        <Text
          accessibilityRole="alert"
          style={{ fontFamily: c.body, fontSize: 16, color: c.secondary }}
        >
          {t('sharePreview.imageFallback')}
        </Text>
      )}
      <StitchButton
        label={t(isSharing ? 'sharePreview.sharing' : 'common.share')}
        onPress={share}
        loading={isSharing}
        disabled={!ready}
        icon={<Share2 size={20} color={c.onPrimary} />}
      />
    </StitchSheet>
  )
}
