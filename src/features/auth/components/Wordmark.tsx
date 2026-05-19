import { Text } from 'react-native';

type Props = { size?: number };

export function Wordmark({ size = 22 }: Props) {
  return (
    <Text
      className="font-display-sb text-text"
      style={{ fontSize: size, lineHeight: size * 1.2, letterSpacing: -0.4 }}
    >
      lexa
    </Text>
  );
}
