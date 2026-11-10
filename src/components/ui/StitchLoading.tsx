import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useStitchTheme } from '~/theme/stitch'

// Anticipa la estructura de listas nuevas sin animación ni contenido de muestra anunciado.
export function StitchLoading() {
  const c = useStitchTheme()
  const { t } = useTranslation()
  return (
    <View accessibilityState={{ busy: true }} style={{ padding: 20, gap: 24 }}>
      <Text
        accessibilityRole="text"
        style={{ fontFamily: c.body, fontSize: 16, color: c.secondary }}
      >
        {t('communityStates.loading')}
      </Text>
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ gap: 24 }}
      >
        {[0, 1, 2, 3].map((row) => (
          <View key={row} style={{ flexDirection: 'row', gap: 16 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: c.muted
              }}
            />
            <View style={{ flex: 1, gap: 10 }}>
              <View
                style={{
                  height: 18,
                  width: '65%',
                  borderRadius: 4,
                  backgroundColor: c.muted
                }}
              />
              <View
                style={{
                  height: 14,
                  width: '90%',
                  borderRadius: 4,
                  backgroundColor: c.muted
                }}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
