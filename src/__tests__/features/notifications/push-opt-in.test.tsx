import { fireEvent, render } from '@testing-library/react-native'
import { PushOptInSheet } from '~/features/notifications/components/PushOptInSheet'

const mockMutation = {
  mutate: jest.fn(),
  isPending: false,
  isError: false,
  data: undefined as { enabled: boolean } | undefined
}
jest.mock('~/features/notifications/hooks/usePushOptIn', () => ({
  usePushOptIn: () => mockMutation
}))
jest.mock('~/theme/stitch', () => ({ useStitchTheme: () => ({}) }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}))

describe('Permiso push contextual', () => {
  beforeEach(() => {
    mockMutation.mutate.mockReset()
    mockMutation.isPending = false
    mockMutation.isError = false
    mockMutation.data = undefined
  })

  it('explica el permiso sin solicitarlo antes de pulsar Activar', () => {
    const close = jest.fn()
    const view = render(<PushOptInSheet onClose={close} />)
    expect(mockMutation.mutate).not.toHaveBeenCalled()
    fireEvent.press(view.getByText('notifications.pushEnable'))
    expect(mockMutation.mutate).toHaveBeenCalledWith(true, expect.any(Object))
    mockMutation.mutate.mock.calls[0][1].onSuccess({ enabled: false })
    expect(close).not.toHaveBeenCalled()
    mockMutation.data = { enabled: false }
    view.rerender(<PushOptInSheet onClose={close} />)
    expect(view.getByText('pushPermission.declined')).toBeTruthy()
    expect(view.queryByText('notifications.pushEnable')).toBeNull()
  })

  it('guarda Ahora no sin intentar activar el permiso', () => {
    const view = render(<PushOptInSheet onClose={jest.fn()} />)
    fireEvent.press(view.getByText('notifications.pushNotNow'))
    expect(mockMutation.mutate).toHaveBeenCalledWith(false, expect.any(Object))
  })

  it('mantiene las acciones disponibles tras un error de guardado', () => {
    mockMutation.isError = true
    const view = render(<PushOptInSheet onClose={jest.fn()} />)
    expect(view.getByText('pushPermission.error')).toBeTruthy()
    fireEvent.press(view.getByText('notifications.pushEnable'))
    expect(mockMutation.mutate).toHaveBeenCalledWith(true, expect.any(Object))
  })
})
