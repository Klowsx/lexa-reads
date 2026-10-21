import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRouter } from 'expo-router'
import { ChevronLeft, ScanLine } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isIsbn13, normalizeIsbn13 } from '../isbn'
import { useColors } from '~/theme/colors'

// Usa la cámara para reconocer un ISBN-13 y llevarlo directamente a la búsqueda.
export default function ScanIsbnScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const [permission, requestPermission] = useCameraPermissions()
  const [error, setError] = useState('')
  const [hasScanned, setHasScanned] = useState(false)

  // Pide permiso de cámara cuando el lector decide habilitar el escaneo.
  async function enableCamera() {
    await requestPermission()
  }

  // Valida el código leído y conserva la cámara activa si no corresponde a un ISBN-13.
  function handleBarcodeScanned({ data }: { data: string }) {
    const isbn = normalizeIsbn13(data)
    if (!isIsbn13(isbn)) {
      setError(t('scanIsbn.invalidCode'))
      return
    }

    setHasScanned(true)
    router.replace({ pathname: '/(tabs)/search', params: { query: isbn } })
  }

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-container">
        <Text className="font-body text-sm text-t2">
          {t('scanIsbn.loading')}
        </Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View
        className="flex-1 bg-bg px-container"
        style={{ paddingTop: insets.top + 20 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="size-11 items-center justify-center"
        >
          <ChevronLeft size={24} color={c.text} />
        </Pressable>
        <View className="flex-1 items-center justify-center gap-4 pb-20">
          <View className="size-14 items-center justify-center rounded-full bg-sr">
            <ScanLine size={26} color={c.accent} />
          </View>
          <Text
            accessibilityRole="header"
            className="font-display-sb text-2xl text-text"
          >
            {t('scanIsbn.permissionTitle')}
          </Text>
          <Text className="max-w-sm text-center font-body text-sm leading-6 text-t2">
            {t('scanIsbn.permissionDescription')}
          </Text>
          <Pressable
            onPress={() => void enableCamera()}
            accessibilityRole="button"
            className="min-h-12 justify-center rounded-md bg-accent px-5 active:opacity-85"
          >
            <Text
              className="text-center font-body-sb text-sm"
              style={{ color: c.onAccent }}
            >
              {t('scanIsbn.permissionAction')}
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-2 px-container pb-4 pt-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="size-11 items-center justify-center"
        >
          <ChevronLeft size={24} color={c.text} />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="font-display-sb text-xl text-text"
        >
          {t('scanIsbn.title')}
        </Text>
      </View>
      <View className="flex-1 justify-center px-container pb-8">
        <View
          className="overflow-hidden rounded-xl border border-border bg-surface"
          style={{ aspectRatio: 3 / 4 }}
        >
          <CameraView
            className="flex-1"
            barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
            onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
          />
          <View
            pointerEvents="none"
            className="absolute left-6 right-6 rounded-md border-2 border-accent"
            style={{ top: '42%', height: 96 }}
          />
        </View>
        <Text className="mt-5 text-center font-body text-sm leading-6 text-t2">
          {t('scanIsbn.description')}
        </Text>
        {error ? (
          <Text
            accessibilityLiveRegion="polite"
            className="mt-3 text-center font-body text-xs text-error"
          >
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
