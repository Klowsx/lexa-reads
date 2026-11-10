import { fireEvent, render } from '@testing-library/react-native'
import { MessageActionsSheet } from '~/features/chat/components/MessageActionsSheet'
import type { ChatMessage } from '~/features/chat/chat.queries'

const mockRemove = { mutate: jest.fn(), isPending: false, isError: false }
jest.mock('~/features/chat/hooks/useDeleteMessage', () => ({
  useDeleteMessage: () => mockRemove
}))
jest.mock('~/theme/stitch', () => ({ useStitchTheme: () => ({}) }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}))

const message = {
  id: 'message',
  body: 'Una impresión sobre el libro',
  sender_id: 'me'
} as ChatMessage

describe('Acciones de mensaje', () => {
  beforeEach(() => {
    mockRemove.mutate.mockReset()
    mockRemove.isError = false
    mockRemove.isPending = false
  })

  it('pide confirmación antes de borrar y permite reintentar un error', () => {
    const close = jest.fn()
    const props = {
      message,
      isOwn: true,
      conversationId: 'thread',
      onClose: close,
      onReply: jest.fn(),
      onReport: jest.fn()
    }
    const view = render(<MessageActionsSheet {...props} />)
    fireEvent.press(view.getByText('common.delete'))
    expect(mockRemove.mutate).not.toHaveBeenCalled()
    expect(view.getByText('chatStates.deleteHint')).toBeTruthy()
    fireEvent.press(view.getByText('common.delete'))
    fireEvent.press(view.getByText('common.delete'))
    expect(mockRemove.mutate).toHaveBeenCalledTimes(1)
    expect(mockRemove.mutate).toHaveBeenCalledWith(
      'message',
      expect.objectContaining({ onSuccess: close })
    )
    mockRemove.isError = true
    view.rerender(<MessageActionsSheet {...props} />)
    expect(view.getByText('chatStates.deleteError')).toBeTruthy()
    expect(close).not.toHaveBeenCalled()
  })

  it('no permite cambiar la cita mientras otro mensaje se está enviando', () => {
    const reply = jest.fn()
    const view = render(
      <MessageActionsSheet
        message={message}
        isOwn={false}
        conversationId="thread"
        onClose={jest.fn()}
        onReply={reply}
        onReport={jest.fn()}
        canReply={false}
      />
    )
    fireEvent.press(view.getByText('chatStates.reply'))
    expect(reply).not.toHaveBeenCalled()
  })

  it('ofrece reportar un mensaje ajeno sin ofrecer borrarlo', () => {
    const report = jest.fn()
    const close = jest.fn()
    const view = render(
      <MessageActionsSheet
        message={message}
        isOwn={false}
        conversationId="thread"
        onClose={close}
        onReply={jest.fn()}
        onReport={report}
      />
    )
    expect(view.queryByText('common.delete')).toBeNull()
    fireEvent.press(view.getByText('chatStates.report'))
    expect(report).toHaveBeenCalledWith(message)
    expect(close).toHaveBeenCalledTimes(1)
  })
})
