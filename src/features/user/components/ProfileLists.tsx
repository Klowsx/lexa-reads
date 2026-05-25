import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useColors } from '~/theme/colors';
import type { MockList } from '~/mock';

interface Props {
  lists: MockList[];
}

export function ProfileLists({ lists }: Props) {
  const c = useColors();

  return (
    <View className="px-4">
      <Text
        className="text-xs text-t3 tracking-widest mb-2.5"
        style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
      >
        Mis listas
      </Text>
      {lists.map((list) => (
        <Pressable
          key={list.name}
          className="flex-row items-center justify-between px-3.5 py-3 bg-surface rounded-md border border-border mb-2"
        >
          <View>
            <Text className="text-sm font-body-sb text-text">{list.name}</Text>
            <Text className="text-xs font-body text-t3 mt-0.5">
              {list.count} libros · {list.visibility}
            </Text>
          </View>
          <ChevronRight size={16} color={c.t3} strokeWidth={1.6} />
        </Pressable>
      ))}
    </View>
  );
}
