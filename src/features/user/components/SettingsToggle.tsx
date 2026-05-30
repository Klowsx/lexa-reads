import { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { useColors } from '~/theme/colors';

interface Props {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export function SettingsToggle({ on, onChange, disabled }: Props) {
  const c = useColors();
  const anim = useRef(new Animated.Value(on ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: on ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [on]);

  return (
    <Pressable
      onPress={() => !disabled && onChange(!on)}
      className="rounded-full justify-center shrink-0 border"
      style={{
        width: 44,
        height: 26,
        backgroundColor: on ? c.accent : c.sh,
        borderColor: on ? c.accent : c.border,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Animated.View
        className="absolute rounded-full"
        style={{
          width: 20,
          height: 20,
          backgroundColor: on ? '#fff' : c.t3,
          left: anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] }),
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 3,
        }}
      />
    </Pressable>
  );
}
