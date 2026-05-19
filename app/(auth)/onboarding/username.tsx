import { Check, Pencil } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AUTH,
  AuthField,
  OnboardHeader,
  PrimaryButton,
  StepBar,
  alpha,
} from '../../../src/features/auth/components';

export default function OnboardUsernameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('javierml');

  const available = username.length >= 3;

  const handleChange = (v: string) =>
    setUsername(v.toLowerCase().replace(/\s/g, ''));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <OnboardHeader step={3} total={3} onBack={() => router.back()} allowSkip={false} />
      <View style={{ height: 12 }} />
      <StepBar step={3} total={3} />

      <View style={styles.header}>
        <Text style={styles.title}>{'Elige tu nombre\nde lector'}</Text>
        <Text style={styles.subtitle}>
          Así te encontrarán otros lectores en Lexa.
        </Text>
      </View>

      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {username.slice(0, 2).toUpperCase() || '··'}
            </Text>
          </View>
          <Pressable style={styles.editBtn}>
            <Pencil size={12} color={AUTH.text} />
          </Pressable>
        </View>

        <AuthField
          label="Nombre de usuario"
          value={username}
          onChangeText={handleChange}
          autoCapitalize="none"
          icon={
            <Text style={styles.atSign}>@</Text>
          }
          trailing={
            available ? <Check size={16} color="#5CAF7E" /> : undefined
          }
        />

        <Text style={styles.handle}>
          lexa.app/@
          <Text style={{ color: AUTH.text }}>{username || 'tu_nombre'}</Text>
        </Text>
      </View>

      <View style={{ flex: 1 }} />
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <PrimaryButton disabled={!available}>Entrar a Lexa</PrimaryButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH.bg,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 26,
    color: AUTH.text,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: AUTH.t2,
    marginTop: 8,
    fontFamily: 'DMSans_400Regular',
  },
  content: {
    paddingHorizontal: 24,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: alpha(AUTH.accent, 0.18),
    borderWidth: 2,
    borderColor: AUTH.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '700',
    color: AUTH.accent,
    fontFamily: 'DMSans_600SemiBold',
  },
  editBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AUTH.surface,
    borderWidth: 1.5,
    borderColor: AUTH.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atSign: {
    color: AUTH.t3,
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  handle: {
    fontSize: 11,
    color: AUTH.t3,
    marginTop: -8,
    marginLeft: 2,
    fontFamily: 'DMSans_400Regular',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
});
