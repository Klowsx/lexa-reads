import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useUIStore } from '~/stores/ui.store'
import { useColors } from '~/theme/colors'

// Hace visibles los avisos globales y permite cerrarlos sin esperar al temporizador.
export function ToastViewport() {
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const c = useColors()
  const toasts = useUIStore((state) => state.toasts)
  const removeToast = useUIStore((state) => state.removeToast)

  if (toasts.length === 0) return null

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 items-center px-container"
      style={{ top: insets.top + 8, zIndex: 10 }}
    >
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'error'
            ? AlertCircle
            : toast.type === 'success'
              ? CheckCircle2
              : Info
        return (
          <View
            key={toast.id}
            accessibilityRole={toast.type === 'error' ? 'alert' : undefined}
            accessibilityLiveRegion={
              toast.type === 'error' ? 'assertive' : 'polite'
            }
            className="mb-2 min-h-14 w-full max-w-2xl flex-row items-center gap-3 rounded-md border border-border bg-surface px-3 py-2"
          >
            <Icon size={22} color={c.text} />
            <Text className="min-w-0 flex-1 font-body text-xs text-text">
              {toast.message}
            </Text>
            <Pressable
              onPress={() => removeToast(toast.id)}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              className="h-11 w-11 items-center justify-center rounded-md active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X size={19} color={c.text} />
            </Pressable>
          </View>
        )
      })}
    </View>
  )
}
