import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { createChunkedStorage, type AsyncStorage } from './chunked-storage'

// Usa almacenamiento cifrado del dispositivo; localStorage se limita a la vista previa web.
function createAuthStorage(): AsyncStorage {
  if (Platform.OS === 'web') {
    return {
      getItem: async (key) => localStorage.getItem(key),
      setItem: async (key, value) => {
        localStorage.setItem(key, value)
      },
      removeItem: async (key) => {
        localStorage.removeItem(key)
      }
    }
  }
  return createChunkedStorage({
    getItem: (key) => SecureStore.getItemAsync(key),
    setItem: (key, value) =>
      SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
      }),
    removeItem: (key) => SecureStore.deleteItemAsync(key)
  })
}

export const authStorage = createAuthStorage()
