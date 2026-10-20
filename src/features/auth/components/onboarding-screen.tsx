import type { ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { OnboardHeader } from './OnboardHeader'
import { StepBar } from './StepBar'
import { useLogout } from '../hooks/useLogout'
import { GhostButton } from './GhostButton'

type Props = {
  step: number
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  onBack?: () => void
  onSkip?: () => void
  busy?: boolean
}

// Mantiene los pasos legibles con teclado, pantallas pequeñas y una salida para cambiar de cuenta.
export function OnboardingScreen({
  step,
  title,
  description,
  children,
  footer,
  onBack,
  onSkip,
  busy
}: Props) {
  const insets = useSafeAreaInsets()
  const logout = useLogout()
  const locked = busy || logout.isPending
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 16
        }}
      >
        <OnboardHeader
          step={step}
          total={3}
          onBack={onBack}
          onSkip={onSkip}
          disabled={locked}
        />
        <StepBar step={step} total={3} />
        <View className="px-6 mb-7">
          <Text
            accessibilityRole="header"
            className="font-display-sb text-text text-2xl"
          >
            {title}
          </Text>
          <Text className="font-body text-t2 text-xs mt-3 leading-6">
            {description}
          </Text>
        </View>
        <View className="px-6" pointerEvents={locked ? 'none' : 'auto'}>
          {children}
        </View>
        <View className="flex-1 min-h-8" />
        <View className="px-6 pt-4">
          {footer}
          <View className="mt-3">
            <GhostButton disabled={locked} onPress={() => logout.mutate()}>
              <Text className="font-body text-t2 text-xs">
                {logout.isPending ? 'Cerrando sesión…' : 'Usar otra cuenta'}
              </Text>
            </GhostButton>
          </View>
          {logout.error && (
            <Text
              accessibilityLiveRegion="polite"
              className="font-body text-error text-xs mt-2"
            >
              No pudimos cerrar la sesión. Inténtalo de nuevo.
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
