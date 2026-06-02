import { useRef, useState } from "react";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

export function useShareCard() {
  const ref = useRef<any>(null);
  const [isSharing, setIsSharing] = useState(false);

  async function capture() {
    if (!ref.current) return;
    setIsSharing(true);
    try {
      const uri = await captureRef(ref, {
        format: "png",
        quality: 0.95,
        result: "tmpfile",
      });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          UTI: "public.png",
          dialogTitle: "Compartir",
        });
      }
    } finally {
      setIsSharing(false);
    }
  }

  return { ref, isSharing, capture };
}
