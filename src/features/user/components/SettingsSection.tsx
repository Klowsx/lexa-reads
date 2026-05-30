import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface Props {
  title: string;
  children: ReactNode;
}

export function SettingsSection({ title, children }: Props) {
  return (
    <View style={{ marginTop: 22 }}>
      <Text
        className="text-xs font-body-sb text-t3 tracking-widest px-4"
        style={{ textTransform: 'uppercase', marginBottom: 7 }}
      >
        {title}
      </Text>
      <View className="mx-4 rounded-md border border-border bg-surface overflow-hidden">
        {children}
      </View>
    </View>
  );
}
