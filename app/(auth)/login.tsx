import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AUTH,
  AuthField,
  BackBar,
  GhostButton,
  PrimaryButton,
  alpha,
} from '../../src/features/auth/components';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('javier@email.com');
  const [password, setPassword] = useState('••••••••');
  const [showPw, setShowPw] = useState(false);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BackBar onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{'Bienvenido\nde vuelta'}</Text>
          <Text style={styles.subtitle}>Continúa donde lo dejaste.</Text>
        </View>

        {/* Fields */}
        <AuthField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Mail size={16} color={AUTH.t3} />}
        />
        <AuthField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry={!showPw}
          icon={<Lock size={16} color={AUTH.t3} />}
          trailing={
            <Pressable onPress={() => setShowPw(!showPw)} hitSlop={8}>
              {showPw ? <EyeOff size={16} color={AUTH.t3} /> : <Eye size={16} color={AUTH.t3} />}
            </Pressable>
          }
        />

        <View style={styles.forgotRow}>
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          </Link>
        </View>

        <PrimaryButton>Iniciar sesión</PrimaryButton>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o continúa con</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social */}
        <View style={styles.socialRow}>
          <GhostButton>
            <Text style={styles.socialIcon}></Text>
            <Text style={styles.socialLabel}>Apple</Text>
          </GhostButton>
          <View style={{ width: 10 }} />
          <GhostButton>
            <GoogleIcon />
            <Text style={styles.socialLabel}>Google</Text>
          </GhostButton>
        </View>

        <View style={{ flex: 1 }} />

        <Link href="/(auth)/register" asChild>
          <Pressable style={styles.registerBtn}>
            <Text style={styles.registerText}>
              ¿No tienes cuenta?{' '}
              <Text style={styles.registerAccent}>Crear una</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function GoogleIcon() {
  return (
    <View style={googleStyles.svg}>
      <View style={[googleStyles.quarter, { backgroundColor: '#4285F4', top: 0, left: '50%' }]} />
      <View style={[googleStyles.quarter, { backgroundColor: '#34A853', bottom: 0, left: '50%' }]} />
      <View style={[googleStyles.quarter, { backgroundColor: '#FBBC04', bottom: 0, left: 0 }]} />
      <View style={[googleStyles.quarter, { backgroundColor: '#EA4335', top: 0, left: 0 }]} />
      <View style={googleStyles.hole} />
    </View>
  );
}

const googleStyles = StyleSheet.create({
  svg: {
    width: 14,
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative',
  },
  quarter: {
    position: 'absolute',
    width: '50%',
    height: '50%',
  },
  hole: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: AUTH.surface,
    top: 3.5,
    left: 3.5,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 28,
    color: AUTH.text,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: AUTH.t2,
    marginTop: 10,
    fontFamily: 'DMSans_400Regular',
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -4,
    marginBottom: 22,
  },
  forgotText: {
    color: AUTH.accent,
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AUTH.border,
  },
  dividerText: {
    fontSize: 11,
    color: AUTH.t3,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    fontFamily: 'DMSans_400Regular',
  },
  socialRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  socialIcon: {
    fontSize: 16,
  },
  socialLabel: {
    fontSize: 14,
    color: AUTH.text,
    fontFamily: 'DMSans_500Medium',
  },
  registerBtn: {
    paddingTop: 18,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 13,
    color: AUTH.t2,
    fontFamily: 'DMSans_400Regular',
  },
  registerAccent: {
    color: AUTH.accent,
    fontFamily: 'DMSans_600SemiBold',
  },
});
