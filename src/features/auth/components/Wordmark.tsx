import { StyleSheet, Text } from 'react-native';
import { AUTH } from './tokens';

type Props = { size?: number };

export function Wordmark({ size = 22 }: Props) {
  return (
    <Text style={[styles.text, { fontSize: size, lineHeight: size * 1.2 }]}>
      lexa
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    color: AUTH.text,
    letterSpacing: -0.4,
  },
});
