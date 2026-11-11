import { Component, type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import i18n from '~/lib/i18n'
import { logError } from '~/lib/crash-reporting'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * ErrorBoundary raíz (O-1). Sin esto, un error de render en cualquier pantalla
 * tumba toda la app a pantalla en blanco y sin reporte. Captura el error,
 * lo reporta vía `logError` y muestra una UI de fallback con "Reintentar".
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: unknown, info: { componentStack?: string }) {
    logError(error, { componentStack: info.componentStack })
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 bg-bg items-center justify-center px-8 gap-3">
          <Text className="font-display-sb text-lg text-text text-center">
            {i18n.t('common.somethingWrong')}
          </Text>
          <Text className="font-body text-sm text-t3 text-center leading-[20px]">
            {i18n.t('common.unexpectedError')}
          </Text>
          <Pressable
            onPress={this.reset}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('common.retry')}
            className="mt-2 px-6 py-3 rounded-full bg-accent"
          >
            <Text className="font-body-sb text-sm text-on-accent">
              {i18n.t('common.retry')}
            </Text>
          </Pressable>
        </View>
      )
    }
    return this.props.children
  }
}
