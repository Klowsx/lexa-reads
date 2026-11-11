import { act, fireEvent, render } from '@testing-library/react-native'
import { ChatThread } from '~/features/chat/components/ChatThread'

const mockMutate = jest.fn()
const mockRefetch = jest.fn()
const mockQuery = {
  data: { pages: [{ items: [] }] },
  isLoading: false,
  isPending: false,
  isError: false,
  isFetching: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
  fetchNextPage: jest.fn(),
  refetch: mockRefetch
}
const mockMutation = { mutate: mockMutate, isPending: false, isError: false }
jest.mock('~/components/ui/Avatar', () => ({ Avatar: () => null }))
jest.mock('~/lib/utils', () => ({ formatRelativeTime: () => 'ahora' }))

jest.mock('~/features/chat/hooks/useMessages', () => ({
  useMessages: () => mockQuery
}))
jest.mock('~/features/chat/hooks/useSendMessage', () => ({
  useSendMessage: () => mockMutation
}))
jest.mock('~/features/chat/hooks/useRealtimeMessages', () => ({
  useRealtimeMessages: jest.fn()
}))
jest.mock('~/features/chat/hooks/useMarkConversationRead', () => ({
  useMarkConversationRead: jest.fn()
}))
jest.mock('~/features/user/components/ReportSheet', () => ({
  ReportSheet: () => null
}))
jest.mock('~/features/chat/components/MessageActionsSheet', () => ({
  MessageActionsSheet: () => null
}))
jest.mock('~/stores/auth.store', () => ({ useAuthStore: () => 'me' }))
jest.mock('~/theme/colors', () => ({ useColors: () => ({}) }))
jest.mock('~/theme/stitch', () => ({ useStitchTheme: () => ({}) }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}))

describe('Borrador del chat', () => {
  beforeEach(() => {
    mockMutate.mockReset()
    mockMutation.isPending = false
    mockMutation.isError = false
    mockQuery.isError = false
  })

  it('conserva el texto hasta recibir confirmación y bloquea un doble envío', () => {
    const view = render(<ChatThread conversationId="thread" header={null} />)
    fireEvent.changeText(
      view.getByLabelText('chatStates.messageInput'),
      'Una lectura pendiente'
    )
    fireEvent.press(view.getByLabelText('chatStates.send'))
    fireEvent.press(view.getByLabelText('chatStates.send'))
    expect(mockMutate).toHaveBeenCalledTimes(1)
    expect(view.getByDisplayValue('Una lectura pendiente')).toBeTruthy()
    const callbacks = mockMutate.mock.calls[0][1]
    callbacks.onSettled()
    mockMutation.isError = true
    view.rerender(<ChatThread conversationId="thread" header={null} />)
    expect(view.getByText('chatStates.sendErrorHint')).toBeTruthy()
    expect(view.getByDisplayValue('Una lectura pendiente')).toBeTruthy()
    fireEvent.press(view.getByLabelText('chatStates.send'))
    expect(mockMutate).toHaveBeenCalledTimes(2)
    // El segundo intento confirma el envío y entonces se limpia el campo.
    act(() => mockMutate.mock.calls[1][1].onSuccess())
    expect(view.queryByDisplayValue('Una lectura pendiente')).toBeNull()
  })

  it('no envía cuando la conversación está en espera de aceptación', () => {
    const view = render(
      <ChatThread
        conversationId="thread"
        header={null}
        canSend={false}
        disabledHint="Esperando aceptación"
      />
    )
    expect(view.getByText('Esperando aceptación')).toBeTruthy()
    expect(view.queryByLabelText('chatStates.messageInput')).toBeNull()
    expect(mockMutate).not.toHaveBeenCalled()
  })
})
