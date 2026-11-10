import { Modal, Pressable, Text } from 'react-native'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { SharePreviewSheet } from '~/features/share/components/SharePreviewSheet'

const mockCapture = jest.fn()
let mockSharing = false
jest.mock('~/features/share/hooks/useShareCard', () => ({
  useShareCard: () => ({
    ref: { current: null },
    capture: mockCapture,
    isSharing: mockSharing
  })
}))
jest.mock('~/theme/stitch', () => ({ useStitchTheme: () => ({}) }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}))
jest.mock('react-native-view-shot', () => 'ViewShot')

describe('Vista previa para compartir', () => {
  beforeEach(() => {
    mockCapture.mockReset()
    mockSharing = false
  })

  it('espera la confirmación del lector y conserva la pieza al fallar para reintentar', async () => {
    mockCapture
      .mockRejectedValueOnce(new Error('sin soporte'))
      .mockResolvedValueOnce(undefined)
    const view = render(
      <SharePreviewSheet onClose={jest.fn()}>
        <Text>Tarjeta del libro</Text>
      </SharePreviewSheet>
    )
    expect(mockCapture).not.toHaveBeenCalled()
    fireEvent.press(view.getByText('common.share'))
    await waitFor(() =>
      expect(view.getByText('sharePreview.error')).toBeTruthy()
    )
    expect(view.getByText('Tarjeta del libro')).toBeTruthy()
    fireEvent.press(view.getByText('common.share'))
    await waitFor(() =>
      expect(view.queryByText('sharePreview.error')).toBeNull()
    )
    expect(mockCapture).toHaveBeenCalledTimes(2)
  })

  it('explica la protección de spoilers y permite cerrar sin compartir', () => {
    const close = jest.fn()
    const view = render(
      <SharePreviewSheet containsSpoilers onClose={close}>
        <Text>Tarjeta protegida</Text>
      </SharePreviewSheet>
    )
    expect(view.getByText('sharePreview.spoilerHint')).toBeTruthy()
    fireEvent.press(view.getByLabelText('common.close'))
    expect(close).toHaveBeenCalledTimes(1)
    expect(mockCapture).not.toHaveBeenCalled()
  })

  it('espera que la imagen esté dibujada antes de permitir la captura', async () => {
    mockCapture.mockResolvedValue(undefined)
    const view = render(
      <SharePreviewSheet onClose={jest.fn()}>
        {(onReady) => (
          <Pressable onPress={() => onReady(true)}>
            <Text>Alternativa dibujada</Text>
          </Pressable>
        )}
      </SharePreviewSheet>
    )
    expect(view.getByText('sharePreview.loadingImage')).toBeTruthy()
    fireEvent.press(view.getByText('common.share'))
    expect(mockCapture).not.toHaveBeenCalled()
    fireEvent.press(view.getByText('Alternativa dibujada'))
    expect(view.queryByText('sharePreview.loadingImage')).toBeNull()
    expect(view.getByText('sharePreview.imageFallback')).toBeTruthy()
    fireEvent.press(view.getByText('common.share'))
    await waitFor(() => expect(mockCapture).toHaveBeenCalledTimes(1))
  })

  it('no desmonta la tarjeta al cerrar mientras se está compartiendo', () => {
    mockSharing = true
    const close = jest.fn()
    const view = render(
      <SharePreviewSheet onClose={close}>
        <Text>Tarjeta</Text>
      </SharePreviewSheet>
    )
    fireEvent.press(view.getByLabelText('common.close'))
    view.UNSAFE_getByType(Modal).props.onRequestClose()
    expect(close).not.toHaveBeenCalled()
  })

  it('bloquea el cierre y el doble envío antes de que se actualice el estado visual', async () => {
    let finish!: () => void
    mockCapture.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        })
    )
    const close = jest.fn()
    const view = render(
      <SharePreviewSheet onClose={close}>
        <Text>Tarjeta</Text>
      </SharePreviewSheet>
    )
    fireEvent.press(view.getByText('common.share'))
    fireEvent.press(view.getByText('common.share'))
    fireEvent.press(view.getByLabelText('common.close'))
    expect(mockCapture).toHaveBeenCalledTimes(1)
    expect(close).not.toHaveBeenCalled()
    await act(async () => finish())
    fireEvent.press(view.getByLabelText('common.close'))
    expect(close).toHaveBeenCalledTimes(1)
  })
})
