import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Lock, MoreHorizontal, UserMinus, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '~/components/ui/Avatar';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { ProfileLists } from '~/features/user/components/ProfileLists';
import { ProfileStats } from '~/features/user/components/ProfileStats';
import { RecentReads } from '~/features/user/components/RecentReads';
import { ReportSheet } from '~/features/user/components/ReportSheet';
import { FULL_USERS, MOCK_LISTS, MY_BOOKS, type MockBook } from '~/mock';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

// ─── Privacy gate ─────────────────────────────────────────────

function PrivacyGate({
  username,
  onFollow,
}: {
  username: string;
  onFollow: () => void;
}) {
  const c = useColors();

  return (
    <View className="items-center px-10 py-12 gap-4">
      <View
        className="w-16 h-16 rounded-full items-center justify-center"
        style={{
          backgroundColor: alpha(c.t3, 0.1),
          borderWidth: 1.5,
          borderColor: alpha(c.t3, 0.2),
        }}
      >
        <Lock size={26} color={c.t3} strokeWidth={1.5} />
      </View>

      <View className="items-center gap-1.5">
        <Text className="text-sm font-body-sb text-text">Perfil privado</Text>
        <Text className="text-xs font-body text-t3 text-center leading-[20px]">
          Sigue a @{username} para ver su biblioteca, reseñas y listas.
        </Text>
      </View>

      <Pressable
        onPress={onFollow}
        className="flex-row items-center gap-2 px-5 py-2.5 rounded-full"
        style={({ pressed }) => ({
          backgroundColor: pressed ? alpha(c.accent, 0.85) : c.accent,
        })}
      >
        <UserPlus size={14} color="#fff" strokeWidth={2} />
        <Text className="text-xs font-body-sb" style={{ color: '#fff' }}>
          Seguir
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const user = FULL_USERS.find((u) => u.username === username) ?? FULL_USERS[0];

  const [following, setFollowing] = useState(false);
  const [selectedBook, setSelectedBook] = useState<MockBook | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [blocked, setBlocked] = useState(false);

  // Contenido visible: siempre si es pública, solo si sigues si es privada
  const contentVisible = !user.isPrivate || following;

  const recentReads = MY_BOOKS.filter((b) => b.status === 'read').slice(0, 4);

  function openMenu() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Reportar usuario', blocked ? 'Desbloquear' : 'Bloquear usuario'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) setShowReport(true);
          if (index === 2) {
            setBlocked((b) => !b);
            if (!blocked) router.back();
          }
        }
      );
    } else {
      Alert.alert(`@${user.username}`, undefined, [
        { text: 'Reportar usuario',                    onPress: () => setShowReport(true) },
        { text: blocked ? 'Desbloquear' : 'Bloquear', style: 'destructive', onPress: () => { setBlocked((b) => !b); if (!blocked) router.back(); } },
        { text: 'Cancelar',                            style: 'cancel' },
      ]);
    }
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <View className="flex-1 flex-row items-center gap-1.5 min-w-0">
          <Text className="font-body-md text-sm text-t2" numberOfLines={1}>
            @{user.username}
          </Text>
          {user.isPrivate && (
            <Lock size={12} color={c.t3} strokeWidth={1.8} />
          )}
        </View>
        <Pressable hitSlop={8} onPress={openMenu}>
          <MoreHorizontal size={20} color={c.t3} strokeWidth={1.6} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Identity card */}
        <View
          className="mx-4 mt-4 mb-5 rounded-lg overflow-hidden border"
          style={{ borderColor: alpha(user.avC, 0.22) }}
        >
          <LinearGradient
            colors={[alpha(user.avC, 0.1), alpha(c.border, 0.3)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-4"
          >
            <View className="flex-row gap-3.5 items-start mb-4">
              <Avatar user={user} size={72} />
              <View className="flex-1 pt-1">
                <Text className="text-md font-body-sb text-text leading-tight">{user.name}</Text>
                <Text className="text-sm font-body text-t2 mt-1">@{user.username}</Text>
                {user.isPrivate && (
                  <View className="flex-row items-center gap-1 mt-1">
                    <Lock size={10} color={c.t3} strokeWidth={2} />
                    <Text className="text-xs font-body text-t3">Perfil privado</Text>
                  </View>
                )}
                <Text className="text-xs font-body text-t3 mt-2">{user.bio}</Text>
              </View>
            </View>

            {/* Follow button */}
            <Pressable
              onPress={() => setFollowing((f) => !f)}
              className="py-2.5 rounded-xl items-center border flex-row justify-center gap-2"
              style={({ pressed }) => ({
                backgroundColor: following
                  ? alpha(c.text, 0.05)
                  : pressed
                  ? alpha(user.avC, 0.85)
                  : user.avC,
                borderColor: following ? alpha(user.avC, 0.22) : user.avC,
              })}
            >
              {following ? (
                <UserMinus size={14} color={c.t2} strokeWidth={2} />
              ) : (
                <UserPlus size={14} color="#fff" strokeWidth={2} />
              )}
              <Text
                className="text-xs font-body-sb"
                style={{ color: following ? c.t2 : '#fff' }}
              >
                {following ? 'Siguiendo' : 'Seguir'}
              </Text>
            </Pressable>
          </LinearGradient>
        </View>

        {/* Stats — siempre visibles, pero los taps están desactivados si el contenido está bloqueado */}
        <ProfileStats
          books={user.books}
          reviews={user.reviews}
          followers={user.followers}
          following={user.following}
          onPressReviews={
            contentVisible
              ? () => router.push({ pathname: '/user-reviews/[username]', params: { username: user.username } } as any)
              : undefined
          }
          onPressFollowers={() =>
            router.push(`/followers?username=${user.username}&tab=followers` as any)
          }
          onPressFollowing={() =>
            router.push(`/followers?username=${user.username}&tab=following` as any)
          }
        />

        {/* Contenido — bloqueado si cuenta privada y no sigues */}
        {contentVisible ? (
          <>
            <RecentReads books={recentReads} onPress={setSelectedBook} />

            <ProfileLists
              lists={MOCK_LISTS.filter((l) => l.visibility === 'Pública')}
              title="Listas públicas"
              onPress={(list) =>
                router.push({ pathname: '/list/[slug]', params: { slug: list.id } } as any)
              }
            />
          </>
        ) : (
          <PrivacyGate
            username={user.username}
            onFollow={() => setFollowing(true)}
          />
        )}
      </ScrollView>

      {selectedBook && (
        <BookDetailSheet book={selectedBook as any} onClose={() => setSelectedBook(null)} />
      )}

      {showReport && (
        <ReportSheet
          target="user"
          targetName={`@${user.username}`}
          onClose={() => setShowReport(false)}
        />
      )}
    </View>
  );
}
