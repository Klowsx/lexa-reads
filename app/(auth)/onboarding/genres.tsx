import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  OnboardHeader,
  PrimaryButton,
  StepBar,
  alpha,
} from '../../../src/features/auth/components';
import { useColors } from '~/theme/colors';

const GENRES = [
  { id: 'fantasia',  label: 'Fantasía' },
  { id: 'realismo',  label: 'Realismo mágico' },
  { id: 'dark',      label: 'Dark Academia' },
  { id: 'romance',   label: 'Romance' },
  { id: 'misterio',  label: 'Misterio' },
  { id: 'scifi',     label: 'Ciencia ficción' },
  { id: 'memorias',  label: 'Memorias' },
  { id: 'ensayo',    label: 'Ensayo' },
  { id: 'clasico',   label: 'Clásicos' },
  { id: 'historico', label: 'Histórico' },
  { id: 'poesia',    label: 'Poesía' },
  { id: 'terror',    label: 'Terror' },
];

export default function OnboardGenresScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [selected, setSelected] = useState(['fantasia', 'realismo', 'dark', 'memorias']);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const enough = selected.length >= 3;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <OnboardHeader step={1} total={3} />
      <View className="h-3" />
      <StepBar step={1} total={3} />

      <View className="px-6 mb-4">
        <Text className="font-display-sb text-text text-lg tracking-[-0.3px]">
          ¿Qué te gusta leer?
        </Text>
        <Text className="font-body text-t2 text-sm mt-2">
          Elige al menos 3 géneros. Personalizaremos tus recomendaciones.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {GENRES.map((g) => {
          const on = selected.includes(g.id);
          return (
            <Pressable
              key={g.id}
              onPress={() => toggle(g.id)}
              className="py-[10px] px-[14px] rounded-full bg-surface border-[1.5px] border-border"
              style={on ? { borderColor: c.accent, backgroundColor: alpha(c.accent, 0.14) } : undefined}
            >
              <Text
                className={`font-body-md text-sm ${on ? 'text-text' : 'text-t2'}`}
                style={on ? { color: c.accent } : undefined}
              >
                {g.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View
        className="px-6 pt-5 border-t border-border/50"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <Text className="font-body text-t3 text-center mb-3 text-xs">
          {selected.length} de 3 mínimo seleccionados
        </Text>
        <Link href="/(auth)/onboarding/goal" asChild>
          <PrimaryButton disabled={!enough}>Continuar</PrimaryButton>
        </Link>
      </View>
    </View>
  );
}

