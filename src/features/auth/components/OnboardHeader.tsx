import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useColors } from '~/theme/colors';

type Props = {
  step: number;
  total: number;
  onBack?: () => void;
  allowSkip?: boolean;
  onSkip?: () => void;
};

// Presenta el progreso del onboarding sin mostrar acciones que no estén implementadas.
export function OnboardHeader({ step, total, onBack, allowSkip = true, onSkip }: Props) {
  const c = useColors();
  const canSkip = allowSkip && Boolean(onSkip);

  return (
    <View className="flex-row items-center justify-between px-4 py-2 flex-shrink-0">
      {onBack ? (
        <Pressable
          onPress={onBack}
          className="w-11 h-11 -ml-1.5 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Volver al paso anterior"
        >
          <ChevronLeft size={22} color={c.text} strokeWidth={1.8} />
        </Pressable>
      ) : (
        <View className="w-11" />
      )}
      <Text className="font-body-sb text-xs text-t3 uppercase tracking-wide">
        Paso {step} de {total}
      </Text>
      {canSkip ? (
        <Pressable
          onPress={onSkip}
          className="min-h-11 justify-center"
          accessibilityRole="button"
          accessibilityLabel="Saltar onboarding"
        >
          <Text className="font-body-md text-t2 text-sm">Saltar</Text>
        </Pressable>
      ) : (
        <View className="w-11" />
      )}
    </View>
  );
}
