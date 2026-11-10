import { fireEvent, render } from '@testing-library/react-native'
import InboxScreen from '../../../../app/messages/index'
import ClubsScreen from '../../../../app/clubs/index'

const mockPush = jest.fn()
const mockRefetch = jest.fn()
const mockInbox = {
  data: undefined as unknown[] | undefined,
  isPending: false,
  isError: true,
  isRefetching: false,
  refetch: mockRefetch
}
const mockClubs = {
  data: undefined as unknown[] | undefined,
  isPending: false,
  isError: true,
  isFetching: false,
  isRefetching: false,
  refetch: mockRefetch
}

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() })
}))
jest.mock('@shopify/flash-list', () => ({
  FlashList: require('react-native').FlatList
}))
jest.mock('~/features/chat/hooks/useDMInbox', () => ({
  useDMInbox: () => mockInbox
}))
jest.mock('~/features/clubs/hooks/useClubs', () => ({
  useMyClubs: () => mockClubs,
  useDiscoverClubs: () => mockClubs
}))
jest.mock('~/features/chat/components/ConversationRow', () => ({
  ConversationRow: () => null
}))
jest.mock('~/features/clubs/components/ClubCard', () => ({
  ClubCard: () => null
}))
jest.mock('~/theme/colors', () => ({ useColors: () => ({}) }))
jest.mock('~/theme/stitch', () => ({ useStitchTheme: () => ({}) }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}))

describe('Estados de la comunidad', () => {
  beforeEach(() => {
    mockRefetch.mockReset()
    mockPush.mockReset()
    mockInbox.data = undefined
    mockInbox.isError = true
    mockClubs.data = undefined
    mockClubs.isError = true
  })

  it('ofrece reintentar la bandeja cuando falla y no muestra un falso vacío', () => {
    const view = render(<InboxScreen />)
    expect(view.getByText('communityStates.inboxError')).toBeTruthy()
    expect(view.queryByText('communityStates.noConversations')).toBeNull()
    fireEvent.press(view.getByText('common.retry'))
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('lleva a buscar lectores únicamente cuando la bandeja realmente está vacía', () => {
    mockInbox.isError = false
    mockInbox.data = []
    const view = render(<InboxScreen />)
    fireEvent.press(view.getByText('communityStates.findReaders'))
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/search')
  })

  it('un error de clubes no se presenta como ausencia de clubes', () => {
    const view = render(<ClubsScreen />)
    expect(view.getByText('communityStates.clubsError')).toBeTruthy()
    expect(view.queryByText('communityStates.noClubs')).toBeNull()
    fireEvent.press(view.getByText('common.retry'))
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })
})
