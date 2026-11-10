import { fireEvent, render } from '@testing-library/react-native'
import NotificationSettingsScreen from '../../../../app/settings-notifications'
import type { NotificationPreferences } from '~/features/user/user.queries'

const mockPreferences = {
  data: undefined as NotificationPreferences | null | undefined,
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: jest.fn()
}
const mockUpsert = { mutate: jest.fn(), isPending: false, isError: false }
const mockPush = {
  mutate: jest.fn(),
  isPending: false,
  isError: false,
  data: undefined as { enabled: boolean } | undefined
}

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }))
jest.mock('~/features/user/hooks/useNotificationPreferences', () => ({
  useNotificationPreferences: () => mockPreferences,
  useUpsertNotificationPreferences: () => mockUpsert
}))
jest.mock('~/features/notifications/hooks/usePushOptIn', () => ({
  usePushOptIn: () => mockPush
}))
jest.mock('~/theme/colors', () => ({ useColors: () => ({}) }))
jest.mock('~/theme/stitch', () => ({ useStitchTheme: () => ({}) }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}))

// Compone preferencias persistidas para probar el estado visible de los controles.
function preferences(token: string): NotificationPreferences {
  return {
    user_id: 'reader',
    push_new_follower: true,
    push_activity_like: true,
    push_review_like: true,
    push_comment: true,
    push_recommendation: true,
    push_dm: true,
    push_club: true,
    email_weekly_digest: false,
    consent_given_at: '2026-11-10T00:00:00Z',
    push_token: token,
    updated_at: '2026-11-10T00:00:00Z'
  }
}

describe('Preferencias de notificaciones', () => {
  beforeEach(() => {
    mockPreferences.data = preferences('push-token')
    mockPreferences.isPending = false
    mockPreferences.isError = false
    mockPreferences.isFetching = false
    mockPreferences.refetch.mockReset()
    mockUpsert.mutate.mockReset()
    mockUpsert.isPending = false
    mockUpsert.isError = false
    mockPush.mutate.mockReset()
    mockPush.isPending = false
    mockPush.isError = false
    mockPush.data = undefined
  })

  it('no presenta controles ni preferencias ausentes como si una consulta fallida hubiera terminado bien', () => {
    mockPreferences.data = undefined
    mockPreferences.isError = true
    const view = render(<NotificationSettingsScreen />)
    expect(view.getByText('communityStates.retryHint')).toBeTruthy()
    expect(view.queryByText('notifSettings.noPreferencesTitle')).toBeNull()
    expect(view.queryAllByRole('switch')).toHaveLength(0)
    fireEvent.press(view.getByText('common.retry'))
    expect(mockPreferences.refetch).toHaveBeenCalledTimes(1)
    expect(mockUpsert.mutate).not.toHaveBeenCalled()
  })

  it('explica la ausencia real de preferencias y solicita permiso solo desde la hoja', () => {
    mockPreferences.data = null
    const view = render(<NotificationSettingsScreen />)
    expect(view.getByText('notifSettings.noPreferencesTitle')).toBeTruthy()
    expect(mockPush.mutate).not.toHaveBeenCalled()
    fireEvent.press(
      view.getByRole('switch', { name: 'notifSettings.pushNotifications' })
    )
    expect(view.getByText('notifications.pushTitle')).toBeTruthy()
    expect(mockPush.mutate).not.toHaveBeenCalled()
    fireEvent.press(view.getByText('notifications.pushEnable'))
    expect(mockPush.mutate).toHaveBeenCalledWith(true, expect.any(Object))
  })

  it('desactiva push sin solicitar permiso y mantiene el fallo visible para reintentar', () => {
    const view = render(<NotificationSettingsScreen />)
    fireEvent.press(
      view.getByRole('switch', { name: 'notifSettings.pushNotifications' })
    )
    expect(mockPush.mutate).toHaveBeenCalledWith(false, expect.any(Object))
    expect(view.queryByText('notifications.pushTitle')).toBeNull()
    mockPush.mutate.mock.calls[0][1].onSettled()
    mockPush.isError = true
    view.rerender(<NotificationSettingsScreen />)
    expect(view.getByText('consent.saveError')).toBeTruthy()
    fireEvent.press(
      view.getByRole('switch', { name: 'notifSettings.pushNotifications' })
    )
    expect(mockPush.mutate).toHaveBeenCalledTimes(2)
  })

  it('bloquea escrituras duplicadas y los demás controles mientras se guarda', () => {
    const view = render(<NotificationSettingsScreen />)
    fireEvent.press(
      view.getByRole('switch', { name: 'notifSettings.comments' })
    )
    fireEvent.press(
      view.getByRole('switch', { name: 'notifSettings.comments' })
    )
    expect(mockUpsert.mutate).toHaveBeenCalledTimes(1)
    expect(mockUpsert.mutate).toHaveBeenCalledWith(
      { push_comment: false },
      expect.any(Object)
    )
    mockUpsert.isPending = true
    view.rerender(<NotificationSettingsScreen />)
    for (const control of view.getAllByRole('switch')) {
      expect(control.props.accessibilityState.disabled).toBe(true)
    }
  })
})
