import type { ReactNode } from 'react'
import { Text } from 'react-native'
import { act, render, waitFor } from '@testing-library/react-native'
import {
  createNavigationContainerRef,
  createNavigatorFactory,
  NavigationContainer,
  StackRouter,
  useNavigationBuilder
} from '@react-navigation/native'
import ChangePasswordScreen from '~/features/auth/screens/change-password-screen'

let mockSetPending: (pending: boolean) => void
let mockSetSession: (hasSession: boolean) => void
jest.mock('~/stores/auth.store', () => ({
  useAuthStore: function useMockSession() {
    const React = jest.requireActual<typeof import('react')>('react')
    const [hasSession, setSession] = React.useState(true)
    mockSetSession = setSession
    return hasSession
  }
}))
jest.mock('~/features/auth/hooks/useChangePassword', () => ({
  useChangePassword: function useMockChangePassword() {
    const React = jest.requireActual<typeof import('react')>('react')
    const [isPending, setPending] = React.useState(false)
    mockSetPending = setPending
    return { isPending, isError: false, mutate: jest.fn() }
  }
}))
jest.mock('expo-router', () => ({
  useRouter: () => ({
    canGoBack: () => true,
    back: jest.fn(),
    replace: jest.fn()
  })
}))
jest.mock('~/lib/utils', () => ({
  cn: (...values: string[]) => values.filter(Boolean).join(' ')
}))
jest.mock('~/theme/colors', () => ({
  useColors: () => ({ accent: '#000000', success: '#008800' })
}))
jest.mock('~/theme/stitch', () => ({ useStitchTheme: () => ({}) }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}))

// Utiliza el router y los contextos reales de React Navigation sin depender de gestos nativos de Jest.
function TestNavigator({ children }: { children: ReactNode }) {
  const { state, descriptors, NavigationContent } = useNavigationBuilder(
    StackRouter,
    { children }
  )
  return (
    <NavigationContent>
      {descriptors[state.routes[state.index].key].render()}
    </NavigationContent>
  )
}
const Stack = createNavigatorFactory(TestNavigator)()

// Representa el destino de retorno para observar si una acción de navegación se ejecutó.
function Settings() {
  return <Text>Ajustes de prueba</Text>
}

it('impide volver mientras se guarda y libera la navegación cuando termina', async () => {
  const navigation = createNavigationContainerRef<{
    settings: undefined
    change: undefined
  }>()
  const view = render(
    <NavigationContainer ref={navigation}>
      <Stack.Navigator>
        <Stack.Screen name="settings" component={Settings} />
        <Stack.Screen name="change" component={ChangePasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
  await waitFor(() => expect(navigation.isReady()).toBe(true))
  await act(async () => navigation.navigate('change'))
  await act(async () => mockSetPending(true))
  await act(async () => navigation.goBack())
  expect(navigation.getCurrentRoute()?.name).toBe('change')
  await act(async () => mockSetPending(false))
  await act(async () => navigation.goBack())
  expect(navigation.getCurrentRoute()?.name).toBe('settings')
  expect(view.getByText('Ajustes de prueba')).toBeTruthy()
})

it('no impide retirar una pantalla privada si la sesión termina durante el guardado', async () => {
  const navigation = createNavigationContainerRef<{
    settings: undefined
    change: undefined
  }>()
  render(
    <NavigationContainer ref={navigation}>
      <Stack.Navigator>
        <Stack.Screen name="settings" component={Settings} />
        <Stack.Screen name="change" component={ChangePasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
  await waitFor(() => expect(navigation.isReady()).toBe(true))
  await act(async () => navigation.navigate('change'))
  await act(async () => mockSetPending(true))
  await act(async () => mockSetSession(false))
  await act(async () => navigation.goBack())
  expect(navigation.getCurrentRoute()?.name).toBe('settings')
})
