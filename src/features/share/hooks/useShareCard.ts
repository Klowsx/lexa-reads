import { useCallback, useRef, useState } from 'react'
import { captureRef } from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'

// Comparte una captura y mantiene estable la acción para no repetir efectos al renderizar.
export function useShareCard() {
  const ref = useRef<any>(null)
  const [isSharing, setIsSharing] = useState(false)

  const capture = useCallback(async () => {
    if (!ref.current) return
    setIsSharing(true)
    try {
      const uri = await captureRef(ref, {
        format: 'png',
        quality: 0.95,
        result: 'tmpfile'
      })
      const available = await Sharing.isAvailableAsync()
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: 'Compartir'
        })
      }
    } finally {
      setIsSharing(false)
    }
  }, [])

  return { ref, isSharing, capture }
}
