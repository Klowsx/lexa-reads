import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AuthField,
  BackBar,
  GhostButton,
  PrimaryButton,
} from '../../src/features/auth/components';
import { useColors } from '@/src/lib/colors';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [email, setEmail] = useState('javier@email.com');
  const [password, setPassword] = useState('••••••••');
  const [showPw, setShowPw] = useState(false);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BackBar onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-7">
          <Text className="font-serif-sb text-text text-2xl" style={{ lineHeight: 34, letterSpacing: -0.3 }}>
            {'Bienvenido\nde vuelta'}
          </Text>
          <Text className="font-sans text-t2 text-sm mt-[10px]">Continúa donde lo dejaste.</Text>
        </View>

        <AuthField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Mail size={16} color={c.t3} />}
        />
        <AuthField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry={!showPw}
          icon={<Lock size={16} color={c.t3} />}
          trailing={
            <Pressable onPress={() => setShowPw(!showPw)} hitSlop={8}>
              {showPw ? <EyeOff size={16} color={c.t3} /> : <Eye size={16} color={c.t3} />}
            </Pressable>
          }
        />

        <View className="items-end -mt-1 mb-[22px]">
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable>
              <Text className="font-sans-medium text-xs" style={{ color: c.accent }}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          </Link>
        </View>

        <PrimaryButton>Iniciar sesión</PrimaryButton>

        <View className="flex-row items-center gap-[10px] my-[22px]">
          <View className="flex-1 h-px bg-border" />
          <Text className="font-sans text-t3 uppercase" style={{ fontSize: 11, letterSpacing: 0.9 }}>o continúa con</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        <View className="flex-row mb-2">
          <GhostButton>
            <Text style={{ fontSize: 16 }}></Text>
            <Text className="font-sans-medium text-text text-sm">Apple</Text>
          </GhostButton>
          <View style={{ width: 10 }} />
          <GhostButton>
            <GoogleIcon />
            <Text className="font-sans-medium text-text text-sm">Google</Text>
          </GhostButton>
        </View>

        <View style={{ flex: 1 }} />

        <Link href="/(auth)/register" asChild>
          <Pressable className="pt-[18px] items-center">
            <Text className="font-sans text-t2 text-sm">
              ¿No tienes cuenta?{' '}
              <Text className="font-sans-sb" style={{ color: c.accent }}>Crear una</Text>
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
      <View className="bg-surface absolute rounded-[3.5px]" style={googleStyles.hole} />
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
    width: 7,
    height: 7,
    top: 3.5,
    left: 3.5,
  },
});

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
});
