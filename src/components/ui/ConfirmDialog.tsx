import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from './BottomSheet'
import { useColors } from '~/theme/colors'

// Confirma operaciones destructivas en móvil y web y conserva el error para poder reintentarlas.
export function ConfirmDialog({
  title,
  description,
  pending,
  error,
  confirmLabel,
  onConfirm,
  onClose
}: {
  title: string
  description: string
  pending: boolean
  error?: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const c = useColors()
  return (
    <BottomSheet
      title={title}
      onClose={() => {
        if (!pending) onClose()
      }}
    >
      <Text className="font-body text-xs text-t2">{description}</Text>
      {error && (
        <Text accessibilityRole="alert" className="font-body text-xs text-text">
          {error}
        </Text>
      )}
      <View className="gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: pending }}
          disabled={pending}
          onPress={onConfirm}
          className="min-h-12 flex-row items-center justify-center gap-2 rounded-md border border-border bg-sr px-4 py-3 active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {pending && <ActivityIndicator color={c.text} />}
          <Text className="font-body-sb text-xs text-text">
            {confirmLabel ?? t('common.delete')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: pending }}
          disabled={pending}
          onPress={onClose}
          className="min-h-12 items-center justify-center rounded-md px-4 py-3 active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Text className="font-body-sb text-xs text-text">
            {t('common.cancel')}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  )
}
