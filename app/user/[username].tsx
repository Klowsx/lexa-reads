import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Lock, MoreHorizontal, UserMinus, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '~/components/ui/Avatar';
import { useQuery } from '@tanstack/react-query';
import { ProfileLists } from '~/features/user/components/ProfileLists';
import { ProfileStats } from '~/features/user/components/ProfileStats';
import { RecentReads } from '~/features/user/components/RecentReads';
import { ReportSheet } from '~/features/user/components/ReportSheet';
import { useBlockUser } from '~/features/user/hooks/useBlockUser';
import { useFollow } from '~/features/user/hooks/useFollow';
import { useProfile } from '~/features/user/hooks/useProfile';
import { userRecentReadsQueryOptions } from '~/features/user/user.queries';
import { getAvatarColor } from '~/lib/avatar';
import { cn } from '~/lib/utils';
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
        className="flex-row items-center gap-2 px-5 py-2.5 rounded-full bg-accent"
      >
        <UserPlus size={14} color="#fff" strokeWidth={2} />
        <Text className="text-xs font-body-sb text-white">Seguir</Text>
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

  const { data: profile, isLoading } = useProfile(username);
  const { data: recentReads = [] } = useQuery(
    userRecentReadsQueryOptions(profile?.id ?? ''),
  );

  const { follow, unfollow } = useFollow(
    profile?.id ?? '',
    username,
    profile?.is_private ?? false,
  );

  const { block, unblock } = useBlockUser(
    profile?.id ?? '',
    username,
  );

  const [showReport, setShowReport] = useState(false);

  const blocked = profile?.is_blocked_by_me ?? false;
  const followStatus = profile?.follow_status ?? null;
  const isFollowing = followStatus === 'accepted';
  const isPending = followStatus === 'pending';
  const color = profile ? getAvatarColor(profile.username) : c.accent;
  const contentVisible = !profile?.is_private || isFollowing;

  function handleFollow() {
    if (isFollowing || isPending) {
      unfollow.mutate();
    } else {
      follow.mutate();
    }
  }

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
            if (blocked) {
              unblock.mutate();
            } else {
              block.mutate(undefined, { onSuccess: () => router.back() });
            }
          }
        },
      );
    } else {
      Alert.alert(`@${username}`, undefined, [
        { text: 'Reportar usuario', onPress: () => setShowReport(true) },
        {
          text: blocked ? 'Desbloquear' : 'Bloquear',
          style: 'destructive',
          onPress: () => {
            if (blocked) {
              unblock.mutate();
            } else {
              block.mutate(undefined, { onSuccess: () => router.back() });
            }
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
          </Pressable>
          <Text className="font-body-md text-sm text-t2">@{username}</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accent} />
        </View>
      </View>
    );
  }

  if (!profile) return null;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <View className="flex-1 flex-row items-center gap-1.5 min-w-0">
          <Text className="font-body-md text-sm text-t2" numberOfLines={1}>
            @{profile.username}
          </Text>
          {profile.is_private && (
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
          style={{ borderColor: alpha(color, 0.22) }}
        >
          <LinearGradient
            colors={[alpha(color, 0.1), alpha(color, 0.04)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-4"
          >
            <View className="flex-row gap-3.5 items-start mb-4">
              <Avatar
                displayName={profile.display_name}
                username={profile.username}
                avatarUrl={profile.avatar_url}
                size={72}
              />
              <View className="flex-1 pt-1">
                <Text className="text-md font-body-sb text-text leading-tight">
                  {profile.display_name}
                </Text>
                <Text className="text-sm font-body text-t2 mt-1">
                  @{profile.username}
                </Text>
                {profile.is_private && (
                  <View className="flex-row items-center gap-1 mt-1">
                    <Lock size={10} color={c.t3} strokeWidth={2} />
                    <Text className="text-xs font-body text-t3">Perfil privado</Text>
                  </View>
                )}
                {profile.bio ? (
                  <Text className="text-xs font-body text-t3 mt-2">{profile.bio}</Text>
                ) : null}
              </View>
            </View>

            {/* Follow button */}
            <Pressable
              onPress={handleFollow}
              disabled={follow.isPending || unfollow.isPending}
              className="py-2.5 rounded-xl items-center border flex-row justify-center gap-2"
              style={({ pressed }) => ({
                backgroundColor:
                  isFollowing || isPending
                    ? alpha(c.text, 0.05)
                    : pressed
                      ? alpha(color, 0.85)
                      : color,
                borderColor:
                  isFollowing || isPending ? alpha(color, 0.22) : color,
              })}
            >
              {isFollowing ? (
                <UserMinus size={14} color={c.t2} strokeWidth={2} />
              ) : (
                <UserPlus
                  size={14}
                  color={isPending ? c.t2 : '#fff'}
                  strokeWidth={2}
                />
              )}
              <Text
                className={cn("text-xs font-body-sb", isFollowing || isPending ? "text-t2" : "text-white")}
              >
                {isFollowing
                  ? 'Siguiendo'
                  : isPending
                    ? 'Solicitud enviada'
                    : 'Seguir'}
              </Text>
            </Pressable>
          </LinearGradient>
        </View>

        <ProfileStats
          books={profile.books_read_count ?? 0}
          reviews={profile.reviews_count ?? 0}
          followers={profile.followers_count ?? 0}
          following={profile.following_count ?? 0}
          onPressReviews={
            contentVisible
              ? () =>
                  router.push({
                    pathname: '/user-reviews/[username]',
                    params: { username: profile.username },
                  } as any)
              : undefined
          }
          onPressFollowers={() =>
            router.push(
              `/followers?username=${profile.username}&tab=followers` as any,
            )
          }
          onPressFollowing={() =>
            router.push(
              `/followers?username=${profile.username}&tab=following` as any,
            )
          }
        />

        {contentVisible ? (
          <>
            <RecentReads books={recentReads} />

            <ProfileLists
              lists={[]}
              title="Listas públicas"
              onPress={(list) =>
                router.push({
                  pathname: '/list/[slug]',
                  params: { slug: list.id },
                } as any)
              }
            />
          </>
        ) : (
          <PrivacyGate
            username={profile.username}
            onFollow={handleFollow}
          />
        )}
      </ScrollView>

      {showReport && (
        <ReportSheet
          targetType="user"
          targetId={profile.id}
          targetName={`@${profile.username}`}
          onClose={() => setShowReport(false)}
        />
      )}
    </View>
  );
}
