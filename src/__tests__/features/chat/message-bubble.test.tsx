import { fireEvent, render } from '@testing-library/react-native'
import { MessageBubble } from '~/features/chat/components/MessageBubble'
import type { ChatMessage } from '~/features/chat/chat.queries'

jest.mock('~/lib/utils', () => ({ formatRelativeTime: () => 'ahora' }))
jest.mock('~/theme/colors', () => ({ useColors: () => ({}) }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const message: ChatMessage = {
  id: 'message',
  conversation_id: 'thread',
  sender_id: 'me',
  body: 'Mi respuesta',
  created_at: '2026-11-10T00:00:00Z',
  deleted_at: null,
  edited_at: null,
  reply_to_id: null,
  reply_to: null,
  sender: null
}

describe('Estados de un mensaje', () => {
  it('no muestra el texto de una cita eliminada', () => {
    const view = render(
      <MessageBubble
        message={{
          ...message,
          reply_to: {
            id: 'original',
            sender_id: 'other',
            body: 'Texto retirado',
            deleted_at: '2026-11-10T00:01:00Z'
          }
        }}
        isOwn
        onActions={jest.fn()}
      />
    )
    expect(view.queryByText('Texto retirado')).toBeNull()
    expect(view.getByText('chatStates.deleted')).toBeTruthy()
    expect(view.getByText('Mi respuesta')).toBeTruthy()
  })

  it('no ofrece acciones sobre mensajes temporales o eliminados', () => {
    const action = jest.fn()
    const view = render(
      <MessageBubble
        message={{ ...message, id: 'temp-1' }}
        isOwn
        onActions={action}
      />
    )
    fireEvent.press(view.getByLabelText('Mi respuesta'))
    expect(action).not.toHaveBeenCalled()
    view.rerender(
      <MessageBubble
        message={{ ...message, deleted_at: '2026-11-10T00:01:00Z' }}
        isOwn
        onActions={action}
      />
    )
    fireEvent.press(view.getByLabelText('chatStates.deleted'))
    expect(action).not.toHaveBeenCalled()
    expect(view.queryByText('Mi respuesta')).toBeNull()
  })
})
