import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { useUpsertNotificationPreferences } from '~/features/user/hooks/useNotificationPreferences'

export async function registerPushToken(): Promise<string> {
  if (!Device.isDevice) return 'declined'

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

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as
    string | undefined
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
  return tokenData.data
}

export function useSavePushToken() {
  const upsert = useUpsertNotificationPreferences()

  async function savePushToken(token: string) {
    await upsert.mutateAsync({ push_token: token })
  }

  return { savePushToken }
}
