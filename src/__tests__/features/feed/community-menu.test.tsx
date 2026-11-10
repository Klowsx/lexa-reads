import { fireEvent, render } from '@testing-library/react-native'
import { CommunityMenu } from '~/features/feed/components/CommunityMenu'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }))
jest.mock('~/theme/stitch', () => ({ useStitchTheme: () => ({}) }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}))

describe('Menú de comunidad', () => {
  beforeEach(() => mockPush.mockReset())

  it.each([
    ['communityMenu.clubs', '/clubs'],
    ['communityMenu.messages', '/messages']
  ])('abre %s y cierra el menú antes de navegar', (label, path) => {
    const view = render(<CommunityMenu />)
    fireEvent.press(view.getByLabelText('communityMenu.title'))
    expect(view.getByText(label)).toBeTruthy()
    fireEvent.press(view.getByText(label))
    expect(mockPush).toHaveBeenCalledWith(path)
    expect(view.queryByText(label)).toBeNull()
  })

  it('permite cerrar sin navegar', () => {
    const view = render(<CommunityMenu />)
    fireEvent.press(view.getByLabelText('communityMenu.title'))
    fireEvent.press(view.getByLabelText('common.close'))
    expect(mockPush).not.toHaveBeenCalled()
    expect(view.queryByText('communityMenu.clubs')).toBeNull()
  })
})
