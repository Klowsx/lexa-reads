import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, alpha } from '../../src/features/auth/components';
import { useColors } from '@/src/lib/colors';

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}
    >
      <View className="flex-1 items-center justify-center px-8">
        <View style={styles.iconContainer}>
          <View style={[styles.glow, { backgroundColor: alpha(c.success, 0.18) }]} />
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: alpha(c.success, 0.15), borderColor: c.success },
            ]}
          >
            <Text style={[styles.checkmark, { color: c.success }]}>✓</Text>
          </View>
        </View>

        <Text
          className="font-display-sb text-text text-center mb-3 text-2xl"
          style={{ lineHeight: 34, letterSpacing: -0.3 }}
        >
          ¡Todo listo!
        </Text>
        <Text
          className="font-body text-t2 text-center mb-9"
          style={{ fontSize: 14, lineHeight: 22, maxWidth: 280 }}
        >
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

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    width: 136,
    height: 136,
  },
  glow: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 40,
    lineHeight: 48,
  },
});
