import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import {
  QueryClient,
  QueryClientProvider,
  type InfiniteData
} from '@tanstack/react-query'
import { useSendMessage } from '~/features/chat/hooks/useSendMessage'
import type { ChatMessage } from '~/features/chat/chat.queries'

const mockSend = jest.fn()
jest.mock('~/stores/auth.store', () => ({ useAuthStore: () => 'me' }))
jest.mock('~/features/chat/chat.queries', () => ({
  sendMessageFn: (params: unknown) => mockSend(params),
  messagesInfiniteOptions: (id: string) => ({ queryKey: ['messages', id] })
}))

type Page = { items: ChatMessage[]; nextCursor: null }
// Usa mensajes reales de dominio para observar el estado de caché durante una carrera con Realtime.
function message(id: string, created_at = '2026-11-10T00:00:00Z'): ChatMessage {
  return {
    id,
    conversation_id: 'thread',
    sender_id: 'me',
    body: id,
    created_at,
    deleted_at: null,
    edited_at: null,
    reply_to: null,
    reply_to_id: null,
    sender: null
  }
}

describe('Reconciliación del envío', () => {
  beforeEach(() => mockSend.mockReset())

  it('reemplaza el temporal con la respuesta sin duplicar el mensaje recibido por Realtime', async () => {
    let resolveSend!: (message: ChatMessage) => void
    mockSend.mockImplementation(
      () =>
        new Promise<ChatMessage>((resolve) => {
          resolveSend = resolve
        })
    )
    const client = new QueryClient({
      defaultOptions: {
        mutations: { retry: false, gcTime: Infinity },
        queries: { gcTime: Infinity }
      }
    })
    client.setQueryData(['messages', 'thread'], {
      pages: [{ items: [message('before')], nextCursor: null }],
      pageParams: [undefined]
    })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const view = renderHook(() => useSendMessage('thread'), { wrapper })
    act(() => view.result.current.mutate({ body: 'nuevo' }))
    await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1))
    const saved = message('saved', '2026-11-10T00:01:00Z')
    const incoming = message('incoming', '2026-11-10T00:02:00Z')
    client.setQueryData<InfiniteData<Page>>(['messages', 'thread'], (old) => ({
      ...old!,
      pages: [
        { items: [incoming, saved, ...old!.pages[0].items], nextCursor: null }
      ]
    }))
    act(() => resolveSend(saved))
    await waitFor(() => expect(view.result.current.isSuccess).toBe(true))
    const items = client
      .getQueryData<InfiniteData<Page>>(['messages', 'thread'])!
      .pages.flatMap((page) => page.items)
    expect(items.map((item) => item.id)).toEqual([
      'incoming',
      'saved',
      'before'
    ])
    view.unmount()
    client.clear()
  })

  it('retira solo el temporal fallido y mantiene los mensajes llegados durante el envío', async () => {
    let rejectSend!: (error: Error) => void
    mockSend.mockImplementation(
      () =>
        new Promise<ChatMessage>((_resolve, reject) => {
          rejectSend = reject
        })
    )
    const client = new QueryClient({
      defaultOptions: {
        mutations: { retry: false, gcTime: Infinity },
        queries: { gcTime: Infinity }
      }
    })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const view = renderHook(() => useSendMessage('thread'), { wrapper })
    act(() => view.result.current.mutate({ body: 'nuevo' }))
    await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1))
    client.setQueryData<InfiniteData<Page>>(['messages', 'thread'], (old) => ({
      ...old!,
      pages: [
        {
          items: [message('incoming'), ...old!.pages[0].items],
          nextCursor: null
        }
      ]
    }))
    act(() => rejectSend(new Error('sin conexión')))
    await waitFor(() => expect(view.result.current.isError).toBe(true))
    const items = client
      .getQueryData<InfiniteData<Page>>(['messages', 'thread'])!
      .pages.flatMap((page) => page.items)
    expect(items.map((item) => item.id)).toEqual(['incoming'])
    view.unmount()
    client.clear()
  })
})
