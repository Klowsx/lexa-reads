import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookFan, PrimaryButton, Wordmark } from '../../src/features/auth/components';
import { useColors } from '@/src/lib/colors';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-1 items-center justify-center">
        <BookFan />
      </View>

      <View
        className="px-7 pt-2 relative z-20"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <Wordmark size={36} />
        <Text className="font-display-i text-text mt-2 mb-[10px]" style={{ fontSize: 22, lineHeight: 28 }}>
          {'Tu vida lectora,\nen un solo lugar.'}
        </Text>
        <Text className="font-body text-t2 text-sm mb-7" style={{ lineHeight: 20 }}>
          Registra lo que lees, descubre tu próxima historia y compártela con otros lectores.
        </Text>

        <Link href="/(auth)/register" asChild>
          <PrimaryButton>Crear cuenta</PrimaryButton>
        </Link>

        <Link href="/(auth)/login" asChild>
          <Pressable className="w-full py-[14px] items-center">
            <Text className="font-body text-t2 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Text className="font-body-sb" style={{ color: c.accent }}>Iniciar sesión</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
