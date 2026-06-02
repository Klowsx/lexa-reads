import { Pressable, Text, View } from 'react-native';
import { Avatar } from '~/components/ui/Avatar';
import { MockBookCover } from '~/components/ui/MockBookCover';
import type { MockNotification } from '~/mock';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const ACTION_TEXT: Record<MockNotification['type'], string> = {
  new_follower:      'empezó a seguirte',
  liked_review:      'le dio me gusta a tu reseña de',
  commented_review:  'comentó en tu reseña de',
  liked_activity:    'le dio me gusta a tu actividad',
};

interface Props {
  item: MockNotification;
  onPress?: () => void;
}

export function NotificationItem({ item, onPress }: Props) {
  const c = useColors();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start px-4 py-3.5 gap-3"
      style={{
        backgroundColor: item.read ? 'transparent' : alpha(c.accent, 0.06),
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      }}
    >
      {/* Unread dot */}
      {!item.read && (
        <View
          className="absolute left-1.5 top-1/2"
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: c.accent,
            marginTop: -3,
          }}
        />
      )}

      <Avatar displayName={item.user.name} username={item.user.username} size={40} />

      <View className="flex-1 min-w-0 pt-0.5">
        <Text className="text-xs font-body text-text leading-[19px]" numberOfLines={2}>
          <Text className="font-body-sb">{item.user.name} </Text>
          <Text className="text-t2">{ACTION_TEXT[item.type]}</Text>
          {item.book && (
            <Text className="font-display-i text-text"> "{item.book.title}"</Text>
          )}
        </Text>
        <Text className="text-xs font-body text-t3 mt-0.5">{item.time}</Text>
      </View>

      {item.book && (
        <MockBookCover book={item.book} width={32} height={48} />
      )}
    </Pressable>
  );
}
