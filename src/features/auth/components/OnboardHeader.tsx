import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AUTH } from './tokens';

type Props = {
  step: number;
  total: number;
  onBack?: () => void;
  allowSkip?: boolean;
  onSkip?: () => void;
};

export function OnboardHeader({ step, total, onBack, allowSkip = true, onSkip }: Props) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.stepLabel}>Paso {step} de {total}</Text>
      {allowSkip ? (
        <Pressable onPress={onSkip} hitSlop={8}>
          <Text style={styles.skip}>Saltar</Text>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexShrink: 0,
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
    width: 32,
  },
  arrow: {
    fontSize: 26,
    color: AUTH.text,
    lineHeight: 26,
    fontFamily: 'DMSans_300Light',
  },
  stepLabel: {
    fontSize: 11,
    color: AUTH.t3,
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  skip: {
    fontSize: 13,
    fontWeight: '500',
    color: AUTH.t2,
    fontFamily: 'DMSans_500Medium',
  },
  placeholder: {
    width: 32,
  },
});
