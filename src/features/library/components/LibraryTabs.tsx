import { Pressable, Text, View } from 'react-native';
import { type BookStatus, STATUS_META } from '~/lib/book-status';

const TABS: { status: BookStatus; shortLabel: string }[] = [
  { status: 'reading',      shortLabel: 'Leyendo'  },
  { status: 'read',         shortLabel: 'Leídos'   },
  { status: 'want_to_read', shortLabel: 'Por leer' },
  { status: 'abandoned',    shortLabel: 'Abandon.' },
];

interface Props {
  activeTab: BookStatus;
  countByStatus: Record<BookStatus, number>;
  onTabChange: (status: BookStatus) => void;
}

export function LibraryTabs({ activeTab, countByStatus, onTabChange }: Props) {
  return (
    <View className="flex-row border-b border-border">
      {TABS.map(({ status, shortLabel }) => {
        const meta = STATUS_META[status];
        const active = activeTab === status;

        return (
          <Pressable
            key={status}
            onPress={() => onTabChange(status)}
            className="flex-1 items-center py-2"
            style={{
              borderBottomWidth: 2,
              borderBottomColor: active ? meta.color : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'DMSans_600SemiBold',
                color: active ? meta.color : undefined,
              }}
              className={active ? '' : 'text-t3'}
            >
              {countByStatus[status]}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: active ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                color: active ? meta.color : undefined,
              }}
              className={active ? '' : 'text-t3'}
            >
              {shortLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
