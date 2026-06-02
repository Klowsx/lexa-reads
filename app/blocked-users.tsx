import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldOff } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '~/components/ui/Avatar';
import { BLOCKED_USERS, type MockUser } from '~/mock';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

function BlockedUserRow({
  user,
  onUnblock,
}: {
  user: MockUser;
  onUnblock: (id: string) => void;
}) {
  const c = useColors();

  function handleUnblock() {
    Alert.alert(
      'Desbloquear usuario',
      `¿Desbloquear a @${user.username}? Podrá volver a ver tu perfil y seguirte.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desbloquear', onPress: () => onUnblock(user.id) },
      ]
    );
  }

  return (
    <View
      className="flex-row items-center px-4 py-3.5 gap-3"
      style={{ borderBottomWidth: 1, borderBottomColor: c.border }}
    >
      <Avatar displayName={user.name} username={user.username} size={44} />

      <View className="flex-1 min-w-0">
        <Text className="text-xs font-body-sb text-text" numberOfLines={1}>
          {user.name}
        </Text>
        <Text className="text-xs font-body text-t3 mt-0.5" numberOfLines={1}>
          @{user.username}
        </Text>
      </View>

      <Pressable
        onPress={handleUnblock}
        className="px-3.5 py-2 rounded-full border"
        style={{
          backgroundColor: alpha(c.error, 0.07),
          borderColor: alpha(c.error, 0.25),
        }}
      >
        <Text className="text-xs font-body-sb" style={{ color: c.error }}>
          Desbloquear
        </Text>
      </Pressable>
    </View>
  );
}

export default function BlockedUsersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useColors();
  const [blocked, setBlocked] = useState(BLOCKED_USERS);

  function unblock(id: string) {
    setBlocked((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">
          Usuarios bloqueados
        </Text>
      </View>

      {blocked.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <View
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: alpha(c.t3, 0.1) }}
          >
            <ShieldOff size={24} color={c.t3} strokeWidth={1.5} />
          </View>
          <Text className="text-sm font-body-sb text-text text-center">
            Sin usuarios bloqueados
          </Text>
          <Text className="text-xs font-body text-t3 text-center leading-[20px]">
            Los usuarios que bloquees aparecerán aquí. Podrán seguir usando la app, pero no podrán interactuar contigo.
          </Text>
        </View>
      ) : (
        <>
          <Text className="text-xs font-body text-t3 px-4 pt-3 pb-1">
            {blocked.length} {blocked.length === 1 ? 'usuario bloqueado' : 'usuarios bloqueados'}
          </Text>
          <FlashList
            data={blocked}
            renderItem={({ item }) => (
              <BlockedUserRow user={item} onUnblock={unblock} />
            )}
            keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </>
      )}
    </View>
  );
}
