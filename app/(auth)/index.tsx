import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH, BookFan, PrimaryButton, Wordmark, alpha } from '../../src/features/auth/components';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Book fan hero */}
      <View style={styles.hero}>
        <BookFan />
      </View>

      {/* Bottom content */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Wordmark size={36} />
        <Text style={styles.tagline}>
          {'Tu vida lectora,\nen un solo lugar.'}
        </Text>
        <Text style={styles.subtitle}>
          Registra lo que lees, descubre tu próxima historia y compártela con otros lectores.
        </Text>

        <Link href="/(auth)/register" asChild>
          <PrimaryButton>Crear cuenta</PrimaryButton>
        </Link>

        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.loginBtn}>
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.loginAccent}>Iniciar sesión</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH.bg,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 8,
    position: 'relative',
    zIndex: 20,
  },
  tagline: {
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
    fontSize: 22,
    color: AUTH.text,
    lineHeight: 28,
    marginTop: 8,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    color: AUTH.t2,
    lineHeight: 20,
    marginBottom: 28,
    fontFamily: 'DMSans_400Regular',
  },
  loginBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 13,
    color: AUTH.t2,
    fontFamily: 'DMSans_400Regular',
  },
  loginAccent: {
    color: AUTH.accent,
    fontFamily: 'DMSans_600SemiBold',
  },
});
