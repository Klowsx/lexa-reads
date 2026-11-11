import { useRouter } from 'expo-router'
import { ChevronLeft, ShieldOff } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar } from '~/components/ui/Avatar'
import { useBlockedUsers } from '~/features/user/hooks/useBlockedUsers'
import { useBlockUser } from '~/features/user/hooks/useBlockUser'
import type { BlockedUser } from '~/features/user/user.queries'
import { useColors } from '~/theme/colors'

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`
}

// Muestra un usuario bloqueado y permite confirmar su desbloqueo sin perder el contexto.
function BlockedUserRow({ item }: { item: BlockedUser }) {
  const { t } = useTranslation()
  const { unblock } = useBlockUser(item.blocked.id, item.blocked.username)

  function handleUnblock() {
    // Solicita confirmación antes de restaurar la posibilidad de interacción.
    Alert.alert(
      t('blocked.unblockTitle'),
      t('blocked.unblockConfirm', { username: item.blocked.username }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('blocked.unblock'), onPress: () => unblock.mutate() }
      ]
    )
  }

  return (
    <View className="flex-row items-center mx-5 my-2 p-4 gap-3 rounded-card bg-surface">
      <Avatar
        displayName={item.blocked.display_name ?? item.blocked.username}
        username={item.blocked.username}
        avatarUrl={item.blocked.avatar_url ?? undefined}
        size={48}
      />

      <View className="flex-1 min-w-0">
        <Text className="text-xs font-body-sb text-text" numberOfLines={1}>
          {item.blocked.display_name ?? item.blocked.username}
        </Text>
        <Text className="text-xs font-body text-t3 mt-0.5" numberOfLines={1}>
          @{item.blocked.username}
        </Text>
      </View>

      <Pressable
        onPress={handleUnblock}
        disabled={unblock.isPending}
        accessibilityRole="button"
        accessibilityLabel={t('blocked.unblockConfirm', {
          username: item.blocked.username
        })}
        accessibilityState={{ disabled: unblock.isPending }}
        className="min-h-12 justify-center px-3.5 py-2 rounded-md bg-sr"
      >
        <Text className="text-sm font-body-sb text-text">
          {t('blocked.unblock')}
        </Text>
      </Pressable>
    </View>
  )
}

// Presenta la lista protegida por RLS con estados claros de carga, error y vacío.
export default function BlockedUsersScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const c = useColors()
  const { t } = useTranslation()
  const { data: blocked = [], isLoading, isError, refetch } = useBlockedUsers()

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable
          className="h-12 w-12 items-center justify-center"
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">
          {t('blocked.title')}
        </Text>
      </View>

      <View className="mx-5 mt-5 mb-3 rounded-card bg-sr p-5 gap-2">
        <Text className="font-display-sb text-lg text-text">
          {t('settings.privacy')}
        </Text>
        <Text className="font-body text-sm text-t2 leading-6">
          {t('blocked.emptyBody')}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator color={c.accent} />
          <Text className="text-xs font-body text-t3">
            {t('common.loading')}
          </Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text
            accessibilityRole="alert"
            className="text-xs font-body text-t2 text-center"
          >
            {t('blocked.loadError')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            accessibilityRole="button"
            className="min-h-12 px-4 rounded-md bg-accent items-center justify-center"
          >
            <Text
              className="text-xs font-body-sb"
              style={{ color: c.onAccent }}
            >
              {t('common.retry')}
            </Text>
          </Pressable>
        </View>
      ) : blocked.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <View
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: alpha(c.t3, 0.1) }}
          >
            <ShieldOff size={24} color={c.t3} strokeWidth={1.5} />
          </View>
          <Text className="text-sm font-body-sb text-text text-center">
            {t('blocked.empty')}
          </Text>
          <Text className="text-xs font-body text-t3 text-center leading-[20px]">
            {t('blocked.emptyBody')}
          </Text>
        </View>
      ) : (
        <>
          {blocked.length > 0 && (
            <Text className="text-xs font-body text-t3 px-4 pt-3 pb-1">
              {t('blocked.count', { count: blocked.length })}
            </Text>
          )}
          <FlashList
            data={blocked}
            renderItem={({ item }) => <BlockedUserRow item={item} />}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </>
      )}
    </View>
  )
}
