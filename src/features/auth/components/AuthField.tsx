import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AUTH, alpha } from './tokens';

type Props = {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  error?: string;
};

export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  icon,
  trailing,
  error,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.row,
          focused && { borderColor: alpha(AUTH.accent, 0.55) },
          error ? { borderColor: AUTH.red } : undefined,
        ]}
      >
        {icon && <View style={[styles.icon, focused && { opacity: 1 }]}>{icon}</View>}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={AUTH.t3}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {trailing && <View style={styles.trailing}>{trailing}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    color: AUTH.t2,
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AUTH.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: AUTH.border,
  },
  icon: {
    opacity: 0.6,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    color: AUTH.text,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    minWidth: 0,
  },
  trailing: {
    flexShrink: 0,
  },
  error: {
    fontSize: 11,
    color: AUTH.red,
    marginTop: 5,
    marginLeft: 2,
    fontFamily: 'DMSans_400Regular',
  },
});
