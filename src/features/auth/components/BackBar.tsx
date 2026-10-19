import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useColors } from '~/theme/colors';

type Props = {
  onBack: () => void;
  label?: string;
  right?: React.ReactNode;
};

// Muestra una barra de regreso con un objetivo táctil accesible y alineación estable.
export function BackBar({ onBack, label, right }: Props) {
  const c = useColors();

  return (
    <View className="flex-row items-center justify-between px-4 py-2 shrink-0">
      <Pressable
        onPress={onBack}
        className="w-11 h-11 -ml-1.5 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Volver"
      >
        <ChevronLeft size={22} color={c.text} strokeWidth={1.8} />
      </Pressable>
      {label && <Text className="text-sm text-text font-body-sb">{label}</Text>}
      <View className="w-11 items-end">{right ?? null}</View>
    </View>
  );
}
