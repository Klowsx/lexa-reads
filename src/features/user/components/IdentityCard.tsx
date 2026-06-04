import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { Avatar } from '~/components/ui/Avatar';
import { getAvatarColor } from '~/lib/avatar';
import type { UserProfile } from '~/types/user';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

interface Props {
  user: UserProfile;
  onEditPress: () => void;
}

export function IdentityCard({ user, onEditPress }: Props) {
  const { t } = useTranslation();
  const color = getAvatarColor(user.username);

  return (
    <View
      className="mx-4 mb-5 rounded-lg overflow-hidden border"
      style={{ borderColor: alpha(color, 0.22) }}
    >
      <LinearGradient
        colors={[alpha(color, 0.1), alpha(color, 0.04)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-4"
      >
        <View className="flex-row gap-3.5 items-start mb-4">
          <View
            style={{
              shadowColor: color,
              shadowOpacity: 0.3,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 0 },
              elevation: 6,
            }}
          >
            <Avatar
              displayName={user.display_name}
              username={user.username}
              avatarUrl={user.avatar_url}
              size={72}
            />
          </View>

          <View className="flex-1 pt-1">
            <Text className="text-md font-body-sb text-text leading-tight">
              {user.display_name}
            </Text>
            <Text className="text-sm font-body text-t2 mt-1">@{user.username}</Text>
            {user.bio ? (
              <Text className="text-xs font-body text-t3 mt-2">{user.bio}</Text>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={onEditPress}
          className="py-2.5 rounded-xl items-center border"
          style={({ pressed }) => ({
            backgroundColor: pressed ? alpha(color, 0.08) : alpha(color, 0.05),
            borderColor: alpha(color, 0.22),
          })}
        >
          <Text className="text-xs font-body-md text-text">{t('editProfile.title')}</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}
