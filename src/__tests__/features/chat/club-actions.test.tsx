import { fireEvent, render } from '@testing-library/react-native'
import { ClubActionsSheet } from '~/features/clubs/components/ClubActionsSheet'

const mockMembership = {
  mutate: jest.fn(),
  reset: jest.fn(),
  isPending: false,
  isError: false
}
jest.mock('~/features/clubs/hooks/useClubMembership', () => ({
  useClubMembership: () => mockMembership
}))
jest.mock('~/theme/stitch', () => ({ useStitchTheme: () => ({}) }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}))

describe('Acciones del club', () => {
  beforeEach(() => {
    mockMembership.mutate.mockReset()
    mockMembership.isError = false
    mockMembership.isPending = false
  })

  it('confirma la salida y conserva el diálogo tras fallar', () => {
    const close = jest.fn()
    const props = {
      clubId: 'club',
      clubName: 'Lecturas compartidas',
      onClose: close,
      onReport: jest.fn()
    }
    const view = render(<ClubActionsSheet {...props} />)
    fireEvent.press(view.getByText('clubStates.leave'))
    expect(mockMembership.mutate).not.toHaveBeenCalled()
    fireEvent.press(view.getByText('clubStates.leave'))
    fireEvent.press(view.getByText('clubStates.leave'))
    expect(mockMembership.mutate).toHaveBeenCalledTimes(1)
    expect(mockMembership.mutate).toHaveBeenCalledWith(
      { clubId: 'club', action: 'leave' },
      expect.any(Object)
    )
    mockMembership.isError = true
    view.rerender(<ClubActionsSheet {...props} />)
    expect(view.getByText('clubStates.leaveError')).toBeTruthy()
    expect(close).not.toHaveBeenCalled()
  })

  it('abre el reporte sin ejecutar la salida', () => {
    const report = jest.fn()
    const close = jest.fn()
    const view = render(
      <ClubActionsSheet
        clubId="club"
        clubName="Lecturas"
        onClose={close}
        onReport={report}
      />
    )
    fireEvent.press(view.getByText('clubStates.report'))
    expect(report).toHaveBeenCalledTimes(1)
    expect(close).toHaveBeenCalledTimes(1)
    expect(mockMembership.mutate).not.toHaveBeenCalled()
  })
})
