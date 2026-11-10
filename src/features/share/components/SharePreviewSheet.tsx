import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native'
import { Share2, X } from 'lucide-react-native'
import ViewShot from 'react-native-view-shot'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useShareCard } from '../hooks/useShareCard'
import { useStitchTheme } from '~/theme/stitch'

// Previsualiza la pieza exacta antes de exportarla; los errores permiten reintentar sin cerrar.
export function SharePreviewSheet({
  children,
  onClose,
  containsSpoilers = false
}: {
  children: ReactNode
  onClose: () => void
  containsSpoilers?: boolean
}) {
  const c = useStitchTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { ref, capture, isSharing } = useShareCard()
  const [error, setError] = useState(false)

  // Mantiene el error junto a la acción y conserva la tarjeta para volver a compartirla.
  async function share() {
    setError(false)
    await capture().catch(() => setError(true))
  }

  return (
    <Modal
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{ flex: 1, justifyContent: 'flex-end', paddingTop: insets.top }}
      >
        <Pressable
          accessible={false}
          onPress={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}
        />
        <View
          accessibilityViewIsModal
          style={{
            maxHeight: '95%',
            width: '100%',
            maxWidth: 640,
            alignSelf: 'center',
            backgroundColor: c.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: insets.bottom
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingTop: 12
            }}
          >
            <Text
              accessibilityRole="header"
              style={{
                flex: 1,
                fontFamily: c.heading,
                fontSize: 26,
                color: c.text
              }}
            >
              {t('sharePreview.title')}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              style={{
                minHeight: 48,
                minWidth: 48,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={24} color={c.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
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
              <ViewShot ref={ref}>{children}</ViewShot>
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
            <Pressable
              disabled={isSharing}
              onPress={share}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSharing, busy: isSharing }}
              style={{
                minHeight: 48,
                borderRadius: 12,
                backgroundColor: c.primary,
                flexDirection: 'row',
                gap: 10,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isSharing ? 0.6 : 1
              }}
            >
              {isSharing ? (
                <ActivityIndicator color={c.onPrimary} />
              ) : (
                <Share2 size={20} color={c.onPrimary} />
              )}
              <Text
                style={{
                  fontFamily: c.label,
                  fontSize: 16,
                  color: c.onPrimary
                }}
              >
                {t(isSharing ? 'sharePreview.sharing' : 'common.share')}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
