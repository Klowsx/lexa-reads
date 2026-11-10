import type { ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react-native'
import { useStitchTheme } from '~/theme/stitch'

// Comparte áreas seguras, teclado y cierre protegido entre las hojas nuevas de Stitch.
export function StitchSheet({
  title,
  onClose,
  busy = false,
  children
}: {
  title: string
  onClose: () => void
  busy?: boolean
  children: ReactNode
}) {
  const c = useStitchTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  // Una operación en curso mantiene montado su formulario hasta recibir el resultado.
  function close() {
    if (!busy) onClose()
  }

  return (
    <Modal
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', paddingTop: insets.top }}
      >
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={close}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}
        />
        <View
          accessibilityViewIsModal
          style={{
            maxHeight: '90%',
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
                lineHeight: 32,
                color: c.text
              }}
            >
              {title}
            </Text>
            <Pressable
              onPress={close}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              accessibilityState={{ disabled: busy }}
              className="focus-visible:outline focus-visible:outline-2"
              style={{
                minHeight: 48,
                minWidth: 48,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: busy ? 0.4 : 1
              }}
            >
              <X size={24} color={c.text} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, gap: 16 }}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
