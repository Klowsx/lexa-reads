import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useColors } from '~/theme/colors';
import type { MockList } from '~/mock';

interface Props {
  lists: MockList[];
  onNewList?: () => void;
  onPress?: (list: MockList) => void;
  title?: string;
}

export function ProfileLists({ lists, onNewList, onPress, title = 'Mis listas' }: Props) {
  const c = useColors();

  return (
    <View className="px-4 pb-7">
      <View className="flex-row justify-between items-baseline mb-2.5">
        <Text className="font-body-sb text-xs text-t3 tracking-widest uppercase">
          {title}
        </Text>
        {onNewList && (
          <Pressable onPress={onNewList} hitSlop={6}>
            <Text className="text-xs font-body-sb text-accent">+ Nueva</Text>
          </Pressable>
        )}
      </View>

      <View className="gap-2">
        {lists.map((list) => (
          <Pressable
            key={list.id}
            onPress={() => onPress?.(list)}
            className="flex-row items-center gap-3 px-3.5 py-3 rounded-md border border-border bg-surface"
            style={({ pressed }) => ({ backgroundColor: pressed ? c.sh : c.surface })}
          >
            <View
              className="shrink-0 rounded-sm"
              style={{ width: 3.5, height: 36, backgroundColor: list.col, opacity: 0.85 }}
            />
            <View className="flex-1 min-w-0">
              <Text className="text-sm font-body-sb text-text">{list.name}</Text>
              <Text className="text-xs font-body text-t3 mt-0.5">
                {list.count} libros · {list.visibility}
              </Text>
            </View>
            <ChevronRight size={16} color={c.t3} strokeWidth={1.6} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
