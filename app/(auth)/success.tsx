import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, alpha } from '../../src/features/auth/components';
import { useColors } from '~/theme/colors';

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}
    >
      <View className="flex-1 items-center justify-center px-8">
        <View className="items-center justify-center mb-8 w-[136px] h-[136px]">
          <View
            className="absolute w-[136px] h-[136px] rounded-full"
            style={{ backgroundColor: alpha(c.success, 0.18) }}
          />
          <View
            className="w-24 h-24 rounded-full border-[1.5px] items-center justify-center"
            style={{
              backgroundColor: alpha(c.success, 0.15),
              borderColor: c.success,
            }}
          >
            <Text
              className="text-[40px] leading-[48px] text-success"
            >
              ✓
            </Text>
          </View>
        </View>

        <Text className="font-display-sb text-text text-center mb-3 text-2xl tracking-[-0.3px]">
          ¡Todo listo!
        </Text>
        <Text className="font-body text-t2 text-sm leading-[22px] text-center mb-9 max-w-[280px]">
          Tu contraseña ha sido actualizada. Ya puedes volver a iniciar sesión.
        </Text>

        <View className="w-full">
          <Link href="/(auth)/login" asChild>
            <PrimaryButton>Iniciar sesión</PrimaryButton>
          </Link>
        </View>
      </View>
    </View>
  );
}
