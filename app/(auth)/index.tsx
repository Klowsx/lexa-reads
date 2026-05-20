import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookFan, PrimaryButton, Wordmark } from '../../src/features/auth/components';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

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
        <Text className="font-display-i text-text text-xl mt-2 mb-2.5">
          {'Tu vida lectora,\nen un solo lugar.'}
        </Text>
        <Text className="font-body text-t2 text-sm leading-5 mb-7">
          Registra lo que lees, descubre tu próxima historia y compártela con otros lectores.
        </Text>

        <Link href="/(auth)/register" asChild>
          <PrimaryButton>Crear cuenta</PrimaryButton>
        </Link>

        <Link href="/(auth)/login" asChild>
          <Pressable className="w-full py-3.5 items-center">
            <Text className="font-body text-t2 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Text className="font-body-sb text-accent">Iniciar sesión</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
