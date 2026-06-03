import { useEffect, useRef } from "react";
import { Animated, View, type ViewStyle } from "react-native";
import { useColors } from "~/theme/colors";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
  className?: string;
}

/** Bloque de carga con pulso suave. Atom base para skeletons por feature. */
export function Skeleton({ width = "100%", height = 16, radius = 6, style, className }: SkeletonProps) {
  const c = useColors();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={className}
      style={[
        { width, height, borderRadius: radius, backgroundColor: c.sh, opacity },
        style,
      ]}
    />
  );
}
