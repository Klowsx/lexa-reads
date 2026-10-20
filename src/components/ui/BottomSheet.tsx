import type { ReactNode } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react-native'
import { alpha, rawDark, useColors } from '~/theme/colors'

// Unifica las hojas de la aplicación y mantiene su contenido accesible en pantallas pequeñas.
export function BottomSheet({
  title,
  onClose,
  children
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end" style={{ paddingTop: insets.top }}>
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={onClose}
          className="absolute inset-0"
          style={{ backgroundColor: alpha(rawDark.bg, 0.72) }}
        />
        <View
          accessibilityViewIsModal
          className="w-full max-w-2xl self-center rounded-t-lg bg-surface"
          style={{ maxHeight: '90%', paddingBottom: insets.bottom }}
        >
          <View className="flex-row items-center gap-3 px-container pb-2 pt-3">
            <Text
              accessibilityRole="header"
              className="flex-1 font-display-sb text-lg text-text"
            >
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={onClose}
              className="h-12 w-12 items-center justify-center rounded-md active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X size={22} color={c.text} />
            </Pressable>
          </View>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="gap-5 px-container pb-6">{children}</View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
