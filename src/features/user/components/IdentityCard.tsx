import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import type { MockMe } from '~/mock';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

interface Props {
  user: MockMe;
  onEditPress: () => void;
}

export function IdentityCard({ user, onEditPress }: Props) {
  const c = useColors();

  return (
    <View
      className="mx-4 mb-5 rounded-lg overflow-hidden border"
      style={{ borderColor: alpha(user.avC, 0.22) }}
    >
      <LinearGradient
        colors={[alpha(user.avC, 0.1), alpha(c.border, 0.3)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 16 }}
      >
        <View className="flex-row gap-3.5 items-start mb-4">
          <View
            className="rounded-full items-center justify-center shrink-0"
            style={{
              width: 72,
              height: 72,
              backgroundColor: alpha(user.avC, 0.13),
              borderWidth: 2.5,
              borderColor: user.avC,
              shadowColor: user.avC,
              shadowOpacity: 0.3,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 0 },
              elevation: 6,
            }}
          >
            <Text style={{ fontSize: 26, color: user.avC, fontFamily: 'DMSans_600SemiBold' }}>
              {user.av}
            </Text>
          </View>

          <View className="flex-1 pt-1">
            <Text className="text-md font-body-sb text-text leading-tight">{user.name}</Text>
            <Text className="text-sm font-body text-t2 mt-1">@{user.username}</Text>
            <Text className="text-xs font-body text-t3 mt-2">{user.bio}</Text>
          </View>
        </View>

        <Pressable
          onPress={onEditPress}
          className="py-2.5 rounded-xl items-center border"
          style={({ pressed }) => ({
            backgroundColor: pressed ? alpha(user.avC, 0.08) : alpha(c.text, 0.05),
            borderColor: alpha(user.avC, 0.22),
          })}
        >
          <Text className="text-xs font-body-md text-text">Editar perfil</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}
