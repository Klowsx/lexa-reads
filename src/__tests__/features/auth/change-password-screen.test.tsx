import { act, fireEvent, render } from '@testing-library/react-native'
import ChangePasswordScreen from '~/features/auth/screens/change-password-screen'

const mockBack = jest.fn()
const mockReplace = jest.fn()
const mockMutation = { mutate: jest.fn(), isPending: false, isError: false }
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: () => true
  })
}))
jest.mock('~/features/auth/hooks/useChangePassword', () => ({
  useChangePassword: () => mockMutation
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

describe('Cambio de contraseña desde Ajustes', () => {
  beforeEach(() => {
    mockMutation.mutate.mockReset()
    mockMutation.isPending = false
    mockMutation.isError = false
    mockBack.mockReset()
    mockReplace.mockReset()
  })

  it('envía ambas contraseñas sin volver atrás ni confirmar antes del servidor', () => {
    const view = render(<ChangePasswordScreen />)
    fireEvent.changeText(
      view.getByLabelText('changePassword.current'),
      '  clave actual  '
    )
    fireEvent.changeText(
      view.getByLabelText('changePassword.new'),
      'nuevaClave123'
    )
    fireEvent.changeText(
      view.getByLabelText('changePassword.confirm'),
      'nuevaClave123'
    )
    fireEvent.press(view.getByText('changePassword.save'))
    fireEvent.press(view.getByText('changePassword.save'))
    expect(mockMutation.mutate).toHaveBeenCalledTimes(1)
    expect(mockMutation.mutate).toHaveBeenCalledWith(
      { currentPassword: '  clave actual  ', password: 'nuevaClave123' },
      expect.any(Object)
    )
    expect(mockBack).not.toHaveBeenCalled()
    expect(view.queryByText('changePasswordResult.success')).toBeNull()
    const callbacks = mockMutation.mutate.mock.calls[0][1]
    act(() => {
      callbacks.onSuccess()
      callbacks.onSettled()
    })
    expect(view.getByText('changePasswordResult.success')).toBeTruthy()
    expect(view.queryByDisplayValue('nuevaClave123')).toBeNull()
    fireEvent.press(view.getByText('changePasswordResult.return'))
    expect(mockReplace).toHaveBeenCalledWith('/settings')
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('conserva los campos si falla y no envía contraseñas que no coinciden', () => {
    const view = render(<ChangePasswordScreen />)
    fireEvent.changeText(
      view.getByLabelText('changePassword.current'),
      'claveActual123'
    )
    fireEvent.changeText(
      view.getByLabelText('changePassword.new'),
      'nuevaClave123'
    )
    fireEvent.changeText(
      view.getByLabelText('changePassword.confirm'),
      'otraClave123'
    )
    fireEvent.press(view.getByText('changePassword.save'))
    expect(mockMutation.mutate).not.toHaveBeenCalled()
    fireEvent.changeText(
      view.getByLabelText('changePassword.confirm'),
      'nuevaClave123'
    )
    fireEvent.press(view.getByText('changePassword.save'))
    mockMutation.mutate.mock.calls[0][1].onSettled()
    mockMutation.isError = true
    view.rerender(<ChangePasswordScreen />)
    expect(view.getByText('changePasswordResult.errorHint')).toBeTruthy()
    expect(view.getAllByDisplayValue('nuevaClave123')).toHaveLength(2)
    expect(view.queryByText('changePasswordResult.success')).toBeNull()
  })
})
