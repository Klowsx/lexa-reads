import { useCallback, useRef, useState } from 'react'
import { captureRef } from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'

// Comparte una captura y mantiene estable la acción para no repetir efectos al renderizar.
export function useShareCard() {
  const ref = useRef<import('react-native-view-shot').default>(null)
  const sharing = useRef(false)
  const [isSharing, setIsSharing] = useState(false)

  const capture = useCallback(async () => {
    if (sharing.current) return
    if (!ref.current) throw new Error('La tarjeta todavía no está preparada.')
    sharing.current = true
    setIsSharing(true)
    try {
      // Comprueba soporte antes de capturar para comunicar los dispositivos no compatibles.
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error(
          'Compartir imágenes no está disponible en este dispositivo.'
        )
      }
      const uri = await captureRef(ref, {
        format: 'png',
        quality: 0.95,
        result: 'tmpfile'
      })
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
        dialogTitle: 'Compartir'
      })
    } finally {
      sharing.current = false
      setIsSharing(false)
    }
  }, [])

  return { ref, isSharing, capture }
}
