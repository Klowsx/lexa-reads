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
              className={active ? 'font-body-sb text-sm' : 'font-body-sb text-sm text-t3'}
              style={{
                color: active ? meta.color : undefined,
              }}
            >
              {countByStatus[status]}
            </Text>
            <Text
              className={active ? 'font-body-sb text-xs' : 'font-body text-xs text-t3'}
              style={{
                color: active ? meta.color : undefined,
              }}
            >
              {shortLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
