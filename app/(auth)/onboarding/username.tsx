import { Check, Pencil } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AuthField,
  OnboardHeader,
  PrimaryButton,
  StepBar,
  alpha,
} from '../../../src/features/auth/components';
import { useColors } from '~/theme/colors';

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
      <View className="h-3" />
      <StepBar step={3} total={3} />

      <View className="px-6 mb-6">
        <Text className="font-display-sb text-text text-lg tracking-[-0.3px]">
          {'Elige tu nombre\nde lector'}
        </Text>
        <Text className="font-body text-t2 text-sm mt-2">
          Así te encontrarán otros lectores en Lexa.
        </Text>
      </View>

      <View className="px-6">
        <View className="self-center mb-7 relative">
          <View
            className="w-[92px] h-[92px] rounded-full items-center justify-center border-2"
            style={{ backgroundColor: alpha(c.accent, 0.18), borderColor: c.accent }}
          >
            <Text className="font-body-sb text-[34px]" style={{ color: c.accent }}>
              {username.slice(0, 2).toUpperCase() || '··'}
            </Text>
          </View>
          <Pressable
            className="absolute -bottom-0.5 -right-0.5 w-[30px] h-[30px] rounded-full bg-surface border-[1.5px] border-border items-center justify-center"
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
            <Text className="font-body-md text-t3 text-[14px]">@</Text>
          }
          trailing={
            available ? <Check size={16} color={c.success} /> : undefined
          }
        />

        <Text className="font-body text-t3 -mt-2 ml-0.5 text-[11px]">
          lexa.app/@
          <Text className="text-text">{username || 'tu_nombre'}</Text>
        </Text>
      </View>

      <View className="flex-1" />
      <View
        className="px-6 pt-5"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <PrimaryButton disabled={!available}>Entrar a Lexa</PrimaryButton>
      </View>
    </View>
  );
}
