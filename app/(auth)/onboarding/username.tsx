import { Check, Pencil } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AuthField,
  OnboardHeader,
  PrimaryButton,
  StepBar,
  alpha,
} from '../../../src/features/auth/components';
import { useColors } from '@/src/lib/colors';

export default function OnboardUsernameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [username, setUsername] = useState('javierml');

  const available = username.length >= 3;

  const handleChange = (v: string) =>
    setUsername(v.toLowerCase().replace(/\s/g, ''));

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <OnboardHeader step={3} total={3} onBack={() => router.back()} allowSkip={false} />
      <View style={{ height: 12 }} />
      <StepBar step={3} total={3} />

      <View className="px-6 mb-6">
        <Text className="font-serif-sb text-text" style={{ fontSize: 26, lineHeight: 32, letterSpacing: -0.3 }}>
          {'Elige tu nombre\nde lector'}
        </Text>
        <Text className="font-sans text-t2 text-sm mt-2">
          Así te encontrarán otros lectores en Lexa.
        </Text>
      </View>

      <View className="px-6">
        <View className="self-center mb-7 relative">
          <View
            className="w-[92px] h-[92px] rounded-full items-center justify-center"
            style={{
              backgroundColor: alpha(c.accent, 0.18),
              borderWidth: 2,
              borderColor: c.accent,
            }}
          >
            <Text className="font-sans-sb text-[34px]" style={{ color: c.accent }}>
              {username.slice(0, 2).toUpperCase() || '··'}
            </Text>
          </View>
          <Pressable
            className="absolute -bottom-0.5 -right-0.5 w-[30px] h-[30px] rounded-full bg-surface border border-border items-center justify-center"
            style={{ borderWidth: 1.5 }}
          >
            <Pencil size={12} color={undefined} className="text-text" />
          </Pressable>
        </View>

        <AuthField
          label="Nombre de usuario"
          value={username}
          onChangeText={handleChange}
          autoCapitalize="none"
          icon={
            <Text className="font-sans-medium text-t3" style={{ fontSize: 14 }}>@</Text>
          }
          trailing={
            available ? <Check size={16} color={c.success} /> : undefined
          }
        />

        <Text className="font-sans text-t3 -mt-2 ml-0.5" style={{ fontSize: 11 }}>
          lexa.app/@
          <Text className="text-text">{username || 'tu_nombre'}</Text>
        </Text>
      </View>

      <View style={{ flex: 1 }} />
      <View
        className="px-6 pt-5"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <PrimaryButton disabled={!available}>Entrar a Lexa</PrimaryButton>
      </View>
    </View>
  );
}
