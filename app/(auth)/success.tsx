import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH, PrimaryButton, alpha } from '../../src/features/auth/components';

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.center}>
        {/* Success icon with glow */}
        <View style={styles.iconContainer}>
          <View style={styles.glow} />
          <View style={styles.iconCircle}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </View>

        <Text style={styles.title}>¡Todo listo!</Text>
        <Text style={styles.subtitle}>
          Tu contraseña ha sido actualizada. Ya puedes volver a iniciar sesión.
        </Text>

        <View style={styles.btnWrapper}>
          <Link href="/(auth)/login" asChild>
            <PrimaryButton>Iniciar sesión</PrimaryButton>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
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
    backgroundColor: alpha('#5CAF7E', 0.18),
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: alpha('#5CAF7E', 0.15),
    borderWidth: 1.5,
    borderColor: '#5CAF7E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 40,
    color: '#5CAF7E',
    lineHeight: 48,
  },
  title: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 28,
    color: AUTH.text,
    lineHeight: 34,
    letterSpacing: -0.3,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: AUTH.t2,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 36,
    maxWidth: 280,
    fontFamily: 'DMSans_400Regular',
  },
  btnWrapper: {
    width: '100%',
  },
});
