import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '~/stores/auth.store'
import {
  notificationPreferencesQueryOptions,
  upsertNotificationPreferencesFn
} from '~/features/user/user.queries'

// Pide el permiso nativo solo tras una acción explícita y registra un token en dispositivos compatibles.
export async function registerPushToken(): Promise<string> {
  if (Platform.OS === 'web' || !Device.isDevice) return 'declined'

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Lexa',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250]
    })
  }

  // Cast to any: PermissionResponse.granted exists at runtime but type declarations
  // in expo-notifications v56 have a mismatch with the expo package's PermissionResponse.
  const perms = (await Notifications.getPermissionsAsync()) as any
  if (!perms.granted) {
    const newPerms = (await Notifications.requestPermissionsAsync()) as any
    if (!newPerms.granted) return 'declined'
  }

  const projectId = (Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId) as string | undefined
  if (!projectId)
    throw new Error('Falta configurar el proyecto de notificaciones.')
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
  return tokenData.data
}

// Encadena el permiso y su persistencia para que la hoja contextual muestre un único resultado real.
export function usePushOptIn() {
  const userId = useAuthStore((state) => state.user?.id)
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (enable: boolean) => {
      if (!userId) throw new Error('Not authenticated')
      const token = enable ? await registerPushToken() : 'declined'
      await upsertNotificationPreferencesFn(userId, { push_token: token })
      return { enabled: token !== 'declined' }
    },
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: notificationPreferencesQueryOptions(userId ?? '').queryKey
      })
  })
}
