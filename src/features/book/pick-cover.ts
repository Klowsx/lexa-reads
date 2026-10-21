import * as ImagePicker from 'expo-image-picker'

// Abre la galería y valida el límite compartido por altas y correcciones.
export async function pickBookCover(): Promise<ImagePicker.ImagePickerAsset | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    base64: true,
    quality: 0.8,
    allowsEditing: true,
    aspect: [2, 3]
  })
  if (result.canceled) return null
  const image = result.assets[0]
  if (!image.base64 || image.base64.length * 0.75 > 5 * 1024 * 1024) {
    throw new Error('cover-too-large')
  }
  return image
}
