import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AUTH,
  OnboardHeader,
  PrimaryButton,
  StepBar,
  alpha,
} from '../../../src/features/auth/components';

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
  const [selected, setSelected] = useState(['fantasia', 'realismo', 'dark', 'memorias']);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const enough = selected.length >= 3;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <OnboardHeader step={1} total={3} />
      <View style={{ height: 12 }} />
      <StepBar step={1} total={3} />

      <View style={styles.header}>
        <Text style={styles.title}>¿Qué te gusta leer?</Text>
        <Text style={styles.subtitle}>
          Elige al menos 3 géneros. Personalizaremos tus recomendaciones.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.chips}
        showsVerticalScrollIndicator={false}
      >
        {GENRES.map((g) => {
          const on = selected.includes(g.id);
          return (
            <Pressable
              key={g.id}
              onPress={() => toggle(g.id)}
              style={[
                styles.chip,
                on && {
                  borderColor: AUTH.accent,
                  backgroundColor: alpha(AUTH.accent, 0.14),
                },
              ]}
            >
              <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>
                {g.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.counter}>
          {selected.length} de 3 mínimo seleccionados
        </Text>
        <Link href="/(auth)/onboarding/goal" asChild>
          <PrimaryButton disabled={!enough}>Continuar</PrimaryButton>
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
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: AUTH.surface,
    borderWidth: 1.5,
    borderColor: AUTH.border,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: AUTH.t2,
    fontFamily: 'DMSans_500Medium',
  },
  chipLabelOn: {
    color: AUTH.text,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: alpha(AUTH.border, 0.5),
  },
  counter: {
    fontSize: 12,
    color: AUTH.t3,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'DMSans_400Regular',
  },
});
