import { Text } from 'react-native'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { SharePreviewSheet } from '~/features/share/components/SharePreviewSheet'

const mockCapture = jest.fn()
jest.mock('~/features/share/hooks/useShareCard', () => ({
  useShareCard: () => ({
    ref: { current: null },
    capture: mockCapture,
    isSharing: false
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
  beforeEach(() => mockCapture.mockReset())

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
})
